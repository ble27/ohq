import { prisma } from '../prisma.js';
import { SessionStatus } from '../generated/prisma/client.js';
/**
 * Re-number WAITING tickets by joinedAt (1..n).
 * Empty waiting list is success — returns [].
 */
export const updatePosition = async (queueId) => {
    const tickets = await prisma.queueTicket.findMany({
        where: {
            queueId,
            status: SessionStatus.WAITING,
        },
        orderBy: { joinedAt: 'asc' },
    });
    if (tickets.length === 0) {
        return [];
    }
    const updated = await prisma.$transaction(tickets.map((ticket, index) => prisma.queueTicket.update({
        where: { id: ticket.id },
        data: { position: index + 1 },
    })));
    return updated;
};
/**
 * Soft-clear finished tickets' positions only (keeps rows for metrics).
 * Prefer status transitions via leave/complete/remove instead of deleting.
 */
export const clearInactivePositions = async (queueId) => {
    return prisma.queueTicket.updateMany({
        where: {
            queueId,
            status: {
                in: [
                    SessionStatus.COMPLETED,
                    SessionStatus.LEFT,
                    SessionStatus.REMOVED,
                ],
            },
            position: { not: null },
        },
        data: { position: null },
    });
};
// Find queue id by ticket id
export const findQueueIdByTicketId = async (ticketId) => {
    const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    return ticket.queueId;
};
//# sourceMappingURL=queueTicket.services.js.map