import { Router } from 'express';
import type { Request, Response } from 'express';
// import { prisma } from '../prisma.js';
import type {
    ApiMessageResponse,
    Queue,
    QueueResponse,
    QueuesListResponse,
} from '../../shared/types.js';
import { CreateQueueValidationSchema } from '../schemas/queue.schema.js';
import { ZodError } from 'zod';

const router: Router = Router();

// MOCK: sample queues — swap these for prisma.queue.* when DB is ready
const mockQueues: Queue[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        courseId: 'csce-221',
        taId: '22222222-2222-2222-2222-222222222222',
        location: 'ZACH 310',
        isOpen: true,
        createdAt: '2026-07-29T12:00:00.000Z',
        updatedAt: '2026-07-29T12:30:00.000Z',
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        courseId: 'csce-313',
        taId: '22222222-2222-2222-2222-222222222222',
        location: 'HRBB 113',
        isOpen: false,
        createdAt: '2026-07-28T09:00:00.000Z',
        updatedAt: '2026-07-28T18:00:00.000Z',
    },
    {
        id: '13333333-3333-3333-3333-333333333333',
        courseId: 'csce-313',
        taId: '22222222-2222-2222-2222-222222222222',
        location: 'HRBB 113',
        isOpen: true,
        createdAt: '2026-07-28T09:00:00.000Z',
        updatedAt: '2026-07-28T18:00:00.000Z',
    },
    {
        id: '23333333-3333-3333-3333-333333333333',
        courseId: 'csce-221',
        taId: '22222222-2222-2222-2222-222222222222',
        location: 'HRBB 111',
        isOpen: true,
        createdAt: '2026-07-28T09:00:00.000Z',
        updatedAt: '2026-07-28T18:00:00.000Z',
    },
];

// GET /api/queues — list all (mock list payload for ClassSelector)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        // const queues = await prisma.queue.findMany();
        // const body: QueuesListResponse = { queues, message: 'SUCCESS' };

        const body: QueuesListResponse = {
            queues: mockQueues,
            message: 'SUCCESS',
        };
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

        // const queue = await prisma.queue.findUnique({
        //     where: { id: queueId },
        // });
        // if (!queue) {
        //     res.status(404).json({ message: 'Queue Not Found!' });
        //     return;
        // }

        const queue = mockQueues.find((q) => q.id === queueId) ?? {
            ...mockQueues[0]!,
            id: queueId,
        };

        const body: QueueResponse = { queue, message: 'SUCCESS' };
        res.status(200).json(body);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected database error occurred.' });
        }
    }
});

// POST /api/queues — create queue
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedQueue = CreateQueueValidationSchema.parse(req.body);

        // const newQueue = await prisma.queue.create({ data: validatedQueue });

        const newQueue: Queue = {
            id: '44444444-4444-4444-4444-444444444444',
            ...validatedQueue,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const body: QueueResponse = { queue: newQueue, message: 'CREATED' };
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

        // const queueToToggle = await prisma.queue.findUnique({
        //     where: { id: queueId },
        // });
        // if (!queueToToggle) {
        //     res.status(404).json({ message: 'Queue not found' });
        //     return;
        // }
        // const updatedQueue = await prisma.queue.update({
        //     where: { id: queueId },
        //     data: { isOpen: !queueToToggle.isOpen },
        // });

        const existing = mockQueues.find((q) => q.id === queueId) ?? mockQueues[0]!;
        const updatedQueue: Queue = {
            ...existing,
            id: queueId,
            isOpen: !existing.isOpen,
            updatedAt: new Date().toISOString(),
        };

        const body: QueueResponse = {
            queue: updatedQueue,
            message: `Queue successfully toggled to ${updatedQueue.isOpen}`,
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

        // const queueToDelete = await prisma.queue.findUnique({
        //     where: { id: queueId },
        // });
        // if (!queueToDelete) {
        //     res.status(404).json({ message: 'Queue not found' });
        //     return;
        // }
        // await prisma.queue.delete({
        //     where: { id: queueId },
        // });

        const body: ApiMessageResponse = { message: 'Queue successfully deleted' };
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
        res.status(500).json({ message: 'Failed to delete queue' });
    }
});

export const queueRouter = router;
