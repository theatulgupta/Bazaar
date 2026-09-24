import { Injectable } from '@nestjs/common';
import { loadEnv } from '../../../platform/config/env';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { UnitOfWork } from '../../../platform/database/unit-of-work';
import { DomainError, unauthorized } from '../../../shared/domain-error';
import { verifyWebhookSignature } from '../domain/webhook-signature';
import { PaymentStore } from './payment.ports';

type RazorpayEvent = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
};

@Injectable()
export class WebhookService {
  constructor(
    private readonly payments: PaymentStore,
    private readonly outbox: OutboxService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async ingest(raw: Buffer, signature: string | undefined, eventId: string): Promise<void> {
    const env = loadEnv();
    if (!verifyWebhookSignature(raw, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
      throw unauthorized('Invalid webhook signature');
    }
    const event = JSON.parse(raw.toString('utf8')) as RazorpayEvent;
    if (event.event !== 'payment.captured' && event.event !== 'payment.failed') return;

    const providerOrderId = event.payload?.payment?.entity?.order_id;
    const providerPaymentId = event.payload?.payment?.entity?.id;
    if (!providerOrderId || !providerPaymentId) return;

    await this.unitOfWork.run(async (tx) => {
      const fresh = await this.payments.recordWebhook(tx, eventId, event.event!, event);
      if (!fresh) return;
      if (event.event === 'payment.captured') {
        const captured = await this.payments.markCaptured(tx, providerOrderId, providerPaymentId);
        if (captured.kind === 'missing') throw new DomainError('not_ready', 'Payment is not ready to capture', 503);
        if (captured.kind === 'duplicate') return;
        await this.outbox.append(tx, 'payments.captured', captured.payment);
        return;
      }
      const failed = await this.payments.markFailedByProviderOrder(tx, providerOrderId);
      if (!failed) return;
      await this.outbox.append(tx, 'payments.failed', { orderId: failed.orderId, paymentId: failed.paymentId });
    });
  }
}
