import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { queueRouter } from './routes/queue.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { queueTicketRouter } from './routes/queueTicket.routes.js';
import { authRouter } from './routes/auth.routes.js';
import authMiddleware from './middlewares/auth.js';
import { Server } from 'socket.io';
import http from 'http';

// Service helpers
import { listActiveTickets } from './services/queue.services.js';

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
io.on('connection', (socket: any) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
  // Join a specific queue room (DB join should happen via API + joinQueue service)
  socket.on('join-queue', async (queueId: string) => {
    socket.join(queueId);
    const tickets = await listActiveTickets(queueId);
    io.to(queueId).emit('queue-updated', tickets);
    console.log(`User ${socket.id} joined room ${queueId}`);
  });
  socket.on('leave-queue', async (queueId: string) => {
    socket.leave(queueId);
    const tickets = await listActiveTickets(queueId);
    io.to(queueId).emit('queue-updated', tickets);
    console.log(`User ${socket.id} left room ${queueId}`);
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(healthRouter);

app.use('/api/auth', authRouter);
app.use('/api/queues', authMiddleware, queueRouter);
app.use('/api/queueticket/', authMiddleware, queueTicketRouter);
app.use('/api/users', authMiddleware, userRouter);

server.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
