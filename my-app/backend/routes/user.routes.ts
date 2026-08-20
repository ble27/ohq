import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { NotificationType } from '../../shared/types.js';
import type {
    ApiMessageResponse,
    UserResponse,
} from '../../shared/types.js';
import { ZodError } from 'zod';
import { UserValidatedSchema, NotificationAlertUpdateSchema, DefaultLocationUpdateSchema } from '../schemas/user.schema.js';
import { getNotifyPreferenceField } from '../services/notification.services.js';
import { requireSelf, type AuthedRequest } from '../middlewares/authz.middleware.js';

const router: Router = Router();

// GET /api/users/:id
router.get('/:id', requireSelf('id'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({ message: 'No user found' });
            return;
        }

        const body: UserResponse = {
            user, 
            message: `Successfully fetched user ${userId}`,
        };
        res.status(200).json(body);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to fetch user ${req.params.id}` });
    }
});

// POST /api/users
// Prefer creating profiles via /api/auth/signup (id = auth.users.id).
// This endpoint still requires the caller to pass the Supabase auth user id.
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedUser = UserValidatedSchema.parse(req.body);
        const authUserId = (req as AuthedRequest).user?.id;
        if (!authUserId || authUserId !== validatedUser.id) {
            res.status(403).json({ message: 'You can only create a profile for your own account' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: validatedUser.id },
        });
        if (existingUser) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        const newUser = await prisma.user.create({
            data: {
                id: validatedUser.id, // must be Supabase auth.users.id
                email: validatedUser.email,
                // Never trust a client-supplied role: it would let any caller
                // self-promote to TA/PROFESSOR. New profiles always start as
                // STUDENT; elevate roles via admin tooling only.
                role: 'STUDENT',
                name: validatedUser.name ?? null,
            },
        });

        const body: UserResponse = { user: newUser, message: 'User created' };
        res.status(201).json(body);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to create a new user' });
    }
});

// PATCH user name /api/users/:id/name
router.patch('/:id/name', requireSelf('id'), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const name = req.body.name as string;
        const response = await prisma.user.update({
            where: { id: id }, 
            data: { name }
        })
        const body = {
            user: response,
            message: `Successfully updated user name to ${name}`
        }
        res.status(200).json(body);
    } catch (error) {
        const id = req.params.id;
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to update user name with id ${id}` });        
    }
})

// PATCH notification alerts based on types /api/users/:id/notifications/type/:type
router.patch('/:id/notifications/type/:type', requireSelf('id'), async (req: Request, res: Response) => {
    try {
        console.log('Calling notifications update route');
        const id = req.params.id as string;
        const type = req.params.type as NotificationType;
        const { status } = NotificationAlertUpdateSchema.parse(req.body);

        const notifyField = getNotifyPreferenceField(type);
        if (!notifyField) {
            res.status(400).json({ message: 'Invalid notification type' });
            return;
        }

        // JOIN/LEAVE preferences are TA-only
        if (type === 'JOIN' || type === 'LEAVE') {
            const taUser = await prisma.user.findFirst({
                where: { id, role: 'TA' },
            });
            if (!taUser) {
                res.status(403).json({ message: 'Only TAs can update JOIN/LEAVE notification preferences' });
                return;
            }
        }

        const response = await prisma.user.update({
            where: { id },
            data: { [notifyField]: status }, // use the value of notifyField as the key
        });

        const body = {
            user: response,
            message: `Successfully updated ${notifyField} to ${status}`,
        };
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        const id = req.params.id;
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to update notification alert for user ${id}` });
    }
});

// PATCH /api/users/:id/notifications/sound
router.patch('/:id/notifications/sound', requireSelf('id'), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = NotificationAlertUpdateSchema.parse(req.body);

        const response = await prisma.user.update({
            where: { id },
            data: { notifySound: status },
        });

        res.status(200).json({
            user: response,
            message: `Successfully updated notifySound to ${status}`,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        const id = req.params.id;
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to update sound preference for user ${id}` });
    }
});

// PATCH api/users/${id}/defaultlocation
router.patch('/:id/defaultlocation', requireSelf('id'), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { defaultLocation } = DefaultLocationUpdateSchema.parse(req.body);

        const taUser = await prisma.user.findFirst({
            where: { id, role: 'TA' },
        });
        if (!taUser) {
            res.status(403).json({ message: 'Only TAs can update a default queue location' });
            return;
        }

        const response = await prisma.user.update({
            where: { id },
            data: { defaultLocation },
        });
        res.status(200).json({
            user: response,
            message: `Successfully updated default location to ${defaultLocation}`,
        });
    } catch (error) {
        const id = req.params.id;
        if (error instanceof ZodError) {
            res.status(400).json({ 
             message: 'Validation failed', 
             errors: error.message
           });
            return;
         }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to update default location for ${id}` });
    }
})

// DELETE /api/users/:id
router.delete('/:id', requireSelf('id'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        // App data first so a failed Auth delete can be retried while still signed in.
        const prismaUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (prismaUser) {
            await prisma.user.delete({
                where: { id: userId },
            });
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
            console.error('Failed to delete user from Supabase Auth', deleteError);
            res.status(500).json({ message: 'Failed to delete user from authentication' });
            return;
        }

        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        const body: ApiMessageResponse = {
            message: `User ${userId} successfully deleted`,
        };
        res.status(200).json(body);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to delete user ${req.params.id}` });
    }
});

export const userRouter = router;
