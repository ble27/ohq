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
    defaultLocation: z.string().trim().min(2).max(50)
});
//# sourceMappingURL=user.schema.js.map