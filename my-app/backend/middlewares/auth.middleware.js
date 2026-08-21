import { supabase } from '../config/supabase.js';
import { setAuthCookies } from '../routes/auth.routes.js';
// Middleware for backend to verify with Supabase Auth API for standard API requests
export default async function authMiddleware(req, res, next) {
    try {
        const access_token = req.cookies?.access_token;
        const response = access_token ? await supabase.auth.getUser(access_token) : null;
        if (!response?.data.user) {
            // Fallback flow: access token missing/expired — refresh using the refresh token.
            console.log('Fallback to fetching refresh token');
            const refreshToken = req.cookies?.refresh_token;
            if (!refreshToken)
                return res.status(401).json({ error: 'Unauthorized' });
            const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
            if (error || !data.session) {
                console.error('Failed to refresh session:', error?.message ?? 'no session returned');
                return res.status(401).json({ error: 'Unauthorized' });
            }
            setAuthCookies(res, data.session);
            req.user = data.user;
            next();
            return;
        }
        // Normal flow: access token is still valid, no Supabase network round trip needed beyond getUser.
        req.user = response.data.user;
        next();
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=auth.middleware.js.map