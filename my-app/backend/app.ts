import express from 'express';
import { queueRouter } from './routes/queue.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import 'dotenv/config';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(healthRouter);

app.use('/api/queues', queueRouter);
app.use('/api/users', userRouter);

app.listen(PORT, () => {
  console.log(`Server is runnning on port ${PORT}`);
});
