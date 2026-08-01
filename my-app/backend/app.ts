import 'dotenv/config';
import express from 'express';
import { queueRouter } from './routes/queue.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { queueTicketRouter } from './routes/queueTicket.routes.js';
import { authRouter } from './routes/auth.routes.js';
import authMiddleware from './middlewares/auth.js';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(healthRouter);

app.use('/api/auth', authRouter);
app.use('/api/queues', authMiddleware, queueRouter);
app.use('/api/queueticket/', authMiddleware, queueTicketRouter);
app.use('/api/users', authMiddleware, userRouter);

app.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
