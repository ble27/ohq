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

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS must be set in production');
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/** Express app without Socket.IO, cron jobs, or listen — used by tests and `app.ts`. */
export function createApp() {
    const app = express();

    app.set('trust proxy', 1);
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(healthRouter);

    app.use('/api/auth', authRateLimiter, authRouter);
    app.use('/api/courses', apiRateLimiter, authMiddleware, courseRouter);
    app.use('/api/queues', apiRateLimiter, authMiddleware, queueRouter);
    app.use('/api/queueticket/', apiRateLimiter, authMiddleware, queueTicketRouter);
    app.use('/api/users', apiRateLimiter, authMiddleware, userRouter);
    app.use('/api/tas/', apiRateLimiter, authMiddleware, taRouter);
    app.use('/api/notifications', apiRateLimiter, authMiddleware, notificationRouter);

    return app;
}
