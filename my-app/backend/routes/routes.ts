import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.ts'

// Initialize the router instance
const router: Router = Router();

// Define routes using built-in Express types
router.get ('/queues/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.id;
        const queue = await prisma.queue.findUnique({
            where: { id: queueId },
        });
        res.status(200).json({queue: queue, message: 'SUCCESS'});

        if (!queue) {
            res.status(404).json({ message: 'Queue Not Found!' });
            return; 
        }

    }
    catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected database error occurred.' });
        }
    }
});

router.post('/queues', async (req: Request, res: Response): Promise<void> => {
    try {
        const newQueue = await prisma.queue.create({
            data: req.body,
        });
        res.status(201).json({ queue: newQueue, message: 'CREATED' });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Failed to create queue' });
    }
});

// Export the router using a named export
export const itemRouter = router;
