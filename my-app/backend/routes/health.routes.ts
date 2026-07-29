import { Router } from 'express';
import type { Request, Response } from 'express';

const router: Router = Router();

interface HealthCheckResponse {
  uptime: number;
  message: string;
  timestamp: number;
}

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
