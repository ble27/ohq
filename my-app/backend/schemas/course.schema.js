import { z } from 'zod';
export const CourseValidationSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),
    code: z
        .string()
        .min(2, { message: 'Course code must be at least 2 characters' })
        .max(20, { message: 'Course code cannot exceed 20 characters' })
        .trim(),
    semester: z
        .string()
        .min(4, { message: 'Semester must be at least 4 characters' })
        .max(20, { message: 'Semester cannot exceed 20 characters' })
        .trim(),
    isActive: z.boolean({ message: 'Status must be a boolean' }),
    createdAt: z.coerce.date().default(() => new Date()),
});
export const CreateCourseValidationSchema = CourseValidationSchema.omit({
    id: true,
    createdAt: true,
});
//# sourceMappingURL=course.schema.js.map