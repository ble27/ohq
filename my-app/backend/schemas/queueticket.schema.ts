import { z } from 'zod';
import { SessionStatus } from '../generated/prisma/client.js';

export const QueueTicketValidationSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),

    studentId: z.uuid({ message: 'Invalid student ID format' }),

    queueId: z.uuid({ message: 'Invalid queue ID format' }),

    status: z.enum([
        SessionStatus.WAITING,
        SessionStatus.HELPING,
        SessionStatus.COMPLETED,
        SessionStatus.REMOVED,
        SessionStatus.LEFT,
    ]),

    position: z
        .number()
        .int({ message: 'Position must be an integer' })
        .positive({ message: 'Position must be a positive number' })
        .optional(),

    joinedAt: z.coerce.date().default(() => new Date()),

    updatedAt: z.coerce.date().optional(),
});

export const CreateQueueTicketValidationSchema = QueueTicketValidationSchema.omit({
    id: true,
    joinedAt: true,
    updatedAt: true,
});

// PATCH /api/queueticket/:queueTicketId only supports transitioning a ticket to LEFT.
export const LeaveTicketStatusSchema = z.object({
    status: z.literal(SessionStatus.LEFT, {
        message: 'This endpoint only supports leaving a queue',
    }),
});

export type QueueTicketInput = z.infer<typeof QueueTicketValidationSchema>;
export type CreateQueueTicketInput = z.infer<typeof CreateQueueTicketValidationSchema>;
