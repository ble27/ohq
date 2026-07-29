import express, { Request, Response, NextFunction } from 'express'
import { queueRouter } from './routes/queue.routes'
import { healthRouter } from './routes/health.routes'
import 'dotenv/config';


const app = express()
const PORT: number = Number(process.env.PORT) || 3000

app.use(express.json())
app.use(healthRouter)

app.use('/api/queues', queueRouter);

app.listen(PORT, () => {
    console.log(`Server is runnning on port ${PORT}`)
})