import { Router } from 'express';
const router = Router();
// GET /health — liveness probe; always public, never behind authMiddleware
router.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
    };
    try {
        res.status(200).json(healthcheck);
    }
    catch (error) {
        healthcheck.message = error instanceof Error ? error.message : 'UNHEALTHY';
        res.status(503).json(healthcheck);
    }
});
export const healthRouter = router;
//# sourceMappingURL=health.routes.js.map