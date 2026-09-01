import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRouter from './routes/auth'
import notesRouter from './routes/notes'
import tagsRouter from './routes/tags'
import { errorHandler } from './middlewares/error'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('tiny'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/notes', notesRouter)
app.use('/api/tags', tagsRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`)
})
