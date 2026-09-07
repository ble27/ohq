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

/** Starts the grace-period timer; when it fires, auto-closes the TA's open queues. */
function scheduleOfflineClose(userId: string) {
    cancelOfflineTimer(userId);
    const timer = setTimeout(() => {
        offlineTimersByUser.delete(userId);
        void closeOpenQueuesForTa(userId).catch((error) => {
            console.error(`[TA PRESENCE] Failed to auto-close queues for ${userId}:`, error);
        });
    }, TA_OFFLINE_GRACE_MS);
    offlineTimersByUser.set(userId, timer);
}

/** Returns whether the user is a TA or professor (tracks socket presence for queue auto-close). */
export async function isQueueManagerUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role === Role.TA || user?.role === Role.PROFESSOR;
}

/** Registers a TA socket connection and cancels any pending offline-close timer. */
export function registerTaSocket(userId: string, socketId: string) {
    let sockets = activeSocketsByUser.get(userId);
    if (!sockets) {
        sockets = new Set();
        activeSocketsByUser.set(userId, sockets);
    }
    sockets.add(socketId);
    cancelOfflineTimer(userId);
}

/** Removes a TA socket; schedules auto-close when the last socket disconnects. */
export function unregisterTaSocket(userId: string, socketId: string) {
    const sockets = activeSocketsByUser.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size > 0) return;

    activeSocketsByUser.delete(userId);
    scheduleOfflineClose(userId);
}

/** Immediately closes open queues — used on explicit sign-out or leave beacons. */
export async function closeQueuesOnTaLeave(userId: string): Promise<string[]> {
    cancelOfflineTimer(userId);
    activeSocketsByUser.delete(userId);
    return closeOpenQueuesForTa(userId);
}
