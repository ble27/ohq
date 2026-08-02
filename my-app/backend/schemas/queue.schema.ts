import { z } from 'zod';

// Validator
export const QueueValidationSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),

    courseId: z.uuid({ message: 'Invalid course ID format' }),

    taId: z.uuid({ message: 'Invalid TA ID format' }),

    location: z
        .string()
        .min(3, { message: 'Location must be at least 3 characters' })
        .trim(),

    isOpen: z.boolean({ message: 'Status must be a boolean' }),

    createdAt: z.coerce.date().default(() => new Date()),

    updatedAt: z.coerce.date().optional(),
});

export const CreateQueueValidationSchema = QueueValidationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type QueueInput = z.infer<typeof QueueValidationSchema>;
export type CreateQueueInput = z.infer<typeof CreateQueueValidationSchema>;
