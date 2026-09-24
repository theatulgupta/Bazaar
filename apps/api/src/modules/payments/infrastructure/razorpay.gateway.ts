import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Razorpay from 'razorpay';
import { loadEnv } from '../../../platform/config/env';
import { PaymentGateway, type ProviderOrder } from '../application/payment.ports';

@Injectable()
export class RazorpayGateway extends PaymentGateway {
  private readonly client: Razorpay | null;
  private readonly driver: 'razorpay' | 'fake';

  constructor() {
    super();
    const env = loadEnv();
    this.driver = env.PAYMENTS_DRIVER;
    this.client =
      env.PAYMENTS_DRIVER === 'razorpay'
        ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
        : null;
  }

  async createOrder(input: { amountPaise: number; receipt: string }): Promise<ProviderOrder> {
    if (this.driver === 'fake' || !this.client) {
      return { id: `order_fake_${randomUUID().replace(/-/g, '')}` };
    }
    const order = await this.client.orders.create({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt.slice(0, 40),
    });
    return { id: order.id };
  }
}
