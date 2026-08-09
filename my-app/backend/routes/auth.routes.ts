import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { prisma } from '../prisma.js';

const router: Router = Router();

// Supabase auth users creates the auth user rows
// User table is the actual user model that Prisma defines

/** Ensure a public.User row exists with the same id as auth.users */
async function ensureAppUser(authUser: { id: string; email?: string | null }) {
    if (!authUser.email) {
        throw new Error('Auth user is missing an email');
    }
    // Create or update the user in the database
    return prisma.user.upsert({
        where: { id: authUser.id },
        create: {
            id: authUser.id, // must equal Supabase auth.users.id
            email: authUser.email,
            role: 'STUDENT',
        },
        update: {
            email: authUser.email,
        },
    });
}

const emailRedirectTo =
    process.env.EMAIL_CONFIRM_REDIRECT_TO ?? 'http://localhost:5173/auth/callback';

router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo,
        },
    });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    if (!data.user) {
        return res.status(400).json({ error: 'Signup succeeded but no auth user was returned' });
    }

    // Create a Prisma user if not already
    try {
        const appUser = await prisma.user.upsert({
            where: { id: data.user.id },
            create: {
                id: data.user.id,
                email: data.user.email ?? email,
                name: name ?? null,
                role: 'STUDENT',
            },
            update: {
                email: data.user.email ?? email,
                ...(name !== undefined ? { name } : {}),
            },
        });

        // Confirm-email enabled → no session yet; client should show /check-email
        const needsConfirmation = !data.session;
        
        // Confirm-email disabled → session returned; set cookies like signin
        if (data.session) {
            res.cookie('access_token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 20 * 1000,
            });
            res.cookie('refresh_token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 * 1000,
            });
        }

        return res.status(200).json({
            data,
            user: appUser,
            needsConfirmation,
            email: data.user.email ?? email,
        });
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to create app user profile',
        });
    }
});

// Resend signup confirmation email (Supabase Auth)
router.post('/resend-confirmation', async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo },
    });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(200).json({ message: 'Confirmation email sent' });
});

router.post('/signin', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    if (!data.user || !data.session) {
        return res.status(400).json({ error: 'Signin succeeded but session was missing' });
    }
    
    const { access_token, refresh_token } = data.session;

    // Set httpOnly cookie with the access token and refresh token
    res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 20 * 1000, // 20 minutes
    });
    res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
    });

    try {
        // Backfill profile if user signed up before Prisma wiring existed
        const appUser = await ensureAppUser(data.user);
        return res.status(200).json({ data, user: appUser });
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to sync app user profile',
        });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    // Look in frontend @ src/routes/auth.routes.ts for withCredentials, where cookie is sent along with
    const accessToken = req.cookies?.access_token;
    if (!accessToken) {
        return res.status(401).json({ user: null });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
        return res.status(401).json({ user: null });
    }

    try {
        const appUser = await prisma.user.findUnique({ where: { id: data.user.id } });
        return res.status(200).json({
            user: data.user,
            profile: appUser,
        });
    } catch {
        return res.status(200).json({ user: data.user, profile: null });
    }
});

router.post('/signout', async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'Signed out successfully' });
});

export const authRouter = router;
