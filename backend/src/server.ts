import { app } from './app'
import { connectDatabase } from './config/db'
import { env } from './config/env'

async function bootstrap() {
  await connectDatabase()

  app.listen(env.port, () => {
    console.log(`ReadQuest API running at http://127.0.0.1:${env.port}`)
  })
}

bootstrap()
