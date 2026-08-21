import { z } from 'zod';
export declare const CourseTAValidationSchema: z.ZodObject<{
    id: z.ZodUUID;
    courseId: z.ZodUUID;
    taId: z.ZodUUID;
    createdAt: z.ZodDefault<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const CreateCourseTAValidationSchema: z.ZodObject<{
    courseId: z.ZodUUID;
    taId: z.ZodUUID;
}, z.core.$strip>;
export type CourseTAInput = z.infer<typeof CourseTAValidationSchema>;
export type CreateCourseTAInput = z.infer<typeof CreateCourseTAValidationSchema>;
//# sourceMappingURL=courseta.schema.d.ts.map