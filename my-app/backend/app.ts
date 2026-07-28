import express, { Request, Response, NextFunction } from 'express'

const app = express()
const PORT: number = Number(process.env.PORT) || 3000

app.use(express.json())

app.listen(PORT, () => {
    console.log(`Server is runnning on port ${PORT}`)
})