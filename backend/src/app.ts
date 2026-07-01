import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { bookRouter } from './routes/book.routes'
import { healthRouter } from './routes/health.routes'

export const app = express()

app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/books', bookRouter)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error) {
    const status = error.name === 'MulterError' ? 400 : 500
    res.status(status).json({ message: error.message })
    return
  }

  res.status(500).json({ message: 'Unexpected server error.' })
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})
