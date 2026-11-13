import 'reflect-metadata'
import 'dotenv/config'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // The panel calls the API through Vite's /api proxy; CORS is for other origins (e.g. a deployed frontend).
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim())
  app.enableCors({ origin: origins })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  Logger.log(`API running on http://localhost:${port}/api`, 'Bootstrap')
}

void bootstrap()
