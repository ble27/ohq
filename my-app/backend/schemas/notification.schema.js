import { z } from 'zod';
import { NotificationType } from '../generated/prisma/client.js';
export const NotificationValidationSchema = z.object({
    id: z.uuid({ message: 'Invalid ID format' }),
    userId: z.uuid({ message: 'Invalid user ID format' }),
    type: z.enum([
        NotificationType.JOIN,
        NotificationType.LEAVE,
        NotificationType.ASSIST,
        NotificationType.CLOSE,
    ]),
    queueId: z.uuid({ message: 'Invalid queue ID format' }),
    ticketId: z
        .uuid({ message: 'Invalid ticket ID format' })
        .nullable()
        .optional(),
    createdAt: z.coerce.date().default(() => new Date()),
    readAt: z.coerce.date().nullable().optional(),
    clearedAt: z.coerce.date().nullable().optional(),
});
// Main validation schema
export const CreateNotificationValidationSchema = NotificationValidationSchema.omit({
    id: true,
    createdAt: true,
    readAt: true,
    clearedAt: true,
});
export const UpdateNotificationValidationSchema = z.object({
    readAt: z.coerce.date().nullable().optional(),
    clearedAt: z.coerce.date().nullable().optional(),
});
//# sourceMappingURL=notification.schema.js.map