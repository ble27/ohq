import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { createSecretKey } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_JWT_SECRET } = process.env;

if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL in backend/.env');
}

// Asymmetric tokens: JWKS is cached by jose (no per-request network call).
const remoteJwks = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

// Legacy HS256 projects: use shared JWT secret when configured.
const legacySecretKey = SUPABASE_JWT_SECRET
    ? createSecretKey(Buffer.from(SUPABASE_JWT_SECRET, 'utf-8'))
    : null;

export type VerifiedSupabaseUser = {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
};

function payloadToUser(payload: JWTPayload): VerifiedSupabaseUser | null {
    if (typeof payload.sub !== 'string') return null;
    const user_metadata =
        typeof payload.user_metadata === 'object' && payload.user_metadata !== null
            ? (payload.user_metadata as Record<string, unknown>)
            : undefined;
    return {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        ...(user_metadata ? { user_metadata } : {}),
    };
}

/**
 * Verifies a Supabase access token's signature + expiry locally, without a
 * network round trip to Supabase Auth. Returns null on any missing/expired/
 * invalid token so callers can fall back to refreshing the session — this is
 * only meant to replace the "happy path" `supabase.auth.getUser()` call that
 * used to run on every single authenticated request and socket connection.
 */
export async function verifySupabaseAccessToken(
    token: string | undefined | null,
): Promise<VerifiedSupabaseUser | null> {
    if (!token) return null;
    try {
        const { payload } = legacySecretKey
            ? await jwtVerify(token, legacySecretKey)
            : await jwtVerify(token, remoteJwks);
        return payloadToUser(payload);
    } catch {
        return null;
    }
}
