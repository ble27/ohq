import express, { Request, Response, NextFunction } from 'express'

const app = express()
const PORT: number = Number(process.env.PORT) || 3000

app.use(express.json())

interface HealthCheckResponse {
    uptime: number,
    message: string,
    timestamp: number
}

app.get('/health', async (req: Request, res: Response): Promise<void> => {
    const healthcheck: HealthCheckResponse = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.status(200).json(healthcheck);
    } catch (error: unknown) {
        healthcheck.message = error instanceof Error ? error.message : 'UNHEALTHY';
        res.status(503).json(healthcheck);
    }

});

app.listen(PORT, () => {
    console.log(`Server is runnning on port ${PORT}`)
})