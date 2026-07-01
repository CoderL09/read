import dotenv from 'dotenv'

dotenv.config({ quiet: true })

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/readquest',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5173',
}
