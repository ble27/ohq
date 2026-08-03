import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { SessionStatus } from '@prisma/client';
import { joinQueue, leaveQueue, listActiveTickets, startHelping } from '../services/queue.services.js';

import type {
    ApiMessageResponse,
    QueueTicket,
    QueueTicketResponse,
    QueueTicketsListResponse,
} from '../../shared/types.js';

import { CreateQueueTicketValidationSchema } from '../schemas/queueTicket.schema.js';
import { ZodError } from 'zod';
import type { Session } from 'inspector/promises';
const router: Router = Router();

// GET /api/queueticket — list all tickets
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const tickets = await prisma.queueTicket.findMany();
        const body: QueueTicketsListResponse = { tickets, message: 'SUCCESS' };
        console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(body.tickets, null, 2)}`)
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

// GET /api/queueticket/queues/:id — multiple tickets based on a Queue id
// NOTE: this must be registered before GET /:id, otherwise Express would
// match "queues" itself as the :id param on that route instead.
router.get('/queues/:queueId', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueId = req.params.queueId;
        if (!queueId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }
        
        const queue = await prisma.queue.findUnique({
            where: { id: queueId },
            include: { tickets: true },
        });

        if (!queue) {
            res.status(404).json({ message: 'No ticket found' });
            return;
        }

        const ticketsArray: QueueTicket[] = queue.tickets;

        console.log(`[QUEUE TICKET] Successfully sent ticket objects: ${JSON.stringify(ticketsArray, null, 2)}`)
        const body: QueueTicketsListResponse = {
            tickets: ticketsArray,
            message: `Tickets from queue ${queueId} successfully fetched`,
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
        // no id or no queue id flag
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
            message: `Ticket ${ticket.id} successfully fetched`,
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

// POST /api/queueticket — create ticket
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        // The request body was attached from middleware with user
        const studentId = (req as any).user.id;

        // The server owns student identity; never trust a client-supplied user ID.
        const validatedTicket = CreateQueueTicketValidationSchema.parse({
            ...req.body, studentId
        });
        const { queueId } = validatedTicket;

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
        console.log('Failed to create a new ticket');
        res.status(500).json({ message: 'Failed to create ticket' });
    }
});

// PATCH /api/queueticket/:id — update status (e.g. WAITING -> HELPING)
router.patch('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.queueTicketId;
        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        // Check the status of the request
        const status = req.body.status as SessionStatus;

        // Call startHelping service to update the ticket status
        // const updatedTicket = await startHelping(ticketId);

        const response = await prisma.queueTicket.update({
            where: { id: ticketId },
            data: {status: status} 
        })
        
        const updatedTicketStatus = response.status;

        console.log(`[QUEUE TICKET] Successfully updated ticket status to: ${JSON.stringify(updatedTicketStatus, null, 2)}`)
        res.status(200);
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

// DELETE /api/queueticket/:id
router.delete('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
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

export const queueTicketRouter = router;
