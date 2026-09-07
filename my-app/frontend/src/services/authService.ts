import axios from 'axios'
import { supabase } from './supabase.js'

const authErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        return data?.error ?? data?.message ?? error.message ?? fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
};

/** Primary auth entry — Google OAuth (any Google account; no domain restriction). */
export const googleSignIn = async () => {
    // The PKCE code_verifier is written to this origin's localStorage. If we
    // kick off the flow from www but the callback lands on the apex domain
    // (or vice versa), the verifier won't be there to exchange the code —
    // see main.tsx for why a stale tab can still be sitting on www.
    if (window.location.hostname === 'www.queueble.app') {
        window.location.replace(
            `${window.location.protocol}//queueble.app${window.location.pathname}${window.location.search}`,
        );
        return;
    }
    // Drop any stale browser session so the callback must exchange the new code.
    await supabase.auth.signOut({ scope: 'local' });

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account consent',
            },
        },
    });
    if (error) {
        throw new Error(error.message);
    }
};

/** Persist a Supabase client session as httpOnly cookies on the Express API. */
export const establishSession = async (access_token: string, refresh_token: string) => {
    try {
        const response = await axios.post(`/api/auth/session`, {
            access_token,
            refresh_token,
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Failed to establish session'), { cause: error });
    }
};

export const signOut = async () => {
    try {
        const response = await axios.post(`/api/auth/signout`, {
        }, {
            withCredentials: true,
        });
        // Clear the Supabase client's browser copy so the next OAuth flow
        // doesn't reuse the previous account's session in localStorage.
        await supabase.auth.signOut({ scope: 'local' });
        if (response.status === 200) {
            return response.data.message;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Sign out failed'), { cause: error });
    }
};

/** Returns the current Supabase user and Prisma profile from httpOnly cookies. */
export const getMeSupabase = async () => {
    try {
        const response = await axios.get(`/api/auth/me`, {
            withCredentials: true,
        });
        return response.data ?? null;
    } catch (error) {
        // 401 when no cookie / invalid session — treat as logged out
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

export const getMePrisma = async (id: string) => {
    const response = await axios.get(`/api/users/${id}`, {
        withCredentials: true,
    });
    return response.data ?? null;
};

export const deleteAccount = async (id: string) => {
    try {
        const response = await axios.delete(`/api/users/${id}`, {
            withCredentials: true,
        });
        return response.data ?? null;
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Failed to delete account'), { cause: error });
    }
};
