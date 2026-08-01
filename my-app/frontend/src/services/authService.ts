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
        throw new Error((error as Error).message);
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
        throw new Error((error as Error).message);
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
        throw new Error((error as Error).message);
    }
}
