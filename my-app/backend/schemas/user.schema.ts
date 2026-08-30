import { z } from 'zod';
import { Role } from '../generated/prisma/client.js';

export const UserValidatedSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),
    email: z.email({ message: 'Invalid email format' }),
    name: z.string().optional(),
    role: z.enum([Role.STUDENT, Role.TA, Role.PROFESSOR]),
});

export const NotificationAlertUpdateSchema = z.object({
    status: z.boolean({ message: 'status must be a boolean' }),
});

export const DefaultLocationUpdateSchema = z.object({
    defaultLocation: z.string().trim().min(2).max(50),
});

export const DisplayNameUpdateSchema = z.object({
    name: z.string().trim().min(1, { message: 'Name is required' }).max(100, { message: 'Name is too long' }),
});

export type UserInput = z.infer<typeof UserValidatedSchema>;
export type NotificationAlertUpdateInput = z.infer<typeof NotificationAlertUpdateSchema>;
export type DefaultLocationUpdateInput = z.infer<typeof DefaultLocationUpdateSchema>;
export type DisplayNameUpdateInput = z.infer<typeof DisplayNameUpdateSchema>;