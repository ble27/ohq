import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { QueueValidationSchema } from '../schemas/queue.schema.js';
import { ZodError } from 'zod';

const router: Router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const queueId = req.params.id;
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      res.status(404).json({ message: 'Queue Not Found!' });
      return;
    }

    res.status(200).json({ queue: queue, message: 'SUCCESS' });
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
        const validatedQueue = QueueValidationSchema.parse(req.body);
        const { id, createdAt, updatedAt, ...creationData } = validatedQueue;
        const newQueue = await prisma.queue.create({ data: creationData });
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
        // Look up a queue based on id
        const queueId = req.params.id;
        const queueToDelete = await prisma.queue.findUnique({
            where: { id: queueId }
        })
        if (!queueToDelete) {
            res.status(404).json({ message: 'Queue cannot be deleted due to not found' });
        }
        const status = await prisma.queue.delete({
            where: { id: queueToDelete?.id },
            data: { isOpen: !queueToDelete?.isOpen }
        })
        res.status(200).json({message: `Queue successfully toggled ${queueToDelete?.isOpen}`})
    } catch (error) {
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

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        // Look up a queue based on id
        const queueId = req.params.id;
        const queueToUpdate = await prisma.queue.findUnique({
            where: { id: queueId }
        })
        if (!queueToUpdate) {
            res.status(404).json({ message: 'Queue not found' });
        }
        const status = await prisma.queue.update({
            where: { id: queueToUpdate?.id },
            data: { isOpen: !queueToUpdate?.isOpen }
        })
        res.status(200).json({message: `Queue successfully toggled ${queueToUpdate?.isOpen}`})
    } catch (error) {
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

export const queueRouter = router;