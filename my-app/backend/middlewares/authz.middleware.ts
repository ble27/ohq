import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Role } from '../generated/prisma/client.js';
import type { Queue, QueueTicket, User } from '../generated/prisma/client.js';

// authMiddleware attaches the Supabase auth user (id, email, ...) to req.user.
// These middlewares add authorization on top of that: role checks and
// ownership checks (queue TA / ticket's queue TA), and attach the already
// -fetched Prisma rows to the request so route handlers don't re-query them.
export type AuthedRequest = Request & {
    user?: { id: string; email?: string | null };
    appUser?: User;
    queue?: Queue;
    ticket?: QueueTicket;
};

/**
 * Requires the authenticated user's Prisma role to be one of `roles`.
 * Attaches the Prisma `User` row to `req.appUser` for reuse downstream.
 */
export function requireRole(...roles: Role[]) {
    return async (req: AuthedRequest, res: Response, next: NextFunction) => {
        try {
            const authUserId = req.user?.id;
            if (!authUserId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const appUser = await prisma.user.findUnique({ where: { id: authUserId } });
            if (!appUser || !roles.includes(appUser.role)) {
                res.status(403).json({ message: 'Forbidden: insufficient role' });
                return;
            }
            req.appUser = appUser;
            next();
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    };
}

/**
 * Requires the caller to manage the Queue identified by `req.params[paramName]`:
 * either `req.user.id === queue.taId`, or the caller has the PROFESSOR role.
 * Attaches the fetched queue to `req.queue`.
 */
export function requireQueueOwnership(paramName: string = 'queueId') {
    return async (req: AuthedRequest, res: Response, next: NextFunction) => {
        try {
            const authUserId = req.user?.id;
            if (!authUserId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const queueId = req.params[paramName];
            if (!queueId) {
                res.status(400).json({ message: `Missing ${paramName} parameter` });
                return;
            }
            const queue = await prisma.queue.findUnique({ where: { id: queueId } });
            if (!queue) {
                res.status(404).json({ message: 'Queue not found' });
                return;
            }
            const allowed = await isQueueManager(queue, authUserId);
            if (!allowed) {
                res.status(403).json({ message: 'You do not manage this queue' });
                return;
            }
            req.queue = queue;
            next();
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    };
}

/**
 * Requires the caller to manage the Queue that the QueueTicket identified by
 * `req.params[paramName]` belongs to. Attaches the fetched ticket + queue to
 * `req.ticket` / `req.queue`.
 */
export function requireTicketQueueOwnership(paramName: string = 'queueTicketId') {
    return async (req: AuthedRequest, res: Response, next: NextFunction) => {
        try {
            const authUserId = req.user?.id;
            if (!authUserId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const ticketId = req.params[paramName];
            if (!ticketId) {
                res.status(400).json({ message: `Missing ${paramName} parameter` });
                return;
            }
            const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
            if (!ticket) {
                res.status(404).json({ message: 'Ticket not found' });
                return;
            }
            const queue = await prisma.queue.findUnique({ where: { id: ticket.queueId } });
            if (!queue) {
                res.status(404).json({ message: 'Queue not found' });
                return;
            }
            const allowed = await isQueueManager(queue, authUserId);
            if (!allowed) {
                res.status(403).json({ message: 'You do not manage this queue' });
                return;
            }
            req.ticket = ticket;
            req.queue = queue;
            next();
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    };
}

/** Requires `req.user.id` to equal `req.params[paramName]` (default `'id'`). */
export function requireSelf(paramName: string = 'id') {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
        const authUserId = req.user?.id;
        if (!authUserId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (authUserId !== req.params[paramName]) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        next();
    };
}

/** True if `userId` is the queue's TA, or holds the PROFESSOR role (can manage any queue). */
export async function isQueueManager(queue: Queue, userId: string): Promise<boolean> {
    if (queue.taId === userId) return true;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.role === Role.PROFESSOR;
}
