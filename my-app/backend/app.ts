import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { queueRouter } from './routes/queue.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { queueTicketRouter } from './routes/queueTicket.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { courseRouter } from './routes/course.routes.js';
import authMiddleware from './middlewares/auth.middleware.js';
import { Server, Socket } from 'socket.io';
import http from 'http';
import { socketMiddleware } from './middlewares/socket.middleware.js';

// Socket Services helpers
import { listActiveTickets } from './services/queue.services.js';
import { joinQueue, leaveQueue, startHelping, completeTicket } from './services/queue.services.js';
import { findQueueIdByTicketId } from './services/queueTicket.services.js';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

// Initialize SOCKET.IO with CORS enabled
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
})

// IO = web socket server, socket = client
io.use(socketMiddleware);
io.on('connection', async (socket: Socket) => {
  const userId = (socket as any).user?.id;
  
  console.log(`User connected: ${userId}`);
  
  // Client side wants to disconnect -> must send queue id to server
  socket.on('disconnect', async () => {
    socket.disconnect();
  });

  // Join queue
  socket.on('join-queue', async (queueId: string) => {
    socket.join(queueId);

    await joinQueue(queueId, userId);
    const tickets = await listActiveTickets(queueId);

    io.to(queueId).emit('queue-updated', tickets);
    console.log(`User ${socket.id} joined room ${queueId}`);
  });

  // Leave queue
  socket.on('leave-queue', async (queueId: string) => {
    socket.leave(queueId);

    await leaveQueue(queueId, userId);
    const tickets = await listActiveTickets(queueId);

    io.to(queueId).emit('queue-updated', tickets);
    console.log(`User ${socket.id} left room ${queueId}`);
  });

  // Need ticket id and expect ticket id
  socket.on('start-helping', async (ticketId: string) => {
    await startHelping(ticketId);

    const queueId = await findQueueIdByTicketId(ticketId);
    const tickets = await listActiveTickets(queueId);
    
    io.to(queueId).emit('queue-updated', tickets);
    console.log(`User ${userId} started helping in room ${queueId}`);
  });

  // Expect ticket id
  socket.on('complete-ticket', async (ticketId: string) => {
    await completeTicket(ticketId);
    const queueId = await findQueueIdByTicketId(ticketId);
    io.to(queueId).emit('ticket-completed', ticketId, userId);
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(healthRouter);

app.use('/api/auth', authRouter);
app.use('/api/courses', authMiddleware, courseRouter);
app.use('/api/queues', authMiddleware, queueRouter);
app.use('/api/queueticket/', authMiddleware, queueTicketRouter);
app.use('/api/users', authMiddleware, userRouter);

server.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
