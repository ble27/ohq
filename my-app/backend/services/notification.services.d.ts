import type { NotificationType } from '../../shared/types.js';
declare const NOTIFY_PREF_BY_TYPE: {
    readonly JOIN: "notifyJoin";
    readonly LEAVE: "notifyLeave";
    readonly ASSIST: "notifyAssist";
    readonly CLOSE: "notifyClose";
};
type NotifyPreferenceField = typeof NOTIFY_PREF_BY_TYPE[NotificationType];
export declare function getNotifyPreferenceField(type: NotificationType): NotifyPreferenceField;
export declare function isNotificationEnabledForUser(userId: string, type: NotificationType): Promise<boolean>;
export declare function filterRecipientsByNotificationPreference(userIds: string[], type: NotificationType): Promise<string[]>;
export {};
//# sourceMappingURL=notification.services.d.ts.map