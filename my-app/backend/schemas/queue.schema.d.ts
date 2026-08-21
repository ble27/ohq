import { z } from 'zod';
export declare const QueueValidationSchema: z.ZodObject<{
    id: z.ZodUUID;
    courseId: z.ZodUUID;
    taId: z.ZodUUID;
    location: z.ZodString;
    isOpen: z.ZodBoolean;
    startsAt: z.ZodDefault<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    createdAt: z.ZodDefault<z.ZodCoercedDate<unknown>>;
    updatedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const CreateQueueValidationSchema: z.ZodObject<{
    courseId: z.ZodUUID;
    taId: z.ZodUUID;
    location: z.ZodString;
    isOpen: z.ZodBoolean;
    startsAt: z.ZodDefault<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export declare const TimeValidationSchema: z.ZodObject<{
    startsAt: z.ZodCoercedDate<unknown>;
    endsAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const QueueOpenParamSchema: z.ZodEnum<{
    true: "true";
    false: "false";
}>;
export declare const RoomLocationParamSchema: z.ZodString;
export type QueueInput = z.infer<typeof QueueValidationSchema>;
export type CreateQueueInput = z.infer<typeof CreateQueueValidationSchema>;
export type TimeValidationInput = z.infer<typeof TimeValidationSchema>;
//# sourceMappingURL=queue.schema.d.ts.map