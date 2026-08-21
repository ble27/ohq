import 'dotenv/config';
import { supabase } from '../config/supabase.js';
import { Socket } from "socket.io";
// Next is a callback function that will display the error
export const socketMiddleware = async (socket, next) => {
    try {
        const cookieHeader = socket.request.headers.cookie;
        const token = cookieHeader
            ?.split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith('access_token='))
            ?.slice('access_token='.length);
        if (!token) {
            next(new Error('Authentication error: missing access token'));
            return;
        }
        // Get the user from supabase auth using the token
        const { data, error } = await supabase.auth.getUser(decodeURIComponent(token));
        if (!data.user || error) {
            console.log(error);
            next(new Error("Authentication error: " + (error?.message || "Unknown error")));
            return;
        }
        socket.user = data.user;
        next();
        return;
    }
    catch (error) {
        console.log(error);
        next(new Error("Authentication error: " + error.message));
        return;
    }
};
//# sourceMappingURL=socket.middleware.js.map