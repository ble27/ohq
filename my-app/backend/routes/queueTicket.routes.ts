import { Router } from 'express';
import type { Request, Response } from 'express';
// import { prisma } from '../prisma.js';
import type {
    QueueTicket,
    QueueTicketResponse,
} from '../../shared/types.js';
import { ZodError } from 'zod';

const router: Router = Router();

// MOCK: sample tickets — swap for prisma.queueTicket.* when DB is ready
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
];

// GET /api/tickets/:id
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

        const ticket = mockTickets.find((t) => t.id === ticketId) ?? {
            ...mockTickets[0]!,
            id: ticketId,
        };

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

// POST /api/tickets — create ticket (mock)
router.post('/', async (req: Request, res: Response): Promise<void> => {
    // const newTicket = await prisma.queueTicket.create({ data: req.body });

    const mockTicket: QueueTicket = {
        id: '88888888-8888-8888-8888-888888888888',
        studentId: '55555555-5555-5555-5555-555555555555',
        queueId: '11111111-1111-1111-1111-111111111111',
        status: 'WAITING',
        position: 3,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const body: QueueTicketResponse = {
        ticket: mockTicket,
        message: 'Ticket created',
    };
    res.status(201).json(body);
});

export const queueTicketRouter = router;
