import { Injectable } from '@nestjs/common';
import type { Order, OrderStatus } from '@bazaar/contracts';
import { AuditService } from '../platform/audit/audit.service';
import type { AuthUser } from '../platform/auth/current-user';
import { UnitOfWork } from '../platform/database/unit-of-work';
import { OutboxService } from '../platform/outbox/outbox.service';
import { OutboxHandler, type OutboxEnvelope } from '../platform/outbox/outbox.handler';
import type { OutboxPayloads } from '../platform/outbox/outbox.types';
import { invalid, notFound } from '../shared/domain-error';
import { InventoryWriter } from '../modules/inventory/application/inventory.ports';
import { NotificationService } from '../modules/notifications/application/notification.service';
import { OrderStore } from '../modules/orders/application/order.ports';
import { customerCanCancel } from '../modules/orders/domain/order-status';

@Injectable()
export class FulfillmentService extends OutboxHandler {
  constructor(
    private readonly orders: OrderStore,
    private readonly inventory: InventoryWriter,
    private readonly notifications: NotificationService,
    private readonly outbox: OutboxService,
    private readonly unitOfWork: UnitOfWork,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async handle(message: OutboxEnvelope): Promise<void> {
    switch (message.type) {
      case 'identity.user_registered':
        await this.notifications.sendVerification(message.payload as OutboxPayloads['identity.user_registered']);
        return;
      case 'checkout.order_placed':
        return;
      case 'payments.captured':
        await this.onCaptured(message.payload as OutboxPayloads['payments.captured']);
        return;
      case 'payments.failed':
        await this.onFailed(message.payload as OutboxPayloads['payments.failed']);
        return;
      case 'orders.paid':
        await this.notifications.sendOrderPaid(message.payload as OutboxPayloads['orders.paid']);
        return;
      default:
        return;
    }
  }

  async expireReservations(now = new Date()): Promise<number> {
    const orderIds = await this.inventory.expireDue(now);
    for (const orderId of orderIds) {
      try {
        await this.unitOfWork.run(async (tx) => {
          const result = await this.orders.markFailed(tx, orderId);
          if (result?.changed) {
            await this.audit.record(
              {
                action: 'orders.payment_failed',
                entityType: 'order',
                entityId: orderId,
                metadata: { reason: 'reservation_expired' },
              },
              tx,
            );
          }
        });
      } catch {
        // A payment may have won the race and moved the order out of payment_pending.
      }
    }
    return orderIds.length;
  }

  async cancel(actor: AuthUser, orderId: string): Promise<Order> {
    const order = actor.role === 'ADMIN' ? await this.orders.get(orderId) : await this.orders.getForUser(actor.id, orderId);
    if (!order) throw notFound('Order not found');
    if (actor.role !== 'ADMIN' && !customerCanCancel(order.status)) {
      throw invalid('This order can no longer be cancelled');
    }
    const updated = await this.unitOfWork.run(async (tx) => {
      await this.inventory.restoreForCancel(tx, orderId);
      const next = await this.orders.apply(tx, orderId, 'cancelled');
      await this.audit.record(
        {
          actorId: actor.id,
          action: 'orders.cancelled',
          entityType: 'order',
          entityId: orderId,
          metadata: { from: order.status },
        },
        tx,
      );
      return next;
    });
    return updated;
  }

  async fulfill(actorId: string, orderId: string, status: OrderStatus): Promise<Order> {
    if (status === 'cancelled') {
      const order = await this.orders.get(orderId);
      if (!order) throw notFound('Order not found');
      return this.cancel({ id: actorId, role: 'ADMIN', email: '', name: '', permissions: [], emailVerified: true }, orderId);
    }
    const updated = await this.orders.transition(orderId, status);
    await this.audit.record({
      actorId,
      action: 'orders.transition',
      entityType: 'order',
      entityId: orderId,
      metadata: { status },
    });
    return updated;
  }

  private async onCaptured(payload: OutboxPayloads['payments.captured']): Promise<void> {
    await this.unitOfWork.run(async (tx) => {
      const result = await this.orders.markPaid(tx, payload.orderId);
      await this.inventory.commitByOrder(tx, payload.orderId);
      if (!result?.changed) return;
      const contact = await this.orders.contact(payload.orderId);
      if (contact) {
        await this.outbox.append(tx, 'orders.paid', {
          orderId: payload.orderId,
          email: contact.email,
          number: contact.number,
          totalPaise: contact.totalPaise,
        });
      }
      await this.audit.record(
        {
          action: 'payments.captured',
          entityType: 'payment',
          entityId: payload.paymentId,
          metadata: { orderId: payload.orderId, amountPaise: payload.amountPaise },
        },
        tx,
      );
    });
  }

  private async onFailed(payload: OutboxPayloads['payments.failed']): Promise<void> {
    await this.unitOfWork.run(async (tx) => {
      await this.inventory.releaseByOrder(tx, payload.orderId);
      const result = await this.orders.markFailed(tx, payload.orderId);
      if (!result?.changed) return;
      await this.audit.record(
        {
          action: 'payments.failed',
          entityType: 'payment',
          entityId: payload.paymentId,
          metadata: { orderId: payload.orderId },
        },
        tx,
      );
    });
  }
}
