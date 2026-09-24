import 'reflect-metadata';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { FulfillmentService } from './composition/fulfillment.service';
import { loadEnv } from './platform/config/env';
import { PrismaService } from './platform/database/prisma.service';
import { OutboxDispatcher } from './platform/outbox/outbox.dispatcher';
import { metricsRegistry } from './platform/telemetry/metrics';
import { shutdownTelemetry, startTelemetry } from './platform/telemetry/telemetry';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const env = loadEnv();
  startTelemetry('bazaar-worker', env.OTEL_EXPORTER_OTLP_ENDPOINT);
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const dispatcher = app.get(OutboxDispatcher);
  const fulfillment = app.get(FulfillmentService);
  const prisma = app.get(PrismaService);

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await dispatcher.drainOnce();
      await fulfillment.expireReservations();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), 1000);
  await tick();

  const health = express();
  health.get('/health', (_req, res) => res.json({ status: 'ok' }));
  health.get('/ready', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  });
  health.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });
  const server = health.listen(env.WORKER_PORT);
  logger.log(`Worker listening on ${env.WORKER_PORT}`);

  const shutdown = async () => {
    clearInterval(timer);
    server.close();
    await app.close();
    await shutdownTelemetry();
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void bootstrap();
