import 'reflect-metadata';
import { createApp } from './create-app';
import { loadEnv } from './platform/config/env';
import { shutdownTelemetry, startTelemetry } from './platform/telemetry/telemetry';

async function bootstrap() {
  const env = loadEnv();
  startTelemetry('bazaar-api', env.OTEL_EXPORTER_OTLP_ENDPOINT);
  const app = await createApp();
  await app.listen(env.PORT);
  const shutdown = async () => {
    await app.close();
    await shutdownTelemetry();
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void bootstrap();
