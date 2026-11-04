import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function registerMongoBackgroundErrorHandlers() {
  const logMongo = (reason: unknown) => {
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'unknown');
    if (
      !message.includes('MongoServerSelection') &&
      !message.includes('MongoDB') &&
      !message.includes('SSL routines')
    ) {
      return false;
    }
    console.error(
      '[MongoDB] Atlas no conectado. Network Access → agregá tu IP pública. Detalle:',
      message.split('\n')[0],
    );
    return true;
  };

  process.on('unhandledRejection', (reason) => {
    logMongo(reason);
  });
  process.on('uncaughtException', (error) => {
    if (logMongo(error)) {
      return;
    }
    throw error;
  });
}

registerMongoBackgroundErrorHandlers();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });
  app.enableCors({
    origin: true,
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-app-version',
      'x-platform',
      'x-request-id',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = Number(process.env.PORT ?? 3000);

  try {
    await app.listen(port);
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError?.code === 'EADDRINUSE') {
      console.error(
        `Puerto ${port} en uso (PORT=${process.env.PORT ?? '3000'}). ` +
          `Cerrá el otro proceso Node o cambiá PORT en .env. ` +
          `Windows: netstat -ano | findstr :${port}`,
      );
      process.exit(1);
    }
    throw error;
  }

  console.log(`RachasBack listening on http://localhost:${port}`);
  console.log(`Health check: GET http://localhost:${port}/health`);
}
bootstrap();
