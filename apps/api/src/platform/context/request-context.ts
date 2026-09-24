import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextStore = {
  correlationId: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function currentCorrelationId(): string {
  return requestContext.getStore()?.correlationId ?? 'unknown';
}
