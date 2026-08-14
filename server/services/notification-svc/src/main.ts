import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const HTTP_PORT = Number(
  process.env.NOTIFICATION_SERVICE_PORT ||
    process.env.ERP_NOTIFICATION_SERVICE_PORT ||
    5011,
);
const TCP_PORT = Number(
  process.env.PORT_TCP ||
    process.env.NOTIFICATION_MICROSERVICE_PORT ||
    process.env.ERP_NOTIFICATION_TCP_PORT ||
    6011,
);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: TCP_PORT,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api/notifications');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'transaction-id'],
  });

  await app.startAllMicroservices();
  await app.listen(HTTP_PORT, '0.0.0.0');

  console.log(`Notification HTTP service running on port ${HTTP_PORT}`);
  console.log(`Notification TCP microservice listening on port ${TCP_PORT}`);
}

bootstrap().catch((error) => {
  console.error('Error during notification service bootstrap:', error);
  process.exit(1);
});
