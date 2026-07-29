import { Router } from 'express';
import type { Request, Response } from 'express';
// import { prisma } from '../prisma.js';
import type {
    ApiMessageResponse,
    User,
    UserResponse,
} from '../../shared/types.js';
import { ZodError } from 'zod';
import { UserValidatedSchema } from '../schemas/user.schema.js';

const router: Router = Router();

// MOCK: sample users — swap for prisma.user.* when DB is ready
const mockUsers: User[] = [
    {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'ta@tamu.edu',
        name: 'Alex TA',
        role: 'TA',
    },
    {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'student@tamu.edu',
        name: 'Sam Student',
        role: 'STUDENT',
    },
];

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        // const user = await prisma.user.findUnique({
        //     where: { id: userId },
        // });
        // if (!user) {
        //     res.status(404).json({ message: 'No user found' });
        //     return;
        // }

        const user = mockUsers.find((u) => u.id === userId) ?? {
            ...mockUsers[0]!,
            id: userId,
        };

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
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedUser = UserValidatedSchema.parse(req.body);

        // const existingUser = await prisma.user.findUnique({
        //     where: { id: validatedUser.id },
        // });
        // if (existingUser) {
        //     res.status(409).json({ message: 'User already exists' });
        //     return;
        // }
        // const newUser = await prisma.user.create({
        //     data: {
        //         id: validatedUser.id,
        //         email: validatedUser.email,
        //         role: validatedUser.role,
        //         name: validatedUser.name ?? null,
        //     },
        // });

        const newUser: User = {
            id: validatedUser.id,
            email: validatedUser.email,
            role: validatedUser.role,
            name: validatedUser.name ?? null,
        };

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

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        // const user = await prisma.user.findUnique({
        //     where: { id: userId },
        // });
        // if (!user) {
        //     res.status(404).json({ message: 'User cannot be deleted due to not found' });
        //     return;
        // }
        // await prisma.user.delete({
        //     where: { id: userId },
        // });

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
