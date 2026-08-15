import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ApiExceptionFilter, initializeCommonDatabase } from '@shared/common';
import { AppModule } from './app.module';

const HTTP_PORT = Number(process.env.COMMUNITY_SERVICE_PORT || 5021);

async function bootstrap() {
  // errorHandler (used by ApiExceptionFilter) persists audit/API logs through
  // @shared/common's own DataSource, separate from this app's TypeOrmModule
  // connection — it must be initialized explicitly, same as auth-svc does.
  await initializeCommonDatabase();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api/community');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'transaction-id'],
  });

  await app.listen(HTTP_PORT, '0.0.0.0');
  console.log(`Community service running on port ${HTTP_PORT}`);
}

bootstrap().catch((error) => {
  console.error('Error during community service bootstrap:', error);
  process.exit(1);
});
