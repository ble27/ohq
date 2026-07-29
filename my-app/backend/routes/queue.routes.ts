import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { CreateQueueValidationSchema } from '../schemas/queue.schema.js';
import { ZodError } from 'zod';

const router: Router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const queueId = req.params.id;
    if (!queueId) {
      res.status(400).json({ message: 'Queue ID is required' });
      return;
    }

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      res.status(404).json({ message: 'Queue Not Found!' });
      return;
    }

    res.status(200).json({ queue, message: 'SUCCESS' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected database error occurred.' });
    }
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQueue = CreateQueueValidationSchema.parse(req.body);

    const newQueue = await prisma.queue.create({ data: validatedQueue });
    res.status(201).json({ queue: newQueue, message: 'CREATED' });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to create queue' });
  }
});

router.patch('/toggle/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const queueId = req.params.id;
    if (!queueId) {
      res.status(400).json({ message: 'Queue ID is required' });
      return;
    }

    const queueToToggle = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queueToToggle) {
      res.status(404).json({ message: 'Queue not found' });
      return;
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queueId },
      data: { isOpen: !queueToToggle.isOpen },
    });

    res.status(200).json({
      queue: updatedQueue,
      message: `Queue successfully toggled to ${updatedQueue.isOpen}`,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to toggle queue' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const queueId = req.params.id;
    if (!queueId) {
      res.status(400).json({ message: 'Queue ID is required' });
      return;
    }

    const queueToDelete = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queueToDelete) {
      res.status(404).json({ message: 'Queue not found' });
      return;
    }

    await prisma.queue.delete({
      where: { id: queueId },
    });

    res.status(200).json({ message: 'Queue successfully deleted' });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to delete queue' });
  }
});

export const queueRouter = router;
