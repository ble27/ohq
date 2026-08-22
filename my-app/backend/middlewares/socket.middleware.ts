import 'dotenv/config';
import { supabase } from '../config/supabase.js'
import { Socket } from "socket.io";
import { verifySupabaseAccessToken } from '../utils/verifyAccessToken.js';

function tokenFromCookieHeader(cookieHeader: string | undefined): string | undefined {
    return cookieHeader
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('access_token='))
        ?.slice('access_token='.length);
}

// Next is a callback function that will display the error
export const socketMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Prefer handshake auth — production sockets hit Render directly while
        // httpOnly cookies live on the Vercel frontend origin.
        const rawToken =
            (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token)
            || tokenFromCookieHeader(socket.request.headers.cookie);

        if (!rawToken) {
            next(new Error('Authentication error: missing access token'));
            return;
        }
        const decodedToken = decodeURIComponent(rawToken);

        // Happy path: verify the JWT locally instead of a Supabase Auth round
        // trip on every socket connection (frequent — every page load/reconnect).
        const localUser = await verifySupabaseAccessToken(decodedToken);
        if (localUser) {
            (socket as any).user = localUser;
            next();
            return;
        }

        // Fallback: local verification failed (expired/rotated key/etc) — confirm with Supabase.
        const { data, error } = await supabase.auth.getUser(decodedToken);
        if (!data.user || error) {
            console.error('[SOCKET AUTH] getUser fallback failed:', error);
            next(new Error("Authentication error: " + (error?.message || "Unknown error")));
            return;
        }
        (socket as any).user = data.user;
        next();
        return;
    } catch (error) {
        console.error('[SOCKET AUTH] unexpected error:', error);
        next(new Error("Authentication error: " + (error as Error).message));
        return;
    }
}
