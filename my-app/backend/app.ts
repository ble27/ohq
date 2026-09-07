import 'dotenv/config';
import { createApp } from './createApp.js';
import { Server, Socket } from 'socket.io';
import http from 'http';
import { socketMiddleware } from './middlewares/socket.middleware.js';
import { setIo } from './socket.js';
import { prisma } from './prisma.js';
import { isQueueManager } from './middlewares/authz.middleware.js';
import { startCleanupJob } from './jobs/cleanup.job.js';
import { listActiveTickets, assertQueueViewer } from './services/queue.services.js';
import { startHelping, completeTicket } from './services/queue.services.js';
import {
    isQueueManagerUser,
    registerTaSocket,
    unregisterTaSocket,
} from './services/taPresence.service.js';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Loads the queue a ticket belongs to and confirms the caller manages it
 * (queue TA or PROFESSOR). Throws if the ticket/queue is missing or the
 * caller isn't authorized — callers should catch and report via
 * `reportSocketError` instead of mutating ticket state.
 */
async function authorizeQueueManagerForTicket(ticketId: string, userId: string) {
    const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');
    const queue = await prisma.queue.findUnique({ where: { id: ticket.queueId } });
    if (!queue) throw new Error('Queue not found');
    const allowed = await isQueueManager(queue, userId);
    if (!allowed) throw new Error('You do not manage this queue');
    return queue;
}

const app = createApp();
const PORT: number = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

setIo(io);

io.use(socketMiddleware);
io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).user?.id;

    await socket.join(`user:${userId}`);

    const tracksTaPresence = userId ? await isQueueManagerUser(userId) : false;
    if (tracksTaPresence && userId) {
        registerTaSocket(userId, socket.id);
    }

    const reportSocketError = (event: string, error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unexpected socket error';
        console.error(`[SOCKET] ${event} failed for user ${userId}:`, message);
        socket.emit('queue-error', { event, message });
    };

    socket.on('disconnect', () => {
        if (tracksTaPresence && userId) {
            unregisterTaSocket(userId, socket.id);
        }
    });

    socket.on('watch-queue', async (queueId: string) => {
        try {
            await assertQueueViewer(queueId, userId);
            await socket.join(queueId);
            const tickets = await listActiveTickets(queueId);
            io.to(queueId).emit('queue-updated', tickets);
        } catch (error: unknown) {
            reportSocketError('watch-queue', error);
        }
    });

    socket.on('unwatch-queue', async (queueId: string) => {
        try {
            await socket.leave(queueId);
        } catch (error: unknown) {
            reportSocketError('unwatch-queue', error);
        }
    });

    socket.on('refresh-queue', async (queueId: string) => {
        try {
            await assertQueueViewer(queueId, userId);
            const tickets = await listActiveTickets(queueId);
            io.to(queueId).emit('queue-updated', tickets);
        } catch (error: unknown) {
            reportSocketError('refresh-queue', error);
        }
    });

    socket.on('start-helping', async (ticketId: string) => {
        try {
            const queue = await authorizeQueueManagerForTicket(ticketId, userId);
            await startHelping(ticketId);
            const tickets = await listActiveTickets(queue.id);
            io.to(queue.id).emit('queue-updated', tickets);
        } catch (error: unknown) {
            reportSocketError('start-helping', error);
        }
    });

    socket.on('complete-ticket', async (ticketId: string) => {
        try {
            const queue = await authorizeQueueManagerForTicket(ticketId, userId);
            await completeTicket(ticketId);
            const tickets = await listActiveTickets(queue.id);
            io.to(queue.id).emit('queue-updated', tickets);
        } catch (error: unknown) {
            reportSocketError('complete-ticket', error);
        }
    });
});

startCleanupJob();

server.listen(PORT, () => {
    console.log(`Server is runnning on port ${PORT}`);
});
