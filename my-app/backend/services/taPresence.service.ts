import { Role } from '../generated/prisma/client.js';
import { prisma } from '../prisma.js';
import { closeOpenQueuesForTa } from './taQueueLifecycle.service.js';

/** How long to wait after the last socket disconnects before auto-closing open queues. */
export const TA_OFFLINE_GRACE_MS = 5 * 60 * 1000;

const activeSocketsByUser = new Map<string, Set<string>>();
const offlineTimersByUser = new Map<string, NodeJS.Timeout>();

function cancelOfflineTimer(userId: string) {
    const timer = offlineTimersByUser.get(userId);
    if (!timer) return;
    clearTimeout(timer);
    offlineTimersByUser.delete(userId);
}

function scheduleOfflineClose(userId: string) {
    cancelOfflineTimer(userId);
    // when the timer's up, schedule deleting from map and closing the queue
    const timer = setTimeout(() => {
        offlineTimersByUser.delete(userId);
        void closeOpenQueuesForTa(userId).catch((error) => {
            console.error(`[TA PRESENCE] Failed to auto-close queues for ${userId}:`, error);
        });
    }, TA_OFFLINE_GRACE_MS);
    offlineTimersByUser.set(userId, timer);
}

export async function isQueueManagerUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role === Role.TA || user?.role === Role.PROFESSOR;
}

export function registerTaSocket(userId: string, socketId: string) {
    let sockets = activeSocketsByUser.get(userId);
    if (!sockets) {
        sockets = new Set();
        activeSocketsByUser.set(userId, sockets);
    }
    sockets.add(socketId);
    cancelOfflineTimer(userId);
}

export function unregisterTaSocket(userId: string, socketId: string) {
    const sockets = activeSocketsByUser.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size > 0) return;

    activeSocketsByUser.delete(userId);
    scheduleOfflineClose(userId);
}

/** Immediate close — used on explicit sign-out or leave beacons. */
export async function closeQueuesOnTaLeave(userId: string): Promise<string[]> {
    cancelOfflineTimer(userId);
    activeSocketsByUser.delete(userId);
    return closeOpenQueuesForTa(userId);
}
