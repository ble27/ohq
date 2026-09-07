import { prisma } from '../prisma.js';
import { updatePosition } from './queueTicket.services.js';
import type { Queue, QueueTicket } from '../generated/prisma/client.js';
import { Prisma, SessionStatus } from '../generated/prisma/client.js';
import { canViewQueue } from '../middlewares/authz.middleware.js';

export { isWithinQueueHours } from './queueSchedule.js';

const isUniqueConstraintViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const ACTIVE_STATUSES = [SessionStatus.WAITING, SessionStatus.HELPING] as const;

/** Closes open queues outside their scheduled window (does not delete rows). */
export const closeExpiredQueues = async (): Promise<void> => {
  const now = new Date();
  await prisma.queue.updateMany({
    where: {
      isOpen: true,
      OR: [
        { endsAt: { lte: now } },
        { startsAt: { gt: now } },
      ],
    },
    data: { isOpen: false },
  });
};

/** Lists WAITING and HELPING tickets with minimal student fields (no notification prefs). */
export const listActiveTickets = async (queueId: string): Promise<QueueTicket[]> => {
  return prisma.queueTicket.findMany({
    where: {
      queueId,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: [
      { position: 'asc' },
      { joinedAt: 'asc' },
    ],
    // Visible to all queue participants — omit notification prefs and other private fields.
    include: {
      student: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

/**
 * Throws unless `userId` may view ticket data for `queueId`: the queue's
 * TA/PROFESSOR, or a student who holds a ticket in that queue. Callers
 * (REST + Socket.IO) must call this before returning/broadcasting ticket data —
 * `listActiveTickets` itself does not check authorization.
 */
export const assertQueueViewer = async (queueId: string, userId: string): Promise<Queue> => {
  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue) {
    throw new Error('Queue not found');
  }
  if (!(await canViewQueue(queue, userId))) {
    throw new Error('You do not have access to this queue');
  }
  return queue;
};

/** Joins or reactivates a student's ticket in an open queue (transaction-safe). */
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

/** Marks the student's active ticket as LEFT and renumbers waiting positions. */
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

/** Moves a WAITING ticket to HELPING (transaction-safe against double-assignment). */
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

  await updatePosition(queueId);
  return ticket;
};

/** Marks a HELPING ticket as COMPLETED; idempotent if already completed. */
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
  
    if (ticketCheck?.status === 'COMPLETED') {
      return ticketCheck;
    }

    return await tx.queueTicket.update({ 
      where: { id: ticketId }, 
      data: { 
        status: SessionStatus.COMPLETED, 
        position: null 
      },
    });
  });

  await updatePosition(existing.queueId);
  return ticket;
};

/** Removes an active ticket (TA action); sets status to REMOVED and renumbers. */
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