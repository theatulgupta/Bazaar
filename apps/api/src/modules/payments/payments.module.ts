import { Module } from '@nestjs/common';
import { PaymentGateway, PaymentStore } from './application/payment.ports';
import { WebhookController } from '../../interface/webhook.controller';
import { WebhookService } from './application/webhook.service';
import { PrismaPayments } from './infrastructure/payment.prisma';
import { RazorpayGateway } from './infrastructure/razorpay.gateway';

@Module({
  controllers: [WebhookController],
  providers: [
    PrismaPayments,
    { provide: PaymentStore, useExisting: PrismaPayments },
    RazorpayGateway,
    { provide: PaymentGateway, useExisting: RazorpayGateway },
    WebhookService,
  ],
  exports: [PaymentStore, PaymentGateway, WebhookService],
})
export class PaymentsModule {}
