import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

// Middleware for backend to verify with Supabase Auth API for standard API requests
export default async function authMiddleware (req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase.auth.getUser(req.headers.authorization);
    if (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}