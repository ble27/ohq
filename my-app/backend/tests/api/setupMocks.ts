import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

function testAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['x-test-user-id'];
    if (typeof userId === 'string' && userId.length > 0) {
        (req as Request & { user?: { id: string; email: string } }).user = {
            id: userId,
            email: `${userId}@test.example`,
        };
        next();
        return;
    }
    res.status(401).json({ error: 'Unauthorized' });
}

vi.mock('../../middlewares/auth.middleware.js', () => ({
    default: testAuthMiddleware,
}));

vi.mock('../../prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            upsert: vi.fn(),
        },
        queue: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        queueTicket: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        },
        notification: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        course: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('../../services/queue.services.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../services/queue.services.js')>();
    return {
        ...actual,
        closeExpiredQueues: vi.fn().mockResolvedValue(undefined),
        joinQueue: vi.fn(),
        leaveQueue: vi.fn(),
        listActiveTickets: vi.fn().mockResolvedValue([]),
    };
});
