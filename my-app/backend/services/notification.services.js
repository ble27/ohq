import { prisma } from '../prisma.js';
const NOTIFY_PREF_BY_TYPE = {
    JOIN: 'notifyJoin',
    LEAVE: 'notifyLeave',
    ASSIST: 'notifyAssist',
    CLOSE: 'notifyClose',
};
export function getNotifyPreferenceField(type) {
    return NOTIFY_PREF_BY_TYPE[type];
}
export async function isNotificationEnabledForUser(userId, type) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            notifyJoin: true,
            notifyLeave: true,
            notifyAssist: true,
            notifyClose: true,
        },
    });
    if (!user)
        return false;
    const field = getNotifyPreferenceField(type);
    return user[field];
}
export async function filterRecipientsByNotificationPreference(userIds, type) {
    if (userIds.length === 0)
        return [];
    const field = getNotifyPreferenceField(type);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        // select field returns the id + 4 preferences (it doesn't modify original status)
        select: {
            id: true,
            notifyJoin: true,
            notifyLeave: true,
            notifyAssist: true,
            notifyClose: true,
        },
    });
    // user[field] = user.field
    // filter by each object then for each user in the object return the id
    return users.filter((user) => user[field]).map((user) => user.id);
}
//# sourceMappingURL=notification.services.js.map