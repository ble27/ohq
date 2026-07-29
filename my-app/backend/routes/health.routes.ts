import { Router } from 'express';
import type { Request, Response } from 'express';
import type { HealthCheckResponse } from '../../shared/types.js';

const router: Router = Router();

router.get('/health', async (req: Request, res: Response): Promise<void> => {
    const healthcheck: HealthCheckResponse = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
    };
    try {
        res.status(200).json(healthcheck);
    } catch (error: unknown) {
        healthcheck.message = error instanceof Error ? error.message : 'UNHEALTHY';
        res.status(503).json(healthcheck);
    }
});

export const healthRouter = router;
