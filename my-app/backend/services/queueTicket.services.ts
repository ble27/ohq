import { prisma } from '../prisma.js';
import type { QueueTicket } from '../generated/prisma/client.js';
import { SessionStatus } from '../generated/prisma/enums.js';

/**
 * Re-number WAITING tickets by joinedAt (1..n).
 * Empty waiting list is success — returns [].
 */
export const updatePosition = async (queueId: string): Promise<QueueTicket[]> => {
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

  const updated = await prisma.$transaction(
    tickets.map((ticket, index) =>
      prisma.queueTicket.update({
        where: { id: ticket.id },
        data: { position: index + 1 },
      })
    )
  );

  return updated;
};

/**
 * Soft-clear finished tickets' positions only (keeps rows for metrics).
 * Prefer status transitions via leave/complete/remove instead of deleting.
 */
export const clearInactivePositions = async (queueId: string) => {
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
