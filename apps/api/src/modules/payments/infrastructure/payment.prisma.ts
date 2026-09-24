import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service';
import type { Tx } from '../../../platform/database/unit-of-work';
import {
  PaymentStore,
  type CaptureResult,
  type CapturedPayment,
  type PaymentView,
} from '../application/payment.ports';

@Injectable()
export class PrismaPayments extends PaymentStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createPending(tx: Tx, input: { orderId: string; amountPaise: number }): Promise<{ id: string }> {
    const row = await tx.payment.create({
      data: { orderId: input.orderId, amountPaise: input.amountPaise, status: 'created', currency: 'INR' },
    });
    return { id: row.id };
  }

  async attachProviderOrder(paymentId: string, razorpayOrderId: string): Promise<void> {
    await this.prisma.payment.update({ where: { id: paymentId }, data: { razorpayOrderId } });
  }

  async markFailed(tx: Tx, orderId: string): Promise<void> {
    await tx.payment.updateMany({ where: { orderId, status: 'created' }, data: { status: 'failed' } });
  }

  async markCaptured(tx: Tx, razorpayOrderId: string, razorpayPaymentId: string): Promise<CaptureResult> {
    const payment = await tx.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) return { kind: 'missing' };
    if (payment.status === 'captured') return { kind: 'duplicate' };
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'captured', razorpayPaymentId },
    });
    return {
      kind: 'captured',
      payment: { orderId: payment.orderId, paymentId: payment.id, amountPaise: payment.amountPaise },
    };
  }

  async markFailedByProviderOrder(tx: Tx, razorpayOrderId: string): Promise<CapturedPayment | null> {
    const payment = await tx.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment || payment.status !== 'created') return null;
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    return { orderId: payment.orderId, paymentId: payment.id, amountPaise: payment.amountPaise };
  }

  async findByOrder(orderId: string): Promise<PaymentView | null> {
    const row = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!row) return null;
    return {
      orderId: row.orderId,
      status: row.status as PaymentView['status'],
      amountPaise: row.amountPaise,
      currency: row.currency,
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
    };
  }

  async recordWebhook(tx: Tx, eventId: string, eventType: string, payload: unknown): Promise<boolean> {
    try {
      await tx.webhookEvent.create({
        data: { eventId, eventType, payload: payload as Prisma.InputJsonValue },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      throw error;
    }
  }
}
