import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Role } from '../generated/prisma/client.js';

import type {
    ApiMessageResponse,
    Queue,
    QueueResponse,
    QueuesListResponse,
} from '../../shared/types.js';
import {
    CreateQueueValidationSchema,
    QueueOpenParamSchema,
    RoomLocationParamSchema,
    TimeValidationSchema,
} from '../schemas/queue.schema.js';
import { ZodError } from 'zod';
import { closeExpiredQueues } from '../services/queue.services.js';
import { requireQueueOwnership, requireRole } from '../middlewares/authz.middleware.js';
import type { AuthedRequest } from '../middlewares/authz.middleware.js';

const router: Router = Router();

// GET /api/queues — list all queues that are open
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        await closeExpiredQueues();
        const queues = await prisma.queue.findMany({
            where: { isOpen: true}
        });
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
        // Return the TA of the queue
        const queue = await prisma.queue.findUnique({ 
            where: { id: queueId } , 
            include: { ta: true }
        });
        if (!queue) {
            res.status(404).json({ message: 'Queue Not Found!' });
            return;
        }        
        const body: QueueResponse = { queue, message: 'SUCCESS' };
        console.log(`[QUEUE] Successfully sent queue object`);
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

// GET /api/queues/:courseId - select all queues based on course id (uuid)
router.get('/course/:courseId', async (req: Request, res: Response): Promise<void> => { 
    try { 
        const courseId = req.params.courseId as string; 
        await closeExpiredQueues();
        const activeQueues = await prisma.queue.findMany({ 
            where: { courseId, isOpen: true }, 
            include: { ta: true , course: true} 
        });
        // fix this
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

// POST /api/queues — create a queue. TA/PROFESSOR only; the caller becomes the queue's TA.
// Get requested course code and course ID
router.post('/', requireRole(Role.TA, Role.PROFESSOR), async (req: Request, res: Response): Promise<void> => {
    try {
        const requestedCourse = req.body?.courseId;
        const course = typeof requestedCourse === 'string'
            ? await prisma.course.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { id: requestedCourse },
                        // fix later: code is always text and can never equal courseId
                        { code: { equals: requestedCourse.trim(), mode: 'insensitive' } },
                    ],
                }
            })
            : null;
        if (!course) {
            res.status(400).json({ message: 'Select or enter a valid active course' });
            return;
        }

        const validatedQueue = CreateQueueValidationSchema.parse({
            ...req.body,
            courseId: course.id,
            // Never trust a client-supplied taId — the caller always owns the queue they create.
            taId: (req as any).user.id,
        });
        const { taId, courseId, endsAt, ...queueData } = validatedQueue;

        // 1 queue for each TA for now
        const queueCheck = await prisma.queue.findFirst({
            where: { taId }
        })
        // A queue has already existed
        if (queueCheck) {
            res.status(400).json({ message: 'Only 1 queue can be created per TA. Please delete the current queue and create another one.' });
            return;
        }
        const newQueue = await prisma.queue.create({
            data: {
                courseId, 
                taId,
                ...queueData,
                ...(endsAt != null ? { endsAt } : {}),
            },
        });

        console.log(`[QUEUE] Successfully created queue object`);

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

// PATCH /api/queues/:queueId/status/:isQueueOpen — opens or closes a queue. TA-owner only.
router.patch('/:queueId/status/:isQueueOpen', requireQueueOwnership('queueId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;
        const isQueueOpen = QueueOpenParamSchema.parse(req.params.isQueueOpen) === 'true';

        const result: Queue = await prisma.queue.update({
            where: { id: queueId },
            data: { isOpen: isQueueOpen },
        });

        const body: QueueResponse = {
            queue: result,
            message: `SUCCESSFULLY UPDATED queue status to ${result.isOpen}`,
        };
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to update queue status' });
    }
});

// PATCH /api/queues/:queueId/location/:roomLocation — sets the queue's room location. TA-owner only.
router.patch('/:queueId/location/:roomLocation', requireQueueOwnership('queueId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;
        const roomLocation = RoomLocationParamSchema.parse(decodeURIComponent(req.params.roomLocation as string));

        const result: Queue = await prisma.queue.update({
            where: { id: queueId },
            data: { location: roomLocation },
        });

        const body: QueueResponse = {
            queue: result,
            message: `SUCCESSFULLY UPDATED queue location to ${result.location}`,
        };
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to update queue location' });
    }
});

// PATCH /api/queues/:id — toggles isOpen. TA-owner only.
router.patch('/:id', requireQueueOwnership('id'), async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
        // requireQueueOwnership already fetched and authorized the queue.
        const queueToToggle = req.queue!;
        const queueId = queueToToggle.id;

        // Update the queue's status here
        const updatedQueue = await prisma.queue.update({
            where: { id: queueId },
            data: { isOpen: !queueToToggle.isOpen },
        });

        console.log(`[QUEUE] Successfully updated queue: ${JSON.stringify(updatedQueue, null, 2)}`)

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

// PATCH /api/queues/:queueId/time — updates the queue's start/end time. TA-owner only.
router.patch(`/:queueId/time`, requireQueueOwnership('queueId'), async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const validatedTimeSchema = TimeValidationSchema.parse(req.body);
        const { startsAt, endsAt } = validatedTimeSchema;
        const response = await prisma.queue.update({
            where: { id: queueId },
            data: { startsAt, endsAt }
        })
        const body = { 
            queue: response, 
            message: 'SUCCESS'
        }
        res.status(200).json(body);
    } catch (error) {
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
})

// DELETE /api/queues/:id — TA-owner only.
router.delete('/:id', requireQueueOwnership('id'), async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
        // requireQueueOwnership already fetched and authorized the queue.
        const queueId = req.queue!.id;

        const deletedQueue = await prisma.queue.delete({
            where: { id: queueId },
        });
        
        console.log(`[QUEUE] Successfully deleted queue object: ${JSON.stringify(deletedQueue, null, 2)}`)
        const body: ApiMessageResponse = { message: 'SUCCESS' };
        
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
