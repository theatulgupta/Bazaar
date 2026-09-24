import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'crypto';
import { Public } from '../platform/auth/current-user';
import { invalid } from '../shared/domain-error';
import { WebhookService } from '../modules/payments/application/webhook.service';

@ApiExcludeController()
@Controller('webhooks/razorpay')
export class WebhookController {
  constructor(private readonly webhooks: WebhookService) {}

  @Public()
  @HttpCode(200)
  @Post()
  async ingest(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-event-id') eventId?: string,
  ) {
    if (!req.rawBody) throw invalid('Missing raw body');
    const id = eventId || createHash('sha256').update(req.rawBody).digest('hex');
    await this.webhooks.ingest(req.rawBody, signature, id);
    return { data: { received: true } };
  }
}
