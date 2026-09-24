import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { corsOrigins, loadEnv } from './platform/config/env';
import { correlationMiddleware } from './platform/http/correlation.middleware';
import { DomainExceptionFilter } from './platform/http/exception.filter';

export async function createApp(): Promise<INestApplication> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
    abortOnError: env.NODE_ENV === 'test' ? false : undefined,
    logger: env.NODE_ENV === 'test' ? ['error'] : undefined,
  });
  if (env.NODE_ENV !== 'test') app.useLogger(app.get(Logger));
  app.getHttpAdapter().getInstance().set('etag', false);
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(helmet());
  app.use(cookieParser());
  app.use(correlationMiddleware);
  app.enableCors({ origin: corsOrigins(env), credentials: true });
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Bazaar API')
    .setDescription('Public /api/v1 and admin /admin/v1 commerce API')
    .setVersion('1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  return app;
}
