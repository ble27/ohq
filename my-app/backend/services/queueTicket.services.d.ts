import type { QueueTicket } from '../generated/prisma/client.js';
/**
 * Re-number WAITING tickets by joinedAt (1..n).
 * Empty waiting list is success — returns [].
 */
export declare const updatePosition: (queueId: string) => Promise<QueueTicket[]>;
/**
 * Soft-clear finished tickets' positions only (keeps rows for metrics).
 * Prefer status transitions via leave/complete/remove instead of deleting.
 */
export declare const clearInactivePositions: (queueId: string) => Promise<import("../generated/prisma/index.js").Prisma.BatchPayload>;
export declare const findQueueIdByTicketId: (ticketId: string) => Promise<string>;
//# sourceMappingURL=queueTicket.services.d.ts.map