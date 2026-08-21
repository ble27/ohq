import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { setAuthCookies } from '../routes/auth.routes.js';
import { verifySupabaseAccessToken } from '../utils/verifyAccessToken.js';

// Middleware for backend to authenticate standard API requests.
export default async function authMiddleware (req: Request, res: Response, next: NextFunction) {
  try {
    const access_token = req.cookies?.access_token;

    // Happy path: verify the JWT's signature + expiry locally — no Supabase
    // Auth network round trip needed for the vast majority of requests.
    const localUser = await verifySupabaseAccessToken(access_token);
    if (localUser) {
      (req as any).user = localUser;
      next();
      return;
    }

    // Fallback flow: access token missing/expired/invalid — refresh using the refresh token.
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      console.error('Failed to refresh session:', error?.message ?? 'no session returned');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    setAuthCookies(res, data.session);
    (req as any).user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}