import type { ZodType } from 'zod';
import { invalid } from '../../shared/domain-error';

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw invalid(result.error.issues[0]?.message ?? 'Invalid request');
  }
  return result.data;
}
