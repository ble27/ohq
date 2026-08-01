import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

import type {
    ApiMessageResponse,
    QueueTicket,
    QueueTicketResponse,
    QueueTicketsListResponse,
} from '../../shared/types.js';
import { CreateQueueTicketValidationSchema } from '../schemas/queueTicket.schema.js';
import { ZodError } from 'zod';
const router: Router = Router();

// Temporary development identity. Replace this with the verified user ID
// supplied by the authentication middleware when Google OAuth is added.
const DEV_STUDENT_ID = '55555555-5555-4555-8555-555555555555';

// MOCK: sample queue tickets — swap for prisma.queueTicket.* when DB is ready
// queueId values align with mockQueues in queue.routes.ts
const mockTickets: QueueTicket[] = [
    {
        id: '66666666-6666-4666-8666-666666666666',
        studentId: '55555555-5555-4555-8555-555555555555',
        queueId: '11111111-1111-4111-8111-111111111111',
        status: 'WAITING',
        position: 1,
        joinedAt: '2026-07-29T12:15:00.000Z',
        updatedAt: '2026-07-29T12:15:00.000Z',
    },
    {
        id: '77777777-7777-4777-8777-777777777777',
        studentId: '55555555-5555-4555-8555-555555555555',
        queueId: '11111111-1111-4111-8111-111111111111',
        status: 'HELPING',
        position: null,
        joinedAt: '2026-07-29T11:00:00.000Z',
        updatedAt: '2026-07-29T12:00:00.000Z',
    },
    {
        id: '88888888-8888-4888-8888-888888888888',
        studentId: '99999999-9999-4999-9999-999999999999',
        queueId: '11111111-1111-4111-8111-111111111111',
        status: 'WAITING',
        position: 2,
        joinedAt: '2026-07-29T12:20:00.000Z',
        updatedAt: '2026-07-29T12:20:00.000Z',
    },
    {
        id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        studentId: '55555555-5555-4555-8555-555555555555',
        queueId: '23333333-3333-4333-8333-333333333333',
        status: 'WAITING',
        position: 1,
        joinedAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:00:00.000Z',
    },
    {
        id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        studentId: '99999999-9999-4999-9999-999999999999',
        queueId: '13333333-3333-4333-8333-333333333333',
        status: 'COMPLETED',
        position: null,
        joinedAt: '2026-07-28T09:30:00.000Z',
        updatedAt: '2026-07-28T10:15:00.000Z',
    },
    {
        id: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
        studentId: '55555555-5555-4555-8555-555555555555',
        queueId: '33333333-3333-4333-8333-333333333333',
        status: 'LEFT',
        position: null,
        joinedAt: '2026-07-28T09:05:00.000Z',
        updatedAt: '2026-07-28T09:45:00.000Z',
    },
    {
        id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
        studentId: '99999999-9999-4999-9999-999999999999',
        queueId: '33333333-3333-4333-8333-333333333333',
        status: 'REMOVED',
        position: null,
        joinedAt: '2026-07-28T09:10:00.000Z',
        updatedAt: '2026-07-28T09:50:00.000Z',
    },
];

// GET /api/queueticket — list all tickets
// Heavy operation if lots of tickets
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        // const tickets = await prisma.queueTicket.findMany();
        // const body: QueueTicketsListResponse = { tickets, message: 'SUCCESS' };

        const body: QueueTicketsListResponse = {
            tickets: mockTickets,
            message: 'SUCCESS',
        };
        res.status(200).json(body);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected database error occurred.' });
        }
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
        
        // const queue = await prisma.queue.findUnique({
        //     where: { id: queueId },
        //     include: { tickets: true },
        // });

        // if (!queue) {
        //     res.status(404).json({ message: 'No ticket found' });
        //     return;
        // }

        // const ticketsArray: QueueTicket[] = queue.tickets;

        const ticketsArray: QueueTicket[] = [];
        mockTickets.filter((ticket) => {
            ticketsArray.push(ticket);
            ticket.queueId = queueId}
        )
        const body: QueueTicketsListResponse = {
            tickets: ticketsArray,
            message: `Tickets from queue ${queueId} successfully fetched`,
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

// GET /api/queueticket/:queueTicketId — single ticket
router.get('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
    try {
        const queueTicketId = req.params.queueTicketId;
        // no id or no queue id flag
        if (!queueTicketId) {
            res.status(404).json({ message: 'Missing required parameter'})
            return;
        }

        // const ticket = await prisma.queueTicket.findUnique({
        //     where: { studentId, queueId },
        // });
        // if (!ticket) {
        //     res.status(404).json({ message: 'No ticket found' });
        //     return;
        // }
        
        const ticket = mockTickets.find((t) => t.id == queueTicketId);
        if (!ticket) {
            res.status(404).json({ message: 'No ticket found' });
            return;
        }
        // Only know the ticket id after successful fetching
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
        // The server owns student identity; never trust a client-supplied user ID.
        const validatedTicket = CreateQueueTicketValidationSchema.parse({
            ...req.body,
            studentId: DEV_STUDENT_ID,
        });

        // const newTicket = await prisma.queueTicket.create({ data: validatedTicket });

        const newTicket: QueueTicket = {
            id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',
            ...validatedTicket,
            position: validatedTicket.position ?? null,
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const body: QueueTicketResponse = {
            ticket: newTicket,
            message: 'Ticket created',
        };
        // Send a ticket to the client
        res.status(201).json(body);
    }
    // If the ticket creation fails, send an error response
    catch (error: unknown) {
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

// PATCH /api/queueticket/:id — update status (e.g. WAITING -> HELPING)
router.patch('/:queueTicketId', async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.queueTicketId;
        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        // const ticketToUpdate = await prisma.queueTicket.findUnique({
        //     where: { id: ticketId },
        // });
        // if (!ticketToUpdate) {
        //     res.status(404).json({ message: 'Ticket not found' });
        //     return;
        // }
        // const updatedTicket = await prisma.queueTicket.update({
        //     where: { id: ticketId },
        //     data: req.body,
        // });

        const existing = mockTickets.find((t) => t.id === ticketId);
        if (!existing) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        const updatedTicket: QueueTicket = {
            ...existing,
            ...req.body,
            id: ticketId,
            updatedAt: new Date().toISOString(),
        };

        const body: QueueTicketResponse = {
            ticket: updatedTicket,
            message: 'Ticket successfully updated',
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

        // const ticketToDelete = await prisma.queueTicket.findUnique({
        //     where: { id: ticketId },
        // });
        // if (!ticketToDelete) {
        //     res.status(404).json({ message: 'Ticket not found' });
        //     return;
        // }
        // await prisma.queueTicket.delete({
        //     where: { id: ticketId },
        // });

        const existing = mockTickets.find((t) => t.id === ticketId);
        if (!existing) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        const body: ApiMessageResponse = { message: 'Ticket successfully deleted' };
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
        res.status(500).json({ message: 'Failed to delete ticket' });
    }
});

export const queueTicketRouter = router;
