import { z } from 'zod';

export const QueueValidationSchema = z.object({
  id: z.uuid({ message: 'Invalid ID format' }),

  courseId: z
    .string()
    .min(7, { message: 'Course ID must be at least 7 characters' })
    .max(20, { message: 'Course ID cannot exceed 20 characters' }),

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
