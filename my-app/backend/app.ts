import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { queueRouter } from './routes/queue.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { queueTicketRouter } from './routes/queueTicket.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { courseRouter } from './routes/course.routes.js';
import { taRouter } from './routes/ta.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import authMiddleware from './middlewares/auth.middleware.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimit.middleware.js';
import { Server, Socket } from 'socket.io';
import http from 'http';
import { socketMiddleware } from './middlewares/socket.middleware.js';
import { setIo } from './socket.js';
import { prisma } from './prisma.js';
import { isQueueManager } from './middlewares/authz.middleware.js';
import { startCleanupJob } from './jobs/cleanup.job.js';

// Comma-separated list of allowed browser origins (both HTTP CORS and Socket.IO CORS).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Socket Services helpers
import { listActiveTickets } from './services/queue.services.js';
import { startHelping, completeTicket } from './services/queue.services.js';

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

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

// Initialize SOCKET.IO with CORS enabled
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Save server instance
setIo(io);

// IO = web socket server, socket = client
io.use(socketMiddleware);
io.on('connection', async (socket: Socket) => {
  // from socket middleware
  const userId = (socket as any).user?.id;

  // join the userId room 
  await socket.join(`user:${userId}`);

  const reportSocketError = (event: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected socket error';
    console.error(`[SOCKET] ${event} failed for user ${userId}:`, message);
    socket.emit('queue-error', { event, message });
  };

  // console.log(`User connected: ${userId}`);

  socket.on('disconnect', (reason) => {
    // console.log(`User ${userId} disconnected: ${reason}`);
  });

  // Room subscriptions never create or update queue tickets.
  socket.on('watch-queue', async (queueId: string) => {
    try {
      await socket.join(queueId);
      const tickets = await listActiveTickets(queueId);
      io.to(queueId).emit('queue-updated', tickets);
      // console.log(`User ${userId} is watching room ${queueId}`);
    } catch (error: unknown) {
      reportSocketError('watch-queue', error);
    }
  });

  socket.on('unwatch-queue', async (queueId: string) => {
    try {
      await socket.leave(queueId);
      // console.log(`User ${userId} stopped watching room ${queueId}`);
    } catch (error: unknown) {
      reportSocketError('unwatch-queue', error);
    }
  });

  socket.on('refresh-queue', async (queueId: string) => {
    try {
      const tickets = await listActiveTickets(queueId);
      io.to(queueId).emit('queue-updated', tickets);
    } catch (error: unknown) {
      reportSocketError('refresh-queue', error);
    }
  });

  // Need ticket id and expect ticket id. Only the queue's TA (or a PROFESSOR)
  // may move a ticket into HELPING.
  socket.on('start-helping', async (ticketId: string) => {
    try {
      const queue = await authorizeQueueManagerForTicket(ticketId, userId);
      await startHelping(ticketId);
      const tickets = await listActiveTickets(queue.id);
      io.to(queue.id).emit('queue-updated', tickets);
      // console.log(`User ${userId} started helping in room ${queue.id}`);
    } catch (error: unknown) {
      reportSocketError('start-helping', error);
    }
  });

  // Expect ticket id. Only the queue's TA (or a PROFESSOR) may complete a ticket.
  socket.on('complete-ticket', async (ticketId: string) => {
    try {
      const queue = await authorizeQueueManagerForTicket(ticketId, userId);
      await completeTicket(ticketId);
      const tickets = await listActiveTickets(queue.id);
      io.to(queue.id).emit('queue-updated', tickets);
      // console.log(`User ${userId} completed ticket ${ticketId}`);
    } catch (error: unknown) {
      reportSocketError('complete-ticket', error);
    }
  });
});

// Security headers + explicit HTTP CORS policy (Socket.IO has its own above).
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use(healthRouter);

// Auth endpoints get a tighter rate limit (credential guessing / signup spam).
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/courses', apiRateLimiter, authMiddleware, courseRouter);
app.use('/api/queues', apiRateLimiter, authMiddleware, queueRouter);
app.use('/api/queueticket/', apiRateLimiter, authMiddleware, queueTicketRouter);
app.use('/api/users', apiRateLimiter, authMiddleware, userRouter);
app.use('/api/tas/', apiRateLimiter, authMiddleware, taRouter);
app.use('/api/notifications', apiRateLimiter, authMiddleware, notificationRouter);

// Housekeeping (closing expired queues, purging old finished tickets/notifications)
// used to only happen as a side effect of someone hitting the right route.
// Run it on a schedule so it isn't dependent on traffic.
startCleanupJob();

server.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
