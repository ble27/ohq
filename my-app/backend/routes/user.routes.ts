import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { NotificationType, User } from '../../shared/types.js';
import type {
    ApiMessageResponse,
    UserResponse,
} from '../../shared/types.js';
import { ZodError } from 'zod';
import { UserValidatedSchema, NotificationAlertUpdateSchema } from '../schemas/user.schema.js';

const NOTIFY_FIELD_BY_TYPE = {
    JOIN: 'notifyJoin',
    LEAVE: 'notifyLeave',
    ASSIST: 'notifyAssist',
    CLOSE: 'notifyClose',
} as const satisfies Record<NotificationType, keyof Pick<User, 'notifyJoin' | 'notifyLeave' | 'notifyAssist' | 'notifyClose'>>;

const router: Router = Router();

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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
                role: validatedUser.role,
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
router.patch('/:id/name', async (req: Request, res: Response) => {
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
router.patch('/:id/notifications/type/:type', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const type = req.params.type as NotificationType;
        const { status } = NotificationAlertUpdateSchema.parse(req.body);

        const notifyField = NOTIFY_FIELD_BY_TYPE[type];
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


// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
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
            res.status(404).json({ message: 'User cannot be deleted due to not found' });
            return;
        }
        await prisma.user.delete({
            where: { id: userId },
        });

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
