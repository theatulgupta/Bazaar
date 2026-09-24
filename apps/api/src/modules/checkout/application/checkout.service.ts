import { Injectable } from '@nestjs/common';
import type { CheckoutResult, Quote } from '@bazaar/contracts';
import { AuditService } from '../../../platform/audit/audit.service';
import type { AuthUser } from '../../../platform/auth/current-user';
import { loadEnv } from '../../../platform/config/env';
import { IdempotencyService } from '../../../platform/idempotency/idempotency.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { UnitOfWork } from '../../../platform/database/unit-of-work';
import { conflict, forbidden, invalid, notFound } from '../../../shared/domain-error';
import { CartStore } from '../../cart/application/cart.ports';
import { CatalogReader } from '../../catalog/application/catalog.ports';
import { IdentityWriter } from '../../identity/application/identity.ports';
import { InventoryReader, InventoryWriter } from '../../inventory/application/inventory.ports';
import { OrderStore } from '../../orders/application/order.ports';
import { PaymentGateway, PaymentStore } from '../../payments/application/payment.ports';
import { shippingPaise } from '../domain/shipping';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly carts: CartStore,
    private readonly catalog: CatalogReader,
    private readonly inventory: InventoryReader,
    private readonly inventoryWriter: InventoryWriter,
    private readonly orders: OrderStore,
    private readonly payments: PaymentStore,
    private readonly gateway: PaymentGateway,
    private readonly identities: IdentityWriter,
    private readonly unitOfWork: UnitOfWork,
    private readonly outbox: OutboxService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
  ) {}

  async quote(userId: string): Promise<Quote> {
    const lines = await this.carts.lines(userId);
    return this.price(lines);
  }

  async place(user: AuthUser, addressId: string, idempotencyKey: string | undefined): Promise<CheckoutResult> {
    if (!user.emailVerified) throw forbidden('Verify your email before checkout');
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 80) {
      throw invalid('Idempotency-Key is required');
    }
    const requestHash = this.idempotency.hash({ addressId });
    const existing = await this.idempotency.find(user.id, idempotencyKey);
    if (existing) {
      this.idempotency.assertSameRequest(existing, requestHash);
      if (existing.status === 'completed' && existing.response) return existing.response as CheckoutResult;
      if (existing.status === 'failed') throw invalid('Checkout failed. Start again with a new Idempotency-Key');
      throw conflict('This checkout is already in progress');
    }

    const address = await this.identities.findAddress(user.id, addressId);
    if (!address) throw notFound('Address not found');
    const lines = await this.carts.lines(user.id);
    if (lines.length === 0) throw invalid('Your cart is empty');
    const quote = await this.price(lines);
    if (quote.lines.some((line) => !line.purchasable)) throw invalid('Some items are no longer available in the requested quantity');

    const env = loadEnv();
    const expiresAt = new Date(Date.now() + env.RESERVATION_TTL_MINUTES * 60 * 1000);

    const created = await this.unitOfWork.run(async (tx) => {
      const begun = await this.idempotency.begin(tx, { userId: user.id, key: idempotencyKey, requestHash });
      if (begun === 'exists') return null;
      const order = await this.orders.create(tx, {
        userId: user.id,
        email: user.email,
        subtotalPaise: quote.subtotalPaise,
        shippingPaise: quote.shippingPaise,
        totalPaise: quote.totalPaise,
        address,
        items: quote.lines.map((line) => ({
          productId: line.productId,
          title: line.title,
          unitPricePaise: line.unitPricePaise,
          quantity: line.quantity,
        })),
      });
      await this.inventoryWriter.reserve(
        tx,
        order.id,
        quote.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        expiresAt,
      );
      const payment = await this.payments.createPending(tx, { orderId: order.id, amountPaise: order.totalPaise });
      await this.outbox.append(tx, 'checkout.order_placed', { orderId: order.id, userId: user.id });
      return { order, paymentId: payment.id };
    });

    if (!created) throw conflict('This checkout is already in progress');

    try {
      const provider = await this.gateway.createOrder({
        amountPaise: created.order.totalPaise,
        receipt: created.order.id,
      });
      await this.payments.attachProviderOrder(created.paymentId, provider.id);
      const result: CheckoutResult = {
        orderId: created.order.id,
        orderNumber: created.order.number,
        razorpayOrderId: provider.id,
        amountPaise: created.order.totalPaise,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
      };
      await this.idempotency.complete(user.id, idempotencyKey, result);
      await this.carts.clear(user.id);
      await this.audit.record({
        actorId: user.id,
        action: 'checkout.placed',
        entityType: 'order',
        entityId: created.order.id,
        metadata: { totalPaise: created.order.totalPaise },
      });
      return result;
    } catch (error) {
      await this.unitOfWork.run(async (tx) => {
        await this.inventoryWriter.releaseByOrder(tx, created.order.id);
        await this.orders.markFailed(tx, created.order.id);
        await this.payments.markFailed(tx, created.order.id);
      });
      await this.idempotency.fail(user.id, idempotencyKey, { error: 'payment_provider_failed' });
      throw error;
    }
  }

  private async price(lines: Array<{ productId: string; quantity: number }>): Promise<Quote> {
    if (lines.length === 0) {
      return { lines: [], subtotalPaise: 0, shippingPaise: 0, totalPaise: 0 };
    }
    const products = await this.catalog.findByIds(lines.map((line) => line.productId));
    const stock = await this.inventory.availableFor(lines.map((line) => line.productId));
    let subtotalPaise = 0;
    const priced = lines.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product || !product.active) throw notFound('A cart item is no longer available');
      const available = stock.get(product.id) ?? 0;
      const lineTotalPaise = product.pricePaise * line.quantity;
      subtotalPaise += lineTotalPaise;
      return {
        productId: product.id,
        quantity: line.quantity,
        title: product.title,
        slug: product.slug,
        imageUrl: product.imageUrl,
        unitPricePaise: product.pricePaise,
        available,
        lineTotalPaise,
        purchasable: available >= line.quantity,
      };
    });
    const shipping = shippingPaise(subtotalPaise);
    return { lines: priced, subtotalPaise, shippingPaise: shipping, totalPaise: subtotalPaise + shipping };
  }
}
