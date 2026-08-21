import type { NextFunction, Request, Response } from 'express';
import { Role } from '../generated/prisma/client.js';
import type { Queue, QueueTicket, User } from '../generated/prisma/client.js';
export type AuthedRequest = Request & {
    user?: {
        id: string;
        email?: string | null;
    };
    appUser?: User;
    queue?: Queue;
    ticket?: QueueTicket;
};
/**
 * Requires the authenticated user's Prisma role to be one of `roles`.
 * Attaches the Prisma `User` row to `req.appUser` for reuse downstream.
 */
export declare function requireRole(...roles: Role[]): (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Requires the caller to manage the Queue identified by `req.params[paramName]`:
 * either `req.user.id === queue.taId`, or the caller has the PROFESSOR role.
 * Attaches the fetched queue to `req.queue`.
 */
export declare function requireQueueOwnership(paramName?: string): (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Requires the caller to manage the Queue that the QueueTicket identified by
 * `req.params[paramName]` belongs to. Attaches the fetched ticket + queue to
 * `req.ticket` / `req.queue`.
 */
export declare function requireTicketQueueOwnership(paramName?: string): (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>;
/** Requires `req.user.id` to equal `req.params[paramName]` (default `'id'`). */
export declare function requireSelf(paramName?: string): (req: AuthedRequest, res: Response, next: NextFunction) => void;
/**
 * Requires the caller to read queue ticket lists: the queue's TA/PROFESSOR, or a student
 * who holds any ticket in that queue (including past LEFT/COMPLETED rows).
 */
export declare function requireQueueViewerAccess(paramName?: string): (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Requires the caller to read a single ticket: the ticket's student, or the queue's TA/PROFESSOR.
 */
export declare function requireTicketReadAccess(paramName?: string): (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>;
/** True if `userId` is the queue's TA, or holds the PROFESSOR role (can manage any queue). */
export declare function isQueueManager(queue: Queue, userId: string): Promise<boolean>;
//# sourceMappingURL=authz.middleware.d.ts.map