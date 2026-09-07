import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Role } from '../generated/prisma/client.js';
import type { Queue, QueueTicket, User } from '../generated/prisma/client.js';

// authMiddleware attaches the Supabase auth user to req.user. These middlewares
// add role/ownership checks and attach fetched Prisma rows so routes don't re-query.
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

/**
 * True if `userId` may view queue ticket data for `queue`: the queue's
 * TA/PROFESSOR, or a student who holds any ticket in that queue (including
 * past LEFT/COMPLETED rows). Shared by the REST middleware below and the
 * Socket.IO handlers in `app.ts`, so both surfaces enforce the same rule.
 */
export async function canViewQueue(queue: Queue, userId: string): Promise<boolean> {
    if (await isQueueManager(queue, userId)) return true;
    const participantTicket = await prisma.queueTicket.findFirst({
        where: { queueId: queue.id, studentId: userId },
    });
    return participantTicket !== null;
}

/**
 * Requires the caller to read queue ticket lists: the queue's TA/PROFESSOR, or a student
 * who holds any ticket in that queue (including past LEFT/COMPLETED rows).
 */
export function requireQueueViewerAccess(paramName: string = 'queueId') {
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
            if (!(await canViewQueue(queue, authUserId))) {
                res.status(403).json({ message: 'You do not have access to this queue' });
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
 * Requires the caller to read a single ticket: the ticket's student, or the queue's TA/PROFESSOR.
 */
export function requireTicketReadAccess(paramName: string = 'queueTicketId') {
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
            if (ticket.studentId === authUserId) {
                req.ticket = ticket;
                next();
                return;
            }
            const queue = await prisma.queue.findUnique({ where: { id: ticket.queueId } });
            if (!queue) {
                res.status(404).json({ message: 'Queue not found' });
                return;
            }
            if (await isQueueManager(queue, authUserId)) {
                req.ticket = ticket;
                req.queue = queue;
                next();
                return;
            }
            res.status(403).json({ message: 'Forbidden' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    };
}

/** True if `userId` is the queue's TA, or holds the PROFESSOR role (can manage any queue). */
export async function isQueueManager(queue: Queue, userId: string): Promise<boolean> {
    if (queue.taId === userId) return true;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.role === Role.PROFESSOR;
}
