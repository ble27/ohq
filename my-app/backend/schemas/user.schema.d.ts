import { z } from 'zod';
export declare const UserValidatedSchema: z.ZodObject<{
    id: z.ZodUUID;
    email: z.ZodEmail;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<{
        STUDENT: "STUDENT";
        TA: "TA";
        PROFESSOR: "PROFESSOR";
    }>;
}, z.core.$strip>;
export declare const NotificationAlertUpdateSchema: z.ZodObject<{
    status: z.ZodBoolean;
}, z.core.$strip>;
export declare const DefaultLocationUpdateSchema: z.ZodObject<{
    defaultLocation: z.ZodString;
}, z.core.$strip>;
export type UserInput = z.infer<typeof UserValidatedSchema>;
export type NotificationAlertUpdateInput = z.infer<typeof NotificationAlertUpdateSchema>;
export type DefaultLocationUpdateInput = z.infer<typeof DefaultLocationUpdateSchema>;
//# sourceMappingURL=user.schema.d.ts.map