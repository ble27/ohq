import { prisma } from '../prisma.js';
import type { NotificationType } from '../../shared/types.js';

const NOTIFY_PREF_BY_TYPE = {
    JOIN: 'notifyJoin',
    LEAVE: 'notifyLeave',
    ASSIST: 'notifyAssist',
    CLOSE: 'notifyClose',
} as const;

type NotifyPreferenceField = typeof NOTIFY_PREF_BY_TYPE[NotificationType];

/** Maps a notification type to the corresponding User preference column. */
export function getNotifyPreferenceField(type: NotificationType): NotifyPreferenceField {
    return NOTIFY_PREF_BY_TYPE[type];
}

/** Returns whether the user has alerts enabled for the given notification type. */
export async function isNotificationEnabledForUser(
    userId: string,
    type: NotificationType,
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            notifyJoin: true,
            notifyLeave: true,
            notifyAssist: true,
            notifyClose: true,
        },
    });
    if (!user) return false;

    const field = getNotifyPreferenceField(type);
    return user[field];
}

/** Filters user ids to those who have alerts enabled for the given type. */
export async function filterRecipientsByNotificationPreference(
    userIds: string[],
    type: NotificationType,
): Promise<string[]> {
    if (userIds.length === 0) return [];

    const field = getNotifyPreferenceField(type);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            notifyJoin: true,
            notifyLeave: true,
            notifyAssist: true,
            notifyClose: true,
        },
    });
    return users.filter((user) => user[field]).map((user) => user.id);
}
