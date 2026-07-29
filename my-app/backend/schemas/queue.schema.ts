import { z } from 'zod';

export const QueueValidationSchema = z.object({
  id: z.string().uuid({ message: "Invalid ID format" }),
  
  courseId: z
    .string()
    .min(7, { message: 'Course ID must be at least 7 characters' })
    .max(20, { message: 'Course ID cannot exceed 20 characters'}),
    
  taId: z.string().uuid({ message: "Invalid TA ID format" }),
  
  location: z
    .string()
    .min(3, { message: 'Location must be at least 3 characters' })
    .trim(),
    
  isOpen: z.boolean({ message: "Status must be a boolean"}),
  
  // Coerces string dates (like JSON payloads) into true Date objects
  createdAt: z.coerce.date().default(() => new Date()),
  
  updatedAt: z.coerce.date().optional()
});

export type QueueInput = z.infer<typeof QueueValidationSchema>;
