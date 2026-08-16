import { prisma } from '../prisma.js';
import { CreateNotificationValidationSchema } from '../schemas/notification.schema.js';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { ZodError } from 'zod';
import { NotificationType as PrismaNotificationType } from '../generated/prisma/index.js';
import { listActiveTickets } from '../services/queue.services.js';
import {
    filterRecipientsByNotificationPreference,
    isNotificationEnabledForUser,
} from '../services/notification.services.js';
import type {
    NotificationResponse,
    NotificationsClearResponse,
    NotificationsListResponse,
    NotificationsCreateListResponse,
    NotificationType,
} from '../../shared/types.js';
import { getIo } from '../socket.js';
import { requireQueueOwnership, requireSelf } from '../middlewares/authz.middleware.js';

const router = Router();

// GET /api/notifications/user/:userId — inbox for recipient. Self only.
router.get('/user/:userId', requireSelf('userId'), async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ message: 'Missing required parameter' });
            return;
        }

        // Nested includes: ticket alone has no student; queue alone has no ta
        const notifications = await prisma.notification.findMany({
            where: { userId, clearedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                ticket: { include: { student: true } },
                queue: { include: { ta: true } },
            },
        });
        const body: NotificationsListResponse = {
            notifications,
            message: `Successfully fetched notifications for ${userId}`,
        };
        console.log(`Successfully fetched notifications`, JSON.stringify(body, null, 2));
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// POST /api/notifications/queues/:queueId/user/:recipientId/type/:type
// Whenever a student joins/leaves, or TA accepts a student into a session
// Recipient receives the notification (TA for JOIN/LEAVE, student for ASSIST)
router.post('/queues/:queueId/user/:recipientId/type/:type', async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const recipientId = req.params.recipientId as string;
        const type = req.params.type as NotificationType;
        const ticketId = req.body?.ticketId as string | undefined;

        // Only participants of this queue may trigger a notification: the TA who
        // owns it (e.g. a student notifying their TA on JOIN/LEAVE), or the
        // student on the referenced ticket (e.g. a TA notifying a student on
        // ASSIST). This prevents an arbitrary caller from spamming notifications
        // to any recipient of their choosing.
        const queue = await prisma.queue.findFirst({ where: { id: queueId } });
        if (!queue) {
            res.status(404).json({ message: 'Queue not found' });
            return;
        }
        const callerId = (req as any).user.id;
        const ticket = ticketId
            ? await prisma.queueTicket.findUnique({ where: { id: ticketId } })
            : null;
        const isCallerQueueTA = queue.taId === callerId;
        const isCallerTicketOwner = ticket?.studentId === callerId;
        if (!isCallerQueueTA && !isCallerTicketOwner) {
            res.status(403).json({ message: 'You are not part of this queue' });
            return;
        }

        const body = CreateNotificationValidationSchema.parse({
            userId: recipientId,
            type,
            queueId,
            ticketId,
        });

        const enabled = await isNotificationEnabledForUser(recipientId, type);
        if (!enabled) {
            res.status(200).json({
                message: `Notification not sent; recipient has disabled ${type} alerts`,
            });
            return;
        }

        const response = await prisma.notification.create({
            data: {
                queueId: body.queueId,
                userId: body.userId,
                type: body.type,
                ticketId: body.ticketId ?? null,
            },
            include: { 
                ticket: { include: { student: true } },
                queue: { include: { ta: true } },
            },
        });

        // Send event to frontend (same nested shape as GET inbox)
        // Notify only to recipientId 
        getIo().to(`user:${recipientId}`).emit('notification-created', response);
        
        console.log(`[Socket] Sent notification to ${recipientId}`);

        const payload: NotificationResponse = {
            notification: response,
            message: 'SUCCESS',
        };
        res.status(201).json(payload);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.issues });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to create a new notification' });
    }
});

// POST /api/notifications/queues/:queueId/type/close — fan-out to active students + TA. TA-owner only.
router.post('/queues/:queueId/type/close', requireQueueOwnership('queueId'), async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const type = PrismaNotificationType.CLOSE;

        const queue = await prisma.queue.findFirst({
            where: { id: queueId },
        });
        if (!queue) {
            res.status(404).json({ message: 'Queue not found' });
            return;
        }

        const tickets = await listActiveTickets(queueId);
        const recipientIds = [...tickets.map((t) => t.studentId), queue.taId];

        // Check which user which type of notification enabled
        const enabledRecipientIds = await filterRecipientsByNotificationPreference(
            recipientIds,
            type,
        );

        if (enabledRecipientIds.length === 0) {
            res.status(200).json({
                notifications: [],
                message: 'No recipients have CLOSE alerts enabled',
            });
            return;
        }

        const response = await prisma.$transaction(
            enabledRecipientIds.map((userId) =>
                prisma.notification.create({
                    data: { queueId, type, userId },
                    include: {
                        ticket: { include: { student: true } },
                        queue: { include: { ta: true } },
                    },
                })
            )
        );

        // Send alert to frontend
        for (const n of response) {
            getIo().to(`user:${n.userId}`).emit('notification-created', n);
        }

        // Use NLRP instead of NLR due to missing queue and ticket as optional
        const payload: NotificationsCreateListResponse= {
            notifications: response,
            message: 'SUCCESS',
        };
        res.status(201).json(payload);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to create close notifications' });
    }
});

// PATCH
router.patch('/:id', async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented' });
});

// DELETE /api/notifications/user/:userId — clear all for recipient. Self only.
router.delete('/user/:userId', requireSelf('userId'), async (req: Request, res: Response) => {
    console.log('Calling delete /api/notifications/user/:userId');
    try {
        const userId = req.params.userId as string;
        if (!userId) {
            res.status(400).json({ message: 'Missing required parameter' });
            return;
        }
        const notificationResponses = await prisma.notification.deleteMany({
            where: { userId },
        });
        const body: NotificationsClearResponse = {
            count: notificationResponses.count,
            message: `Successfully cleared all notifications associated with user ${userId}`,
        };
        console.log(
            `Successfully cleared all notifications associated with user ${userId}`,
            JSON.stringify(body, null, 2)
        );
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to clear all notifications' });
    }
});

// DELETE /api/notifications/:id — dismiss one. Recipient only.
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!id) {
            res.status(400).json({ message: 'Missing required parameter' });
            return;
        }

        const existing = await prisma.notification.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const callerId = (req as any).user.id;
        if (existing.userId !== callerId) {
            res.status(403).json({ message: 'You can only dismiss your own notifications' });
            return;
        }

        const notificationResponse = await prisma.notification.delete({
            where: { id },
        });
        const body: NotificationResponse = {
            notification: notificationResponse,
            message: `Successfully deleted notification ${id}`,
        };
        console.log(`Successfully deleted notification`, JSON.stringify(body, null, 2));
        res.status(200).json(body);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});

export const notificationRouter = router;
