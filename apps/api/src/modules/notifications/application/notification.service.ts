import { Injectable } from '@nestjs/common';
import { loadEnv } from '../../../platform/config/env';
import { Mailer } from './mailer';

@Injectable()
export class NotificationService {
  constructor(private readonly mailer: Mailer) {}

  async sendVerification(input: { email: string; name: string; token: string }): Promise<void> {
    const env = loadEnv();
    const link = `${env.APP_PUBLIC_URL}/verify-email?token=${input.token}`;
    await this.mailer.send({
      to: input.email,
      subject: 'Verify your Bazaar account',
      text: `Hello ${input.name},\n\nVerify your email: ${link}\n`,
    });
  }

  async sendOrderPaid(input: { email: string; number: string; totalPaise: number }): Promise<void> {
    const rupees = (input.totalPaise / 100).toFixed(2);
    await this.mailer.send({
      to: input.email,
      subject: `Order ${input.number} confirmed`,
      text: `We received payment for ${input.number}. Total ₹${rupees}.`,
    });
  }
}
