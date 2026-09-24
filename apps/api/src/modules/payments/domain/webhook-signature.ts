import { createHmac, timingSafeEqual } from 'crypto';

export function signWebhook(raw: Buffer | string, secret: string): string {
  return createHmac('sha256', secret).update(raw).digest('hex');
}

export function verifyWebhookSignature(
  raw: Buffer | string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signWebhook(raw, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
