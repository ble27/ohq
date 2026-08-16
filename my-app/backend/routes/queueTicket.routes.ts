import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Prisma, SessionStatus, Role } from '@prisma/client';
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
import { requireQueueOwnership, requireRole, requireTicketQueueOwnership } from '../middlewares/authz.middleware.js';
const router: Router = Router();

// GET /api/queueticket — list every ticket across all queues. TA/PROFESSOR only (admin-style view).
router.get('/', requireRole(Role.TA, Role.PROFESSOR), async (_req: Request, res: Response): Promise<void> => {
    try {
        const tickets = await prisma.queueTicket.findMany();
        const body: QueueTicketsListResponse = { tickets, message: 'SUCCESS' };

        console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(body.tickets, null, 2)}`)
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

// GET /api/queueticket/queues/:id — fetch only multiple active tickets based on a Queue ID
// Call listActiveTickets helper (only WAITING and HELPING tickets)
router.get('/queues/:queueId', async (req: Request, res: Response): Promise<void> => {
    try {
        
        const queueId = req.params.queueId as string;
        if (!queueId) {
            res.status(400).json({ message: 'Queue ID is required' });
            return;
        }
        // Also return students from include 
        const ticketsResponse = await listActiveTickets(queueId);
        const ticketsArray: QueueTicketWithStudent[] = ticketsResponse;

        console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(ticketsArray, null, 2)}`)

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

// GET /api/queueticket/queues/:queueId/status/completed - for completed tickets to store in local completed storage
router.get('/queues/:queueId/status/completed', async (req: Request, res: Response): Promise<void> => {
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

        console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(ticketsArray, null, 2)}`)

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


// GET /api/queueticket/:queueTicketId — single ticket
router.get('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueTicketId = req.params.queueTicketId;
        // No id or no queue id flag
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

        console.log(`[QUEUE TICKET] Successfully sent ticket object: ${JSON.stringify(ticket, null, 2)}`)

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

// GET /api/queueticket/user/:studentId — single ticket from User ID
router.get('/user/:studentId', async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = req.params.studentId;
        // no id or no queue id flag
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

        // console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(tickets, null, 2)}`)

        const body: QueueTicketsListResponse = {
            tickets,
            message: `Tickets successfully sent to ${studentId}`
        };
        console.log(`Tickets successfully sent to ${studentId}`);
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


// POST /api/queueticket — create ticket
// router.post('/', async (req: Request, res: Response): Promise<void> => {
//     try {
//         // The request body was attached from middleware with user
//         const studentId = (req as any).user.id;

//         // The server owns student identity; never trust a client-supplied user ID.
//         const validatedTicket = CreateQueueTicketValidationSchema.parse({
//             ...req.body, studentId
//         });
//         const { queueId } = validatedTicket;

//         // Ticket id, joinedAt, updatedAt are set by the server
//         // Call joinQueue service to create the ticket
//         const newTicket = await joinQueue(queueId, studentId);

//         console.log(`[QUEUE TICKET] Successfully created ticket object: ${JSON.stringify(newTicket, null, 2)}`)

//         const body: QueueTicketResponse = {
//             ticket: newTicket,
//             message: 'SUCCESS',
//         };
//         console.log('Successfully created a new ticket');
//         console.log(JSON.stringify(body.ticket));
//         res.status(201).json(body);
//     }
//     catch (error: unknown) {
//         if (error instanceof ZodError) {
//             res.status(400).json({ message: 'Invalid input', errors: error.issues });
//             return;
//         }
//         if (error instanceof Error) {
//             res.status(500).json({ message: error.message });
//             return;
//         }
//         console.log('Failed to create a new ticket');
//         res.status(500).json({ message: 'Failed to create ticket' });
//     }
// });

// POST /api/queueticket/:queueId — create ticket based on queue ID
router.post('/queues/:queueId', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId as string;
        const status  = req.body.status as SessionStatus;
        // The request was attached with a user property from middleware with user
        const studentId = (req as any).user.id;

        const validatedTicket = CreateQueueTicketValidationSchema.parse({
            // Only param not calculated is position. id, joinedAt, and updatedAt are auto configured
            ...req.body, status, queueId, studentId
        });

        // Ticket id, joinedAt, updatedAt are set by the server
        // Call joinQueue service to create the ticket
        const newTicket = await joinQueue(queueId, studentId);

        console.log(`[QUEUE TICKET] Successfully created ticket object: ${JSON.stringify(newTicket, null, 2)}`)

        const body: QueueTicketResponse = {
            ticket: newTicket,
            message: 'SUCCESS',
        };
        console.log('Successfully created a new ticket');
        console.log(JSON.stringify(body.ticket));

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
        console.log('Failed to create a new ticket');
        res.status(500).json({ message: 'Failed to create ticket' });
    }
});

// PATCH /api/queueticket/:id — leaves a queue (the only status transition this endpoint supports). Ticket owner only.
router.patch('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
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

        // Call queue service to leave the queue after successfully fetching the ticket
        const updatedTicket = await leaveQueue(existingTicket.queueId, studentId);
        const body: QueueTicketResponse = {
            ticket: updatedTicket,
            message: 'SUCCESS',
        };

        console.log(`[QUEUE TICKET] Successfully updated ticket status to ${updatedTicket.status}`);
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

// PATCH /api/queueticket/:queueTicketId/status/completed -> Move ticket from helping to completed. TA who owns the queue only.
// Do not update position since each ticket's status must be from helping (update position already)
router.patch('/:queueTicketId/status/completed', requireTicketQueueOwnership('queueTicketId'), async (req: Request, res: Response) => {
    try {
        const queueTicketId = req.params.queueTicketId as string;

        // automatically update updatedAt
        const ticketResponse = await prisma.queueTicket.update({
            where: {id: queueTicketId, status: 'HELPING'},
            data: {status: 'COMPLETED'}
        })
        const body = {
            ticket: ticketResponse, 
            message: 'Successfully updated ticket status to "Completed"'
        }
        console.log(`[QUEUE TICKET] Successfully updated ticket status to ${JSON.stringify(ticketResponse, null, 2)}`);
        res.status(200).json(body);
    } catch (error) {
        // Record not found
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
        console.log(`[QUEUE TICKET] Successfully deleted ticket object: ${JSON.stringify(body, null, 2)}`)
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
        console.log(`[QUEUE TICKET] Successfully deleted all tickets from ${queueId}`);
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
        // console.log('Clear all completed tickets api');
        const queueId = req.params.queueId as string;
        const deletedTickets = await prisma.queueTicket.deleteMany({
            where: {queueId, status: 'COMPLETED'}
        })
        const body = {
            tickets: deletedTickets, 
            message: `Successfully deleted all completed tickets from queue ${queueId}`
        }
        console.log(`Successfully deleted all tickets currently from queue ${queueId}`, JSON.stringify(body, null, 2));
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            console.log(error);
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
        console.log(`Successfully deleted all tickets currently waiting and helping from queue ${queueId}`, JSON.stringify(body, null, 2));
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            console.log(error);
            return;
        }
        res.status(500).json({ message: 'Failed to delete all tickets' });
    }
})

export const queueTicketRouter = router;
