import { supabase } from "./supabase"

// Handle signin, signup, signout

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email, 
        password
    })
    if (error) {
        throw error;
    }
    return data;
}

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })
    if (error) {
        throw error;
    }
    return data;
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
    return true;
}

export const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        throw error;
    }
    return data;
}

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        throw error;
    }
    return data;
}
