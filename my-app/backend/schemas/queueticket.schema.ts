import { z } from 'zod';
import { SessionStatus } from '../generated/prisma/enums.js';

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

export type QueueTicketInput = z.infer<typeof QueueTicketValidationSchema>;
export type CreateQueueTicketInput = z.infer<typeof CreateQueueTicketValidationSchema>;
