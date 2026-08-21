import { z } from 'zod';
export declare const CourseValidationSchema: z.ZodObject<{
    id: z.ZodUUID;
    code: z.ZodString;
    semester: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDefault<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const CreateCourseValidationSchema: z.ZodObject<{
    code: z.ZodString;
    semester: z.ZodString;
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export type CourseInput = z.infer<typeof CourseValidationSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseValidationSchema>;
//# sourceMappingURL=course.schema.d.ts.map