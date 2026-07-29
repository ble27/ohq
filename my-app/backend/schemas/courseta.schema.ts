import { z } from 'zod';

export const CourseTAValidationSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),

    courseId: z.uuid({ message: 'Invalid course ID format' }),

    taId: z.uuid({ message: 'Invalid TA ID format' }),

    createdAt: z.coerce.date().default(() => new Date()),
});

export const CreateCourseTAValidationSchema = CourseTAValidationSchema.omit({
    id: true,
    createdAt: true,
});

export type CourseTAInput = z.infer<typeof CourseTAValidationSchema>;
export type CreateCourseTAInput = z.infer<typeof CreateCourseTAValidationSchema>;
