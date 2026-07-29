import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { ZodError } from 'zod';
import { UserValidatedSchema } from '../schemas/user.schema.js';

const router: Router = Router();

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

    res.status(200).json({ user, message: `Successfully fetched user ${userId}` });
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
        id: validatedUser.id,
        email: validatedUser.email,
        role: validatedUser.role,
        name: validatedUser.name ?? null,
      },
    });

    res.status(201).json({ user: newUser, message: 'User created' });
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

    res.status(200).json({ message: `User ${userId} successfully deleted` });
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
