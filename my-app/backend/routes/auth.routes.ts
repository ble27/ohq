import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router: Router = Router();

router.post('/signup', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })
    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        res.status(200).json({ data });
    }
    console.log('Signed up successfully');
    console.log(data);
    return res.status(200).json({ data });
});

router.post('/signin', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (error) {
        res.status(400).json({ error: error.message });
    }
    
    const { access_token, refresh_token } = data?.session || {};

    // Set httpOnly cookie with the access token and refresh token
    res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 20, // 20 minutes
    });
    res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    console.log('Signed in successfully');
    console.log(data);
    return res.status(200).json({ data });
});

router.post('/signout', async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    console.log('Signed out successfully');
    return res.status(200).json({ message: 'Signed out successfully' });
});

export const authRouter = router;