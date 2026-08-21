import { z } from 'zod';
export declare const NotificationValidationSchema: z.ZodObject<{
    id: z.ZodUUID;
    userId: z.ZodUUID;
    type: z.ZodEnum<{
        JOIN: "JOIN";
        LEAVE: "LEAVE";
        ASSIST: "ASSIST";
        CLOSE: "CLOSE";
    }>;
    queueId: z.ZodUUID;
    ticketId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    createdAt: z.ZodDefault<z.ZodCoercedDate<unknown>>;
    readAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    clearedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export declare const CreateNotificationValidationSchema: z.ZodObject<{
    type: z.ZodEnum<{
        JOIN: "JOIN";
        LEAVE: "LEAVE";
        ASSIST: "ASSIST";
        CLOSE: "CLOSE";
    }>;
    queueId: z.ZodUUID;
    userId: z.ZodUUID;
    ticketId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
}, z.core.$strip>;
export declare const UpdateNotificationValidationSchema: z.ZodObject<{
    readAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    clearedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export type NotificationInput = z.infer<typeof NotificationValidationSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationValidationSchema>;
export type UpdateNotificationInput = z.infer<typeof UpdateNotificationValidationSchema>;
//# sourceMappingURL=notification.schema.d.ts.map