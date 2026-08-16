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

    startsAt: z.coerce.date().optional().default(() => new Date()),

    endsAt: z.coerce.date({ message: 'End time must be a valid date' }).optional().nullable(),

    createdAt: z.coerce.date().default(() => new Date()),

    updatedAt: z.coerce.date().optional(),
});

export const CreateQueueValidationSchema = QueueValidationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).refine(
    (queue) => queue.endsAt == null || queue.endsAt > queue.startsAt,
    { message: 'End time must be after start time', path: ['endsAt'] },
);

// passed in new Date()
export const TimeValidationSchema = z.object({
    startsAt: z.coerce.date(), // convert to Date object
    endsAt: z.coerce.date()
})

// Route params are always strings; coerce/validate before use.
export const QueueOpenParamSchema = z.enum(['true', 'false'], {
    message: "isQueueOpen must be 'true' or 'false'",
});

export const RoomLocationParamSchema = z
    .string()
    .trim()
    .min(3, { message: 'Location must be at least 3 characters' });

export type QueueInput = z.infer<typeof QueueValidationSchema>;
export type CreateQueueInput = z.infer<typeof CreateQueueValidationSchema>;
export type TimeValidationInput = z.infer<typeof TimeValidationSchema>