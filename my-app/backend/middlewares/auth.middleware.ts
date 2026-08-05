import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

// Middleware for backend to verify with Supabase Auth API for standard API requests
export default async function authMiddleware (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user against the token
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach the user property onto request before sending to API route to retrieve the actual user
    (req as any).user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}