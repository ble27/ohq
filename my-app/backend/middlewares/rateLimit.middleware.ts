import rateLimit from 'express-rate-limit';

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
