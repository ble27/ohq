import axios from 'axios'

// API calls to backend @/api/auth/ for authentication

export const signIn = async (email: string, password: string) => {
    try {
        const response = await axios.post(`/api/auth/signin`, {
        email, 
        password
    }, {
        // Tell axios to send cookies with the request
        withCredentials: true,
    });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign in failed';
        throw new Error(message, { cause: error });
    }
}

export const signUp = async (email: string, password: string) => {
    try {
        const response = await axios.post(`/api/auth/signup`, {
            email,
            password
        }, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed';
        throw new Error(message, { cause: error });
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
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {  
        const message = error instanceof Error ? error.message : 'Sign out failed';
        throw new Error(message, { cause: error });
    }
}

// Fetch user from backend in auth.routes.ts
// Used in AuthContextProvider.tsx to set the user state
export const getMe = async () => {
    const response = await axios.get(`/api/auth/me`, {
        // Browser sends cookie cookie to server here
        withCredentials: true,
    });
    // user, appUser
    return response.data ?? null;
}
