import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { SessionStatus } from '../generated/prisma/client.js';
import { closeExpiredQueues } from '../services/queue.services.js';

// Keep finished tickets around for same-day review (TAs checking "who did I
// help today"), then purge — otherwise QueueTicket grows forever.
const TICKET_RETENTION_MS = 24 * 60 * 60 * 1000;
// Cleared notifications are already dismissed by the user; no need to keep
// them past a month.
const CLEARED_NOTIFICATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const FINISHED_TICKET_STATUSES = [
    SessionStatus.COMPLETED,
    SessionStatus.LEFT,
    SessionStatus.REMOVED,
] as const;

/** Hard-deletes finished (COMPLETED/LEFT/REMOVED) tickets older than the retention window. */
export async function purgeFinishedTickets(): Promise<number> {
    const cutoff = new Date(Date.now() - TICKET_RETENTION_MS);
    const { count } = await prisma.queueTicket.deleteMany({
        where: {
            status: { in: [...FINISHED_TICKET_STATUSES] },
            updatedAt: { lt: cutoff },
        },
    });
    return count;
}

/** Hard-deletes notifications the recipient already cleared, past the retention window. */
export async function purgeClearedNotifications(): Promise<number> {
    const cutoff = new Date(Date.now() - CLEARED_NOTIFICATION_RETENTION_MS);
    const { count } = await prisma.notification.deleteMany({
        where: {
            clearedAt: { lt: cutoff },
        },
    });
    return count;
}

/**
 * Runs housekeeping that previously only happened as a side effect of someone
 * hitting the right route: closing expired queues, and purging old finished
 * tickets / cleared notifications so those tables don't grow unbounded.
 */
export function startCleanupJob(): void {
    // minute | hour | day of the month | month | day of the week
    // run once every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await closeExpiredQueues();
            const tickets = await purgeFinishedTickets();
            const notifications = await purgeClearedNotifications();
            if (tickets || notifications) {
                console.log(
                    `[CLEANUP] purged ${tickets} finished ticket(s), ${notifications} cleared notification(s)`,
                );
            }
        } catch (error) {
            console.error('[CLEANUP] job failed:', error);
        }
    });
}
