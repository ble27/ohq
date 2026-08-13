import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { setAuthCookies } from '../routes/auth.routes.js';

// Middleware for backend to verify with Supabase Auth API for standard API requests
export default async function authMiddleware (req: Request, res: Response, next: NextFunction) {
  try {
    // Every request carries cookies
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Unauthorized' });
    
    // attempt to refresh the current session using refresh token
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (!data.session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    setAuthCookies(res, data.session);
    // Attach the user property onto request before sending to API route to retrieve the actual user
    (req as any).user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}