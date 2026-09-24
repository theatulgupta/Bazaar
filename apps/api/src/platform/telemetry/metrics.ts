import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'HTTP requests handled by the API',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [metricsRegistry],
});

export const outboxProcessed = new Counter({
  name: 'outbox_processed_total',
  help: 'Outbox messages processed by the worker',
  labelNames: ['type', 'result'] as const,
  registers: [metricsRegistry],
});
