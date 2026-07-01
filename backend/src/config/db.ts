import mongoose from 'mongoose'
import { env } from './env'

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri)
    console.log('🚀 MongoDB Connected Successfully!')
  } catch (error) {
    console.error('MongoDB connection failed', error)
    process.exit(1)
  }
}
