import { prisma } from '../prisma.js';
import { updatePosition } from './queueTicket.services.js';
import type { QueueTicket } from '../generated/prisma/client.js';
import { Prisma, SessionStatus } from '../generated/prisma/client.js';

const isUniqueConstraintViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const ACTIVE_STATUSES = [SessionStatus.WAITING, SessionStatus.HELPING] as const;

export const closeExpiredQueues = async (): Promise<void> => {
  await prisma.queue.updateMany({
    where: {
      isOpen: true,
      endsAt: { lte: new Date() },
    },
    data: { isOpen: false },
  });
};

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
    include: { student: true }
  });
};

export const joinQueue = async (
  queueId: string,
  studentId: string
): Promise<QueueTicket> => {
  await closeExpiredQueues();
  const queue = await prisma.queue.findUnique({ where: { id: queueId } })
  
  if (!queue || !queue.isOpen) {
    throw new Error('Queue is closed or does not exist');
  }

  // Re-check-and-write inside a single transaction so two concurrent joins from
  // the same student can't both pass the "not already active" check before either commits.
  let ticket: QueueTicket;
  try {
    ticket = await prisma.$transaction(async (tx) => {
      const existing = await tx.queueTicket.findUnique({
        where: { queueId_studentId: { queueId, studentId } },
      });

      if (existing && ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
        throw new Error('You are already in this queue');
      }

      // @@unique([queueId, studentId]) — rejoin must reactivate the same row
      return existing
        ? await tx.queueTicket.update({
            where: { id: existing.id },
            data: {
              status: SessionStatus.WAITING,
              position: null,
              joinedAt: new Date(),
            },
          })
        : await tx.queueTicket.create({
            data: {
              queueId,
              studentId,
              status: SessionStatus.WAITING,
            },
          });
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new Error('You are already in this queue');
    }
    throw error;
  }

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
  const ticket = await prisma.$transaction(async (tx) => {
    const active = await tx.queueTicket.findFirst({
      where: {
        queueId,
        studentId,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (!active) {
      throw new Error('No active ticket found for this student in the queue');
    }

    return await tx.queueTicket.update({
      where: { id: active.id },
      data: { status: SessionStatus.LEFT, position: null },
    });
  });

  await updatePosition(queueId);
  return ticket;
};

// Move a ticket from WAITING TO HELPING
export const startHelping = async (ticketId: string): Promise<QueueTicket> => {
  await closeExpiredQueues();

  // Re-check-and-write inside a single transaction so two TAs can't both
  // move the same WAITING ticket to HELPING.
  const { ticket, queueId } = await prisma.$transaction(async (tx) => {
    const existing = await tx.queueTicket.findUnique({ where: { id: ticketId } });
    if (!existing) {
      throw new Error('Ticket not found');
    }
    if (existing.status !== SessionStatus.WAITING) {
      throw new Error('Only WAITING tickets can be moved to HELPING');
    }

    const queue = await tx.queue.findUnique({ where: { id: existing.queueId } });
    if (!queue || !queue.isOpen) {
      throw new Error('Queue is closed or does not exist');
    }

    const updated = await tx.queueTicket.update({
      where: { id: ticketId, status: SessionStatus.WAITING },
      data: { status: SessionStatus.HELPING, position: null },
    });
    return { ticket: updated, queueId: existing.queueId };
  });

  // Auto update position of the ticket
  await updatePosition(queueId);
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

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketCheck = await tx.queueTicket.findFirst({ 
      where: { id: ticketId } 
    });
  
    // Return ticketCheck instead of the unassigned 'ticket' variable
    if (ticketCheck?.status === 'COMPLETED') {
      // console.log('Ticket has already been completed');
      return ticketCheck; 
    }
  
    // Add 'return' so the updated ticket is assigned to your outer variable
    return await tx.queueTicket.update({ 
      where: { id: ticketId }, 
      data: { 
        status: SessionStatus.COMPLETED, 
        position: null 
      },
    });
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