import { Router } from 'express';
import type { Request, Response } from 'express';
// import { prisma } from '../prisma.js';
import type {
    ApiMessageResponse,
    QueueTicket,
    QueueTicketResponse,
    QueueTicketsListResponse,
} from '../../shared/types.js';
import { CreateQueueTicketValidationSchema } from '../schemas/queueTicket.schema.js';
import { ZodError } from 'zod';

const router: Router = Router();

// MOCK: sample queue tickets — swap for prisma.queueTicket.* when DB is ready
// queueId values align with mockQueues in queue.routes.ts
const mockTickets: QueueTicket[] = [
    {
        id: '66666666-6666-6666-6666-666666666666',
        studentId: '55555555-5555-5555-5555-555555555555',
        queueId: '11111111-1111-1111-1111-111111111111',
        status: 'WAITING',
        position: 1,
        joinedAt: '2026-07-29T12:15:00.000Z',
        updatedAt: '2026-07-29T12:15:00.000Z',
    },
    {
        id: '77777777-7777-7777-7777-777777777777',
        studentId: '55555555-5555-5555-5555-555555555555',
        queueId: '11111111-1111-1111-1111-111111111111',
        status: 'HELPING',
        position: null,
        joinedAt: '2026-07-29T11:00:00.000Z',
        updatedAt: '2026-07-29T12:00:00.000Z',
    },
    {
        id: '88888888-8888-8888-8888-888888888888',
        studentId: '99999999-9999-9999-9999-999999999999',
        queueId: '11111111-1111-1111-1111-111111111111',
        status: 'WAITING',
        position: 2,
        joinedAt: '2026-07-29T12:20:00.000Z',
        updatedAt: '2026-07-29T12:20:00.000Z',
    },
    {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        studentId: '55555555-5555-5555-5555-555555555555',
        queueId: '23333333-3333-3333-3333-333333333333',
        status: 'WAITING',
        position: 1,
        joinedAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:00:00.000Z',
    },
    {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        studentId: '99999999-9999-9999-9999-999999999999',
        queueId: '13333333-3333-3333-3333-333333333333',
        status: 'COMPLETED',
        position: null,
        joinedAt: '2026-07-28T09:30:00.000Z',
        updatedAt: '2026-07-28T10:15:00.000Z',
    },
    {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        studentId: '55555555-5555-5555-5555-555555555555',
        queueId: '33333333-3333-3333-3333-333333333333',
        status: 'LEFT',
        position: null,
        joinedAt: '2026-07-28T09:05:00.000Z',
        updatedAt: '2026-07-28T09:45:00.000Z',
    },
    {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        studentId: '99999999-9999-9999-9999-999999999999',
        queueId: '33333333-3333-3333-3333-333333333333',
        status: 'REMOVED',
        position: null,
        joinedAt: '2026-07-28T09:10:00.000Z',
        updatedAt: '2026-07-28T09:50:00.000Z',
    },
];

// GET /api/queueticket — list all tickets
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

// GET /api/queueticket/:id — single ticket
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.id;
        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        // const ticket = await prisma.queueTicket.findUnique({
        //     where: { id: ticketId },
        // });
        // if (!ticket) {
        //     res.status(404).json({ message: 'No ticket found' });
        //     return;
        // }

        const ticket = mockTickets.find((t) => t.id === ticketId);
        if (!ticket) {
            res.status(404).json({ message: 'No ticket found' });
            return;
        }

        const body: QueueTicketResponse = {
            ticket,
            message: `Ticket ${ticketId} successfully fetched`,
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

// POST /api/queueticket — create ticket
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedTicket = CreateQueueTicketValidationSchema.parse(req.body);

        // const newTicket = await prisma.queueTicket.create({ data: validatedTicket });

        const newTicket: QueueTicket = {
            id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            ...validatedTicket,
            position: validatedTicket.position ?? null,
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const body: QueueTicketResponse = {
            ticket: newTicket,
            message: 'Ticket created',
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

// PATCH /api/queueticket/:id — update status (e.g. WAITING -> HELPING)
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.id;
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
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = req.params.id;
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
