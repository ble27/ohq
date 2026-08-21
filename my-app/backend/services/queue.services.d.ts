import type { QueueTicket } from '../generated/prisma/client.js';
export declare const closeExpiredQueues: () => Promise<void>;
export declare const listActiveTickets: (queueId: string) => Promise<QueueTicket[]>;
export declare const joinQueue: (queueId: string, studentId: string) => Promise<QueueTicket>;
export declare const leaveQueue: (queueId: string, studentId: string) => Promise<QueueTicket>;
export declare const startHelping: (ticketId: string) => Promise<QueueTicket>;
export declare const completeTicket: (ticketId: string) => Promise<QueueTicket>;
export declare const removeFromQueue: (ticketId: string) => Promise<QueueTicket>;
//# sourceMappingURL=queue.services.d.ts.map