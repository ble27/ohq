import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Prisma, SessionStatus, Role } from '../generated/prisma/client.js';
import { joinQueue, leaveQueue, listActiveTickets } from '../services/queue.services.js';
import { startHelping } from '../services/queue.services.js';

import type {
    ApiMessageResponse,
    QueueTicket,
    QueueTicketResponse,
    QueueTicketsListResponse,
    QueueTicketWithStudent,
} from '../../shared/types.js';

import { CreateQueueTicketValidationSchema, LeaveTicketStatusSchema } from '../schemas/queueticket.schema.js';
import { ZodError } from 'zod';
import { requireQueueOwnership, requireRole, requireTicketQueueOwnership, requireSelf, requireQueueViewerAccess, requireTicketReadAccess } from '../middlewares/authz.middleware.js';
import { queueJoinRateLimiter } from '../middlewares/rateLimit.middleware.js';
const router: Router = Router();

// GET /api/queueticket — list every ticket across all queues. PROFESSOR only (admin-style view).
// TAs only manage their own queue(s) — giving them a system-wide dump would leak every
// other TA's/course's tickets, so this is intentionally narrower than most TA-accessible routes.
router.get('/', requireRole(Role.PROFESSOR), async (_req: Request, res: Response): Promise<void> => {
    try {
        const tickets = await prisma.queueTicket.findMany();
        const body: QueueTicketsListResponse = { tickets, message: 'SUCCESS' };

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
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
});

// GET /api/queueticket/queues/:queueId — active (WAITING/HELPING) tickets for a queue.
router.get('/queues/:queueId', requireQueueViewerAccess('queueId'), async (req: Request, res: Response): Promise<void> => {
    try {
        
        const queueId = req.params.queueId as string;
        if (!queueId) {
            res.status(400).json({ message: 'Queue ID is required' });
            return;
        }
        const ticketsResponse = await listActiveTickets(queueId);
        const ticketsArray: QueueTicketWithStudent[] = ticketsResponse;


        const body: QueueTicketsListResponse = {
            tickets: ticketsArray,
            message: `Successfully fetched tickets from queue ${queueId}`,
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
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
});

// GET /api/queueticket/queues/:queueId/status/completed — completed tickets for a queue.
router.get('/queues/:queueId/status/completed', requireQueueOwnership('queueId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;
        if (!queueId) {
            res.status(400).json({ message: 'Queue ID is required' });
            return;
        }
        const ticketsResponse = await prisma.queueTicket.findMany({
            where: {queueId, status: 'COMPLETED'}, 
            orderBy: {updatedAt: 'asc'}, 
            include: {student: true}
        })

        const ticketsArray: QueueTicket[] = ticketsResponse;


        const body: QueueTicketsListResponse = {
            tickets: ticketsArray,
            message: `Successfully fetched tickets from queue ${queueId}`,
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
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
});


// GET /api/queueticket/user/:studentId — tickets for the authenticated student only
router.get('/user/:studentId', requireSelf('studentId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = req.params.studentId;
        if (!studentId) {
            res.status(404).json({ message: 'Missing required parameter'})
            return;
        }

        const tickets = await prisma.queueTicket.findMany({
            where: { studentId },
            include: { queue: { include: { ta: true } } }
        });

        if (!tickets) {
            res.status(404).json({ message: 'No ticket found' });
            return;
        }


        const body: QueueTicketsListResponse = {
            tickets,
            message: `Tickets successfully sent to ${studentId}`
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
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
});


// GET /api/queueticket/:queueTicketId — single ticket
router.get('/:queueTicketId', requireTicketReadAccess('queueTicketId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const queueTicketId = req.params.queueTicketId;
        if (!queueTicketId) {
            res.status(404).json({ message: 'Missing required parameter'})
            return;
        }

        const ticket = await prisma.queueTicket.findUnique({
            where: { id: queueTicketId },
        });
        if (!ticket) {
            res.status(404).json({ message: 'No ticket found' });
            return;
        }


        const body: QueueTicketResponse = {
            ticket,
            message: `Successfully fetched ticket ${ticket.id}`,
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
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
});

// POST /api/queueticket/queues/:queueId — join a queue (create or reactivate ticket).
router.post('/queues/:queueId', queueJoinRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;
        const status  = req.body.status as SessionStatus;
        const studentId = (req as any).user.id;

        const validatedTicket = CreateQueueTicketValidationSchema.parse({
            ...req.body, status, queueId, studentId
        });

        // A student may only be actively WAITING/HELPING in one queue at a time.
        // Must filter by status — otherwise any past ticket (COMPLETED/LEFT/REMOVED)
        // would permanently block that student from ever joining a queue again.
        const existingActiveTicket = await prisma.queueTicket.findFirst({
            where: {
                studentId,
                status: { in: [SessionStatus.WAITING, SessionStatus.HELPING] },
            },
        })
        if (existingActiveTicket && existingActiveTicket.queueId !== queueId) {
            res.status(409).json({ message: 'Only 1 queue can be joined at a time. Please leave your current queue before joining another one.' });
            return;
        }
        const newTicket = await joinQueue(queueId, studentId);


        const body: QueueTicketResponse = {
            ticket: newTicket,
            message: 'SUCCESS',
        };

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
        res.status(500).json({ message: 'Failed to create ticket' });
    }
});

// PATCH /api/queueticket/:id — leaves a queue (the only status transition this endpoint supports). Ticket owner only.
router.patch('/:queueTicketId', queueJoinRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.queueTicketId;
        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        LeaveTicketStatusSchema.parse(req.body);

        const existingTicket = await prisma.queueTicket.findUnique({
            where: { id: ticketId },
        });
        if (!existingTicket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        const studentId = (req as any).user.id;
        if (existingTicket.studentId !== studentId) {
            res.status(403).json({ message: 'You cannot leave another student’s ticket' });
            return;
        }

        const updatedTicket = await leaveQueue(existingTicket.queueId, studentId);
        const body: QueueTicketResponse = {
            ticket: updatedTicket,
            message: 'SUCCESS',
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
        res.status(500).json({ message: 'Failed to update ticket' });
    }
});

// PATCH /api/queueticket/:queueTicketId/status/helping — moves a ticket to HELPING. TA who owns the queue only.
router.patch('/:queueTicketId/status/helping', requireTicketQueueOwnership('queueTicketId'), async (req: Request, res: Response) => {
    try {
        const queueTicketId = req.params.queueTicketId as string;
        const ticketResponse = await startHelping(queueTicketId);

        const body = {
            ticket: ticketResponse, 
            message: 'Successfully updated ticket status to "Helping"'
        }
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to update ticket\'s status to being helped' });
    }
})

// PATCH /api/queueticket/:queueTicketId/status/completed — TA marks a HELPING ticket complete.
router.patch('/:queueTicketId/status/completed', requireTicketQueueOwnership('queueTicketId'), async (req: Request, res: Response) => {
    try {
        const queueTicketId = req.params.queueTicketId as string;

        const ticketResponse = await prisma.queueTicket.update({
            where: {id: queueTicketId, status: 'HELPING'},
            data: {status: 'COMPLETED'}
        })
        const body = {
            ticket: ticketResponse, 
            message: 'Successfully updated ticket status to "Completed"'
        }
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              res.status(404).json({ message: 'Queue ticket not found' });
              return;
            }
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to update ticket\'s status to completed' });
    }
})

// DELETE /api/queueticket/:id — removes a single ticket. TA who owns the queue only.
router.delete('/:queueTicketId', requireTicketQueueOwnership('queueTicketId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.queueTicketId;
        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        const ticketToDelete = await prisma.queueTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticketToDelete) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }
        await prisma.queueTicket.delete({
            where: { id: ticketId },
        });

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
        res.status(500).json({ message: 'Failed to delete ticket' });
    }
});

// DELETE /api/queueticket/queues/:queueId — removes all tickets in a queue. TA-owner only.
router.delete('/queues/:queueId', requireQueueOwnership('queueId'), async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;

        if (!queueId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        const ticketsToDelete = await prisma.queueTicket.deleteMany({
            where: { queueId },
        });
        if (!ticketsToDelete) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

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
        res.status(500).json({ message: 'Failed to delete all tickets' });
    }
});

// DELETE /api/queueticket/queues/:queueId/status/completed — clears completed tickets. TA-owner only.
router.delete(`/queues/:queueId/status/completed`, requireQueueOwnership('queueId'), async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const deletedTickets = await prisma.queueTicket.deleteMany({
            where: {queueId, status: 'COMPLETED'}
        })
        const body = {
            tickets: deletedTickets, 
            message: `Successfully deleted all completed tickets from queue ${queueId}`
        }
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            console.error(error);
            return;
        }
        res.status(500).json({ message: 'Failed to delete all completed tickets' });
    }
})

// DELETE /api/queueticket/queues/:queueId/status/closed — clears waiting and helping tickets. TA-owner only.
router.delete('/queues/:queueId/status/closed', requireQueueOwnership('queueId'), async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const deletedTickets = await prisma.queueTicket.deleteMany({
            where: { queueId , status: { in: [SessionStatus.WAITING, SessionStatus.HELPING] } }, 
        })
        const body = {
            tickets: deletedTickets, 
            message: `Successfully deleted all tickets currently waiting and helping from queue ${queueId}`
        }
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            console.error(error);
            return;
        }
        res.status(500).json({ message: 'Failed to delete all tickets' });
    }
})

export const queueTicketRouter = router;
