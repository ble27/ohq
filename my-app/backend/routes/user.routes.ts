import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type {
    ApiMessageResponse,
    UserResponse,
} from '../../shared/types.js';
import { ZodError } from 'zod';
import { UserValidatedSchema } from '../schemas/user.schema.js';

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

// GET
router.get('/:id', async (req: Request, res: Response) => {
    try { 
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        const user = await prisma.user.findFirst({
            where: { id }
        })
        const body = {
            user: user,
            message: `Successfully fetched user with id ${id}`
        }
        res.status(200).json(body);
    } catch (error) {
        const id = req.params.id;
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Failed to find user ${id}` });        
    }
})

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
