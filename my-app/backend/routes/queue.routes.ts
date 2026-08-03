import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

import type {
    ApiMessageResponse,
    Queue,
    QueueResponse,
    QueuesListResponse,
} from '../../shared/types.js';
import { CreateQueueValidationSchema } from '../schemas/queue.schema.js';
import { ZodError } from 'zod';

const router: Router = Router();

// GET /api/queues — list all (mock list payload for ClassSelector)
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const queues = await prisma.queue.findMany(
            { where: { isOpen: true } }
        );
        const body: QueuesListResponse = { queues, message: 'SUCCESS' };

        console.log(`[QUEUE] Successfully sent queue objects: ${JSON.stringify(body.queues, null, 2)}`)

        res.status(200).json(body);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected database error occurred.' });
        }
    }
});

// GET /api/queues/:id — single queue
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.id;
        if (!queueId) {
            res.status(400).json({ message: 'Queue ID is required' });
            return;
        }

        const queue = await prisma.queue.findUnique({ where: { id: queueId } });
        if (!queue) {
            res.status(404).json({ message: 'Queue Not Found!' });
            return;
        }        
        const body: QueueResponse = { queue, message: 'SUCCESS' };
        console.log(`[QUEUE] Successfully sent queue object: ${JSON.stringify(body.queue, null, 2)}`)
        res.status(200).json(body);
    }
     catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected database error occurred.' });
        }
    }
});

// GET /api/queues/:courseId select all queues based on courseId != course code
router.get('/course/:courseId', async (req: Request, res: Response): Promise<void> => { 
    try { 
      const courseId = req.params.courseId as string; 
      const activeQueues = await prisma.queue.findMany({ 
        where: { courseId, isOpen: true } 
    });
    const body: QueuesListResponse = {
        queues: activeQueues,
        message: 'SUCCESS'
    }
    console.log('Sent active queues from /api/queues/course/:courseId');
    console.log(JSON.stringify(body.queues));
    res.status(200).json(body);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch queues' });
      console.log('Failed to send active queues from /api/queues/course/:courseId');
    }
    
});

// POST /api/queues — create queue
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const requestedCourse = req.body?.courseId;
        const course = typeof requestedCourse === 'string'
            ? await prisma.course.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { id: requestedCourse },
                        { code: { equals: requestedCourse.trim(), mode: 'insensitive' } },
                    ],
                },
            })
            : null;
        if (!course) {
            res.status(400).json({ message: 'Select or enter a valid active course' });
            return;
        }

        const validatedQueue = CreateQueueValidationSchema.parse({
            ...req.body,
            courseId: course.id,
        });
        const newQueue = await prisma.queue.create({ data: validatedQueue });

        console.log(`[QUEUE] Successfully created queue object: ${JSON.stringify(newQueue, null, 2)}`)

        const body: QueueResponse = { queue: newQueue, message: 'SUCCESS' };
        res.status(201).json(body);
    }
     catch (error: unknown) {
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

// PATCH /api/queues/:id — toggle isOpen
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
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

        console.log(`[QUEUE] Successfully toggled queue object: ${JSON.stringify(updatedQueue, null, 2)}`)

        const body: QueueResponse = {
            queue: updatedQueue,
            message: `Queue successfully toggled to ${updatedQueue.isOpen}`,
        };
        res.status(200).json(body);
    } 
    catch (error: unknown) {
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

// DELETE /api/queues/:id
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
        console.log(`[QUEUE] Successfully deleted queue object: ${JSON.stringify(queueToDelete, null, 2)}`)
        const body: ApiMessageResponse = { message: 'SUCCESS' };
        
        res.status(200).json(body);
    }
     catch (error: unknown) {
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
