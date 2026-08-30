import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthedRequest } from './authz.middleware.js';

function perUserKey(req: Request): string {
    const userId = (req as AuthedRequest).user?.id;
    return userId ?? req.ip ?? 'unknown';
}

// Credential-guessing / signup-spam surface: keep this tight.
export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth requests, please try again later.' },
});

// Baseline protection for the rest of the authenticated API.
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});

/** Caps notification fan-out spam from a single account. */
export const notificationCreateRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: perUserKey,
    message: { message: 'Too many notifications sent, please try again later.' },
});

/** Caps rapid queue join/leave churn from a single student. */
export const queueJoinRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: perUserKey,
    message: { message: 'Too many queue actions, please try again later.' },
});
