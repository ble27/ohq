import { z } from 'zod';
export declare const QueueTicketValidationSchema: z.ZodObject<{
    id: z.ZodUUID;
    studentId: z.ZodUUID;
    queueId: z.ZodUUID;
    status: z.ZodEnum<{
        WAITING: "WAITING";
        HELPING: "HELPING";
        COMPLETED: "COMPLETED";
        REMOVED: "REMOVED";
        LEFT: "LEFT";
    }>;
    position: z.ZodOptional<z.ZodNumber>;
    joinedAt: z.ZodDefault<z.ZodCoercedDate<unknown>>;
    updatedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const CreateQueueTicketValidationSchema: z.ZodObject<{
    studentId: z.ZodUUID;
    queueId: z.ZodUUID;
    status: z.ZodEnum<{
        WAITING: "WAITING";
        HELPING: "HELPING";
        COMPLETED: "COMPLETED";
        REMOVED: "REMOVED";
        LEFT: "LEFT";
    }>;
    position: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const LeaveTicketStatusSchema: z.ZodObject<{
    status: z.ZodLiteral<"LEFT">;
}, z.core.$strip>;
export type QueueTicketInput = z.infer<typeof QueueTicketValidationSchema>;
export type CreateQueueTicketInput = z.infer<typeof CreateQueueTicketValidationSchema>;
//# sourceMappingURL=queueticket.schema.d.ts.map