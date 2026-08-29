import { SessionStatus } from '../generated/prisma/client.js';
import { prisma } from '../prisma.js';
import { getIo } from '../socket.js';
import { listActiveTickets } from './queue.services.js';
import { filterRecipientsByNotificationPreference } from './notification.services.js';
import { NotificationType as PrismaNotificationType } from '../generated/prisma/client.js';

const ACTIVE_STATUSES = [SessionStatus.WAITING, SessionStatus.HELPING] as const;

/** Closes every open queue owned by a TA/PROFESSOR and clears active tickets. */
export async function closeOpenQueuesForTa(taId: string): Promise<string[]> {
    const openQueues = await prisma.queue.findMany({
        where: { taId, isOpen: true },
    });
    if (openQueues.length === 0) return [];

    const queueIds = openQueues.map((queue) => queue.id);

    const ticketsByQueueId = new Map<string, Awaited<ReturnType<typeof listActiveTickets>>>();
    for (const queue of openQueues) {
        ticketsByQueueId.set(queue.id, await listActiveTickets(queue.id));
    }

    await prisma.queue.updateMany({
        where: { id: { in: queueIds } },
        data: { isOpen: false },
    });

    // Delete active tickets in the queue when closing the queue
    await prisma.queueTicket.deleteMany({
        where: {
            queueId: { in: queueIds },
            status: { in: [...ACTIVE_STATUSES] },
        },
    });

    const io = getIo();

    for (const queue of openQueues) {
        io.to(queue.id).emit('queue-updated', []);

        const tickets = ticketsByQueueId.get(queue.id) ?? [];
        const recipientIds = [...tickets.map((ticket) => ticket.studentId), queue.taId];
        const enabledRecipientIds = await filterRecipientsByNotificationPreference(
            recipientIds,
            PrismaNotificationType.CLOSE,
        );

        if (enabledRecipientIds.length === 0) continue;

        // Create a closing notification
        const notifications = await prisma.$transaction(
            enabledRecipientIds.map((userId) =>
                prisma.notification.create({
                    data: { queueId: queue.id, type: PrismaNotificationType.CLOSE, userId },
                    include: {
                        ticket: { include: { student: true } },
                        queue: { include: { ta: true } },
                    },
                }),
            ),
        );

        // Emit to the to the user on closing notification
        for (const notification of notifications) {
            io.to(`user:${notification.userId}`).emit('notification-created', notification);
        }
    }

    io.to(`user:${taId}`).emit('ta-queues-closed', { queueIds });

    return queueIds;
}
