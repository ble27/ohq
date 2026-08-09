import axios from 'axios'

// API calls to backend @/api/auth/ for authentication

const authErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        return data?.error ?? data?.message ?? error.message ?? fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
};

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
}

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
}

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
}

// Fetch user from backend in auth.routes.ts
// Used in AuthContextProvider.tsx to set the user state
export const getMe = async () => {
    const response = await axios.get(`/api/auth/me`, {
        withCredentials: true,
    });
    return response.data ?? null;
}

export const PENDING_CONFIRM_EMAIL_KEY = 'pendingConfirmEmail';
