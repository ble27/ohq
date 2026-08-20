import axios from 'axios'
import { supabase } from './supabase.js'

// API calls to backend @/api/auth/ for authentication

const authErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        return data?.error ?? data?.message ?? error.message ?? fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
};

/*
// [email/password — disabled for Google-only auth]
export const signIn = async (email: string, password: string) => {
    try {
        const response = await axios.post(`/api/auth/signin`, {
            email,
            password,
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Sign in failed'), { cause: error });
    }
}
*/

/** Primary auth entry — Google OAuth (any Google account; no domain restriction). */
export const googleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
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

/*
// [email/password — disabled for Google-only auth]
export type SignUpResult = {
    data: {
        user: unknown;
        session: unknown;
    };
    user: unknown;
    needsConfirmation: boolean;
    email: string;
};

export const signUp = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    try {
        const response = await axios.post(`/api/auth/signup`, {
            email,
            password,
            name,
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data as SignUpResult;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Sign up failed'), { cause: error });
    }
};

export const resendConfirmation = async (email: string) => {
    try {
        const response = await axios.post(`/api/auth/resend-confirmation`, {
            email,
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Failed to resend confirmation email'), { cause: error });
    }
};

export const PENDING_CONFIRM_EMAIL_KEY = 'pendingConfirmEmail';
*/

export const signOut = async () => {
    try {
        const response = await axios.post(`/api/auth/signout`, {
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data.message;
        }
        throw new Error(response.data.message);
    } catch (error) {
        throw new Error(authErrorMessage(error, 'Sign out failed'), { cause: error });
    }
};

// GET /api/auth/me → { user: SupabaseUser, profile: PrismaUser | null }
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
