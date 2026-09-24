import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signWebhook } from '../../src/modules/payments/domain/webhook-signature';

type Api = ReturnType<typeof request>;

const address = {
  name: 'Pranjal Gupta',
  mobile: '9876543210',
  houseNo: '12',
  street: 'MG Road',
  landmark: 'Near the park',
  pincode: '560001',
  city: 'Bengaluru',
  state: 'Karnataka',
};

describe('commerce API', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;
  let dispatcher: { drainOnce: () => Promise<number> };
  let fulfillment: { expireReservations: (now?: Date) => Promise<number> };

  beforeAll(async () => {
    const [{ createApp }, { OutboxDispatcher }, { FulfillmentService }, { PrismaClient: Client }] = await Promise.all([
      import('../../src/create-app'),
      import('../../src/platform/outbox/outbox.dispatcher'),
      import('../../src/composition/fulfillment.service'),
      import('@prisma/client'),
    ]);
    prisma = new Client();
    app = await createApp();
    await app.init();
    http = request(app.getHttpServer());
    dispatcher = app.get(OutboxDispatcher);
    fulfillment = app.get(FulfillmentService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE
        payments.webhook_events,
        payments.payments,
        ordering.order_items,
        ordering.orders,
        cart.wishlist_items,
        cart.cart_items,
        cart.carts,
        inventory.reservations,
        inventory.stock_items,
        catalog.products,
        catalog.categories,
        identity.addresses,
        identity.sessions,
        identity.users,
        platform.outbox,
        platform.idempotency_keys,
        platform.audit_logs
      RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('prices orders on the server, isolates accounts, and captures payment once', async () => {
    const correlation = 'corr-register-1';
    const registered = await http
      .post('/api/v1/auth/register')
      .set('x-correlation-id', correlation)
      .send({ name: 'Asha Rao', email: 'asha@example.com', password: 'password123' });
    expect(registered.status, JSON.stringify(registered.body)).toBe(201);
    expect(registered.headers['x-correlation-id']).toBe(correlation);

    const outbox = await prisma.outboxMessage.findFirst({ where: { type: 'identity.user_registered' } });
    expect(outbox?.correlationId).toBe(correlation);
    await dispatcher.drainOnce();
    const token = (outbox?.payload as { token: string }).token;
    const verified = await http.get('/api/v1/auth/verify').query({ token });
    expect(verified.status).toBe(200);

    const login = await http.post('/api/v1/auth/login').send({ email: 'asha@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    const asha = login.body.data.accessToken as string;

    const other = await registerAndVerify(http, dispatcher, 'other@example.com');
    await registerAndVerify(http, dispatcher, 'admin@example.com');
    await prisma.user.update({ where: { email: 'admin@example.com' }, data: { role: 'ADMIN' } });
    const adminLogin = await http.post('/api/v1/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    const adminToken = adminLogin.body.data.accessToken as string;

    const category = await prisma.category.create({ data: { name: 'Electronics', slug: 'electronics' } });
    const created = await http
      .post('/admin/v1/products')
      .set('authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Desk lamp',
        description: 'A warm desk lamp for late work.',
        categorySlug: category.slug,
        pricePaise: 50_000,
        mrpPaise: 70_000,
        imageUrl: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
        stock: 5,
        active: true,
      });
    expect(created.status).toBe(201);
    const productId = created.body.data.id as string;

    await http.post('/api/v1/cart/items').set('authorization', `Bearer ${asha}`).send({ productId, quantity: 2 }).expect(201);

    await http
      .patch(`/admin/v1/products/${productId}`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ pricePaise: 80_000, mrpPaise: 90_000 })
      .expect(200);

    const savedAddress = await http.post('/api/v1/addresses').set('authorization', `Bearer ${asha}`).send(address).expect(201);
    const addressId = savedAddress.body.data.id as string;

    const quote = await http.get('/api/v1/checkout/quote').set('authorization', `Bearer ${asha}`).expect(200);
    expect(quote.body.data.subtotalPaise).toBe(160_000);
    expect(quote.body.data.shippingPaise).toBe(0);
    expect(quote.body.data.totalPaise).toBe(160_000);

    const placed = await http
      .post('/api/v1/checkout/orders')
      .set('authorization', `Bearer ${asha}`)
      .set('idempotency-key', 'checkout-1')
      .send({ addressId, totalPrice: 1 });
    expect(placed.status).toBe(201);
    expect(placed.body.data.amountPaise).toBe(160_000);
    expect(placed.body.data.keyId).toBe('rzp_test_bazaar');

    const replay = await http
      .post('/api/v1/checkout/orders')
      .set('authorization', `Bearer ${asha}`)
      .set('idempotency-key', 'checkout-1')
      .send({ addressId, totalPrice: 1 });
    expect(replay.body.data.orderId).toBe(placed.body.data.orderId);

    const hidden = await http.get(`/api/v1/orders/${placed.body.data.orderId}`).set('authorization', `Bearer ${other}`);
    expect(hidden.status).toBe(404);

    const stolen = await http
      .post('/api/v1/checkout/orders')
      .set('authorization', `Bearer ${other}`)
      .set('idempotency-key', 'checkout-other')
      .send({ addressId });
    expect(stolen.status).toBe(404);

    const raw = Buffer.from(
      JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_test_1', order_id: placed.body.data.razorpayOrderId, amount: 160000 } } },
      }),
    );
    const signature = signWebhook(raw, 'test-webhook-secret');
    const hook = await http
      .post('/webhooks/razorpay')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_1')
      .send(raw.toString('utf8'));
    expect(hook.status, JSON.stringify(hook.body)).toBe(200);
    const again = await http
      .post('/webhooks/razorpay')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_1')
      .send(raw.toString('utf8'));
    expect(again.status, JSON.stringify(again.body)).toBe(200);

    await dispatcher.drainOnce();
    await dispatcher.drainOnce();

    const order = await http.get(`/api/v1/orders/${placed.body.data.orderId}`).set('authorization', `Bearer ${asha}`);
    expect(order.body.data.status).toBe('paid');
    const stock = await prisma.stockItem.findUniqueOrThrow({ where: { productId } });
    expect(stock.onHand).toBe(3);
    expect(stock.reserved).toBe(0);

    const audit = await http.get('/admin/v1/audit').set('authorization', `Bearer ${adminToken}`);
    expect(audit.status).toBe(200);
    expect(audit.body.data.some((entry: { action: string }) => entry.action === 'payments.captured')).toBe(true);
    const customerAudit = await http.get('/admin/v1/audit').set('authorization', `Bearer ${asha}`);
    expect(customerAudit.status).toBe(403);
  });

  it('releases an abandoned reservation', async () => {
    const token = await registerAndVerify(http, dispatcher, 'buyer@example.com');
    await prisma.user.update({ where: { email: 'buyer@example.com' }, data: { role: 'ADMIN' } });
    const adminLogin = await http.post('/api/v1/auth/login').send({ email: 'buyer@example.com', password: 'password123' });
    const adminToken = adminLogin.body.data.accessToken as string;
    await prisma.category.create({ data: { name: 'Home', slug: 'home' } });
    const created = await http
      .post('/admin/v1/products')
      .set('authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cotton throw',
        description: 'A washed cotton throw for the sofa.',
        categorySlug: 'home',
        pricePaise: 20_000,
        mrpPaise: 25_000,
        imageUrl: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg',
        stock: 4,
        active: true,
      });
    const productId = created.body.data.id as string;
    await http.post('/api/v1/cart/items').set('authorization', `Bearer ${token}`).send({ productId, quantity: 1 });
    const saved = await http.post('/api/v1/addresses').set('authorization', `Bearer ${token}`).send(address);
    const placed = await http
      .post('/api/v1/checkout/orders')
      .set('authorization', `Bearer ${token}`)
      .set('idempotency-key', 'expire-1')
      .send({ addressId: saved.body.data.id });
    expect(placed.status).toBe(201);
    await prisma.reservation.updateMany({ data: { expiresAt: new Date(Date.now() - 60_000) } });
    await fulfillment.expireReservations(new Date());
    const order = await http.get(`/api/v1/orders/${placed.body.data.orderId}`).set('authorization', `Bearer ${token}`);
    expect(order.body.data.status).toBe('payment_failed');
    const stock = await prisma.stockItem.findUniqueOrThrow({ where: { productId } });
    expect(stock.reserved).toBe(0);
    expect(stock.onHand).toBe(4);
  });
});

async function registerAndVerify(
  http: Api,
  dispatcher: { drainOnce: () => Promise<number> },
  email: string,
): Promise<string> {
  await http.post('/api/v1/auth/register').send({ name: 'Test User', email, password: 'password123' });
  const message = await prismaMessage(email);
  await dispatcher.drainOnce();
  await http.get('/api/v1/auth/verify').query({ token: message });
  const login = await http.post('/api/v1/auth/login').send({ email, password: 'password123' });
  return login.body.data.accessToken as string;
}

async function prismaMessage(email: string): Promise<string> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const row = await prisma.outboxMessage.findFirst({
    where: { type: 'identity.user_registered' },
    orderBy: { occurredAt: 'desc' },
  });
  await prisma.$disconnect();
  const payload = row?.payload as { email: string; token: string };
  if (!payload || payload.email !== email) throw new Error(`missing verification token for ${email}`);
  return payload.token;
}
