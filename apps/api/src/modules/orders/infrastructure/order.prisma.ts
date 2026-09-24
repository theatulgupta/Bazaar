import { Injectable } from '@nestjs/common';
import type { Order, OrderStatus } from '@bazaar/contracts';
import { PrismaService } from '../../../platform/database/prisma.service';
import type { Tx } from '../../../platform/database/unit-of-work';
import { notFound } from '../../../shared/domain-error';
import { assertTransition, formatOrderNumber, type OrderStatus as DomainStatus } from '../domain/order-status';
import { OrderStore, type OrderDraft, type StatusChange } from '../application/order.ports';

const include = { items: true } as const;

@Injectable()
export class PrismaOrders extends OrderStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(tx: Tx, draft: OrderDraft): Promise<Order> {
    const row = await tx.order.create({
      data: {
        userId: draft.userId,
        status: 'payment_pending',
        subtotalPaise: draft.subtotalPaise,
        shippingPaise: draft.shippingPaise,
        totalPaise: draft.totalPaise,
        contactEmail: draft.email,
        addressName: draft.address.name,
        addressMobile: draft.address.mobile,
        addressHouseNo: draft.address.houseNo,
        addressStreet: draft.address.street,
        addressLandmark: draft.address.landmark,
        addressPincode: draft.address.pincode,
        addressCity: draft.address.city,
        addressState: draft.address.state,
        items: {
          create: draft.items.map((item) => ({
            productId: item.productId,
            title: item.title,
            unitPricePaise: item.unitPricePaise,
            quantity: item.quantity,
          })),
        },
      },
      include,
    });
    return mapOrder(row);
  }

  async markPaid(tx: Tx, orderId: string): Promise<StatusChange | null> {
    return this.move(tx, orderId, 'paid');
  }

  async markFailed(tx: Tx, orderId: string): Promise<StatusChange | null> {
    return this.move(tx, orderId, 'payment_failed');
  }

  async transition(orderId: string, to: OrderStatus): Promise<Order> {
    const updated = await this.prisma.$transaction(async (tx) => this.move(tx, orderId, to));
    if (!updated) throw notFound('Order not found');
    return updated.order;
  }

  async apply(tx: Tx, orderId: string, to: OrderStatus): Promise<Order> {
    const updated = await this.move(tx, orderId, to);
    if (!updated) throw notFound('Order not found');
    return updated.order;
  }

  async getForUser(userId: string, orderId: string): Promise<Order | null> {
    const row = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include });
    return row ? mapOrder(row) : null;
  }

  async get(orderId: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id: orderId }, include });
    return row ? mapOrder(row) : null;
  }

  async contact(orderId: string): Promise<{ email: string; number: string; totalPaise: number } | null> {
    const row = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!row) return null;
    return { email: row.contactEmail, number: formatOrderNumber(row.number), totalPaise: row.totalPaise };
  }

  async listForUser(userId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapOrder);
  }

  async listAll(status?: OrderStatus): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(mapOrder);
  }

  private async move(tx: Tx, orderId: string, to: DomainStatus): Promise<StatusChange | null> {
    const locked = await tx.$queryRaw<Array<{ status: string }>>`
      SELECT status FROM ordering.orders WHERE id = ${orderId}::uuid FOR UPDATE
    `;
    const current = locked[0];
    if (!current) return null;
    if (current.status === to) {
      const row = await tx.order.findUnique({ where: { id: orderId }, include });
      return row ? { order: mapOrder(row), changed: false } : null;
    }
    assertTransition(current.status as DomainStatus, to);
    const row = await tx.order.update({ where: { id: orderId }, data: { status: to }, include });
    return { order: mapOrder(row), changed: true };
  }
}

function mapOrder(row: {
  id: string;
  number: number;
  status: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  createdAt: Date;
  addressName: string;
  addressMobile: string;
  addressHouseNo: string;
  addressStreet: string;
  addressLandmark: string;
  addressPincode: string;
  addressCity: string;
  addressState: string;
  contactEmail: string;
  items: Array<{ productId: string; title: string; unitPricePaise: number; quantity: number }>;
}): Order {
  return {
    id: row.id,
    number: formatOrderNumber(row.number),
    status: row.status as Order['status'],
    subtotalPaise: row.subtotalPaise,
    shippingPaise: row.shippingPaise,
    totalPaise: row.totalPaise,
    createdAt: row.createdAt.toISOString(),
    address: {
      name: row.addressName,
      mobile: row.addressMobile,
      houseNo: row.addressHouseNo,
      street: row.addressStreet,
      landmark: row.addressLandmark,
      pincode: row.addressPincode,
      city: row.addressCity,
      state: row.addressState,
    },
    items: row.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
    })),
  };
}
