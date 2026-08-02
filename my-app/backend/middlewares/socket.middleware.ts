import 'dotenv/config';
import { supabase } from '../config/supabase.js'
import { Socket } from "socket.io";

// Next is a callback function that will display the error
export const socketMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Extract token from passed from client
        const token = socket.request.headers.cookie;

        // Get the user from supabase auth using the token
        const { data, error } = await supabase.auth.getUser(token);
        if (!data.user || error) {
            console.log(error);
            next(new Error("Authentication error: " + (error?.message || "Unknown error")));
        }
        (socket as any).user = data.user;
        next();
        return;
    } catch (error) {
        console.log(error);
        next(new Error("Authentication error: " + (error as Error).message));
        return;
    }
}