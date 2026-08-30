import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { prisma } from '../prisma.js';
import { parseGoogleDisplayName } from '../services/authUser.services.js';
import { closeQueuesOnTaLeave, isQueueManagerUser } from '../services/taPresence.service.js';
import { verifySupabaseAccessToken } from '../utils/verifyAccessToken.js';

const router: Router = Router();

/*
 * Supabase dashboard (Google OAuth only):
 * 1. Authentication → Providers → Google: enabled; redirect URL includes {origin}/auth/callback
 * 2. Authentication → Providers → Email: disable sign-ups (or disable email provider)
 * 3. Authentication → URL Configuration: Site URL + Redirect URLs match dev/production origins
 */

/** Ensure a public.User row exists with the same id as auth.users */
async function ensureAppUser(authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
}) {
    if (!authUser.email) {
        throw new Error('Auth user is missing an email');
    }
    const { displayName } = parseGoogleDisplayName(authUser.user_metadata);
    return prisma.user.upsert({
        where: { id: authUser.id },
        create: {
            id: authUser.id,
            email: authUser.email,
            name: displayName,
            role: 'STUDENT',
        },
        update: {
            email: authUser.email,
            ...(displayName ? { name: displayName } : {}),
        },
    });
}

// Frontend (Vercel) proxies /api to this backend, so auth cookies are
// first-party on the Vercel domain. SameSite=Lax works for that same-site
// traffic. Secure is still required in production (HTTPS).
const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
};

export function setAuthCookies(
    res: Response,
    session: { access_token: string; refresh_token: string },
) {
    res.cookie('access_token', session.access_token, {
        ...authCookieOptions,
        maxAge: 60 * 20 * 1000,
    });
    res.cookie('refresh_token', session.refresh_token, {
        ...authCookieOptions,
        maxAge: 60 * 60 * 24 * 30 * 1000,
    });
}

/*
// [email/password — disabled for Google-only auth]
import { ZodError } from 'zod';
import { SigninSchema, SignupSchema } from '../schemas/auth.schema.js';

const emailRedirectTo =
    process.env.EMAIL_CONFIRM_REDIRECT_TO ?? 'http://localhost:5173/auth/callback?type=signup';

router.post('/signup', async (req: Request, res: Response) => { ... });
router.post('/resend-confirmation', async (req: Request, res: Response) => { ... });
router.post('/signin', async (req: Request, res: Response) => { ... });
*/

/** Establish httpOnly cookies from a client-side Supabase session (OAuth PKCE). */
router.post('/session', async (req: Request, res: Response) => {
    const access_token = typeof req.body?.access_token === 'string' ? req.body.access_token : '';
    const refresh_token = typeof req.body?.refresh_token === 'string' ? req.body.refresh_token : '';
    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'access_token and refresh_token are required' });
    }

    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    setAuthCookies(res, { access_token, refresh_token });

    try {
        const appUser = await ensureAppUser(data.user);
        return res.status(200).json({ user: appUser });
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to sync app user profile',
        });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) {
        return res.status(401).json({ user: null });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
        return res.status(401).json({ user: null });
    }

    try {
        const appUser = await prisma.user.findUnique({ where: { id: data.user.id } });
        return res.status(200).json({
            user: data.user,
            profile: appUser,
        });
    } catch {
        return res.status(200).json({ user: data.user, profile: null });
    }
});

/**
 * Socket.IO connects directly to the Render host (WebSockets aren't proxied
 * through Vercel), so it cannot rely on first-party cookies set on the
 * frontend domain. This endpoint returns the access token for the handshake.
 */
router.get('/socket-token', async (req: Request, res: Response) => {
    let accessToken = req.cookies?.access_token;

    const localUser = await verifySupabaseAccessToken(accessToken);
    if (localUser) {
        return res.status(200).json({ token: accessToken });
    }

    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    setAuthCookies(res, data.session);
    return res.status(200).json({ token: data.session.access_token });
});

router.post('/signout', async (req: Request, res: Response) => {
    const accessToken = req.cookies?.access_token;
    let userId: string | undefined;
    if (accessToken) {
        const { data } = await supabase.auth.getUser(accessToken);
        userId = data.user?.id;
        if (userId && await isQueueManagerUser(userId)) {
            try {
                await closeQueuesOnTaLeave(userId);
            } catch (error) {
                console.error('[AUTH] Failed to close TA queues on sign-out:', error);
            }
        }
    }

    res.clearCookie('access_token', authCookieOptions);
    res.clearCookie('refresh_token', authCookieOptions);

    if (accessToken) {
        const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, 'global');
        if (error) {
            console.error('[AUTH] Failed to revoke Supabase sessions on sign-out:', error.message);
        }
    }

    return res.status(200).json({ message: 'Signed out successfully' });
});

export const authRouter = router;
