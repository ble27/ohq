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
import { updatePosition, updateCompletedAndLeft, removeSupported } from './services/queueTicket.services.js';

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
  // Join a specific course
  socket.on('join-queue', (queueId: string) => {
    socket.join(queueId);
    
    // Update position of all users in the queue
    io.to(queueId).emit('user-joined', socket.id);
    updatePosition(queueId);

    console.log(`User ${socket.id} joined ${queueId}`);
  });
  socket.on('leave-queue', (queueId: string) => {
    socket.leave(queueId);

    // Update position of all users in the queue
    io.to(queueId).emit('user-left', socket.id);
    updatePosition(queueId);
    updateCompletedAndLeft(queueId);
    
    console.log(`User ${socket.id} left ${queueId}`);
  });
});

io.on('disconnect', (socket: any) => {
  console.log(`User disconnected: ${socket.id}`);
});

app.use(express.json());
app.use(cookieParser());
app.use(healthRouter);

app.use('/api/auth', authRouter);
app.use('/api/queues', authMiddleware, queueRouter);
app.use('/api/queueticket/', authMiddleware, queueTicketRouter);
app.use('/api/users', authMiddleware, userRouter);

app.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
