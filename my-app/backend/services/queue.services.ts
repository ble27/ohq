import { prisma } from '../prisma.js';
import { updatePosition } from './queueTicket.services.js';
import type { QueueTicket } from '../generated/prisma/client.js';
import { SessionStatus } from '../generated/prisma/enums.js';

const ACTIVE_STATUSES = [SessionStatus.WAITING, SessionStatus.HELPING] as const;

export const listActiveTickets = async (queueId: string): Promise<QueueTicket[]> => {
  return prisma.queueTicket.findMany({
    where: {
      queueId,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: [
      { position: 'asc' },
      { joinedAt: 'asc' }, // schema has joinedAt, not createdAt
    ],
  });
};

export const joinQueue = async (
  queueId: string,
  studentId: string
): Promise<QueueTicket> => {
  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue || !queue.isOpen) {
    throw new Error('Queue is closed or does not exist');
  }

  const existing = await prisma.queueTicket.findUnique({
    where: { queueId_studentId: { queueId, studentId } },
  });

  if (existing && ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
    throw new Error('You are already in this queue');
  }

  // @@unique([queueId, studentId]) — rejoin must reactivate the same row
  const ticket = existing
    ? await prisma.queueTicket.update({
        where: { id: existing.id },
        data: {
          status: SessionStatus.WAITING,
          position: null,
          joinedAt: new Date(),
        },
      })
    : await prisma.queueTicket.create({
        data: {
          queueId,
          studentId,
          status: SessionStatus.WAITING,
        },
      });

  await updatePosition(queueId);

  const refreshed = await prisma.queueTicket.findUniqueOrThrow({
    where: { id: ticket.id },
  });
  return refreshed;
};

export const leaveQueue = async (
  queueId: string,
  studentId: string
): Promise<QueueTicket> => {
  const active = await prisma.queueTicket.findFirst({
    where: {
      queueId,
      studentId,
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
  if (!active) {
    throw new Error('No active ticket found for this student in the queue');
  }

  const ticket = await prisma.queueTicket.update({
    where: { id: active.id },
    data: { status: SessionStatus.LEFT, position: null },
  });

  await updatePosition(queueId);
  return ticket;
};

// Move a ticket from WAITING TO HELPING 
export const startHelping = async (ticketId: string): Promise<QueueTicket> => {
  const existing = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
  if (!existing) {
    throw new Error('Ticket not found');
  }
  if (existing.status !== SessionStatus.WAITING) {
    throw new Error('Only WAITING tickets can be moved to HELPING');
  }

  const queue = await prisma.queue.findUnique({ where: { id: existing.queueId } });
  if (!queue || !queue.isOpen) {
    throw new Error('Queue is closed or does not exist');
  }

  const ticket = await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: SessionStatus.HELPING, position: null },
  });
  // Auto update position of the ticket
  await updatePosition(existing.queueId);
  return ticket;
};

export const completeTicket = async (ticketId: string): Promise<QueueTicket> => {
  const existing = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
  if (!existing) {
    throw new Error('Ticket not found');
  }
  if (existing.status !== SessionStatus.HELPING) {
    throw new Error('Only HELPING tickets can be completed');
  }

  const ticket = await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: SessionStatus.COMPLETED, position: null },
  });

  // HELPING already had null position; safe no-op renumber for WAITING
  await updatePosition(existing.queueId);
  return ticket;
};

export const removeFromQueue = async (ticketId: string): Promise<QueueTicket> => {
  const existing = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
  if (!existing) {
    throw new Error('Ticket not found');
  }
  if (!ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
    throw new Error('Ticket is not active in the queue');
  }

  const ticket = await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: SessionStatus.REMOVED, position: null },
  });

  await updatePosition(existing.queueId);
  return ticket;
};
