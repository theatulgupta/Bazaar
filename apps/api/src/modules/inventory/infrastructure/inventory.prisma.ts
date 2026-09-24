import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service';
import type { Tx } from '../../../platform/database/unit-of-work';
import { invariant, notFound } from '../../../shared/domain-error';
import { assertCanSetOnHand, availableToSell } from '../domain/stock';
import {
  InventoryReader,
  InventoryWriter,
  type StockLine,
  type StockView,
} from '../application/inventory.ports';

@Injectable()
export class PrismaInventory extends InventoryReader implements InventoryWriter {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async availableFor(productIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (productIds.length === 0) return map;
    const rows = await this.prisma.stockItem.findMany({ where: { productId: { in: productIds } } });
    for (const row of rows) map.set(row.productId, availableToSell(row.onHand, row.reserved));
    return map;
  }

  async get(productId: string): Promise<StockView | null> {
    const row = await this.prisma.stockItem.findUnique({ where: { productId } });
    if (!row) return null;
    return view(row);
  }

  async ensure(productId: string, onHand: number): Promise<void> {
    await this.prisma.stockItem.upsert({
      where: { productId },
      create: { productId, onHand, reserved: 0 },
      update: {},
    });
  }

  async setOnHand(productId: string, onHand: number): Promise<StockView> {
    const current = await this.prisma.stockItem.findUnique({ where: { productId } });
    if (!current) throw notFound('Stock record not found');
    assertCanSetOnHand(onHand, current.reserved);
    const row = await this.prisma.stockItem.update({ where: { productId }, data: { onHand } });
    return view(row);
  }

  async reserve(tx: Tx, orderId: string, lines: StockLine[], expiresAt: Date): Promise<void> {
    for (const line of lines) {
      const updated = await tx.$executeRaw`
        UPDATE inventory.stock_items
        SET reserved = reserved + ${line.quantity}
        WHERE product_id = ${line.productId}::uuid
          AND on_hand - reserved >= ${line.quantity}
      `;
      if (updated !== 1) throw invariant('Not enough stock to reserve');
      await tx.reservation.create({
        data: {
          productId: line.productId,
          orderId,
          quantity: line.quantity,
          status: 'active',
          expiresAt,
        },
      });
    }
  }

  async commitByOrder(tx: Tx, orderId: string): Promise<'committed' | 'already' | 'missing'> {
    const rows = await tx.$queryRaw<Array<{ id: string; product_id: string; quantity: number; status: string }>>`
      SELECT id, product_id, quantity, status
      FROM inventory.reservations
      WHERE order_id = ${orderId}::uuid
      FOR UPDATE
    `;
    if (rows.length === 0) return 'missing';
    if (rows.every((row) => row.status === 'committed')) return 'already';
    for (const row of rows) {
      if (row.status !== 'active') continue;
      const stock = await tx.$executeRaw`
        UPDATE inventory.stock_items
        SET on_hand = on_hand - ${row.quantity},
            reserved = reserved - ${row.quantity}
        WHERE product_id = ${row.product_id}::uuid
          AND reserved >= ${row.quantity}
          AND on_hand >= ${row.quantity}
      `;
      if (stock !== 1) throw invariant('Stock commit failed');
      await tx.reservation.update({ where: { id: row.id }, data: { status: 'committed' } });
    }
    return 'committed';
  }

  async releaseByOrder(tx: Tx, orderId: string): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ id: string; product_id: string; quantity: number; status: string }>>`
      SELECT id, product_id, quantity, status
      FROM inventory.reservations
      WHERE order_id = ${orderId}::uuid
      FOR UPDATE
    `;
    for (const row of rows) {
      if (row.status !== 'active') continue;
      await tx.$executeRaw`
        UPDATE inventory.stock_items
        SET reserved = reserved - ${row.quantity}
        WHERE product_id = ${row.product_id}::uuid
          AND reserved >= ${row.quantity}
      `;
      await tx.reservation.update({ where: { id: row.id }, data: { status: 'released' } });
    }
  }

  async restoreForCancel(tx: Tx, orderId: string): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ id: string; product_id: string; quantity: number; status: string }>>`
      SELECT id, product_id, quantity, status
      FROM inventory.reservations
      WHERE order_id = ${orderId}::uuid
      FOR UPDATE
    `;
    for (const row of rows) {
      if (row.status === 'active') {
        await tx.$executeRaw`
          UPDATE inventory.stock_items
          SET reserved = reserved - ${row.quantity}
          WHERE product_id = ${row.product_id}::uuid AND reserved >= ${row.quantity}
        `;
      } else if (row.status === 'committed') {
        await tx.$executeRaw`
          UPDATE inventory.stock_items
          SET on_hand = on_hand + ${row.quantity}
          WHERE product_id = ${row.product_id}::uuid
        `;
      } else {
        continue;
      }
      await tx.reservation.update({ where: { id: row.id }, data: { status: 'released' } });
    }
  }

  async expireDue(now: Date): Promise<string[]> {
    const due = await this.prisma.reservation.findMany({
      where: { status: 'active', expiresAt: { lt: now } },
      select: { orderId: true },
      distinct: ['orderId'],
    });
    const released: string[] = [];
    for (const row of due) {
      await this.prisma.$transaction(async (tx) => {
        await this.releaseByOrder(tx, row.orderId);
      });
      released.push(row.orderId);
    }
    return released;
  }
}

function view(row: { productId: string; onHand: number; reserved: number }): StockView {
  return {
    productId: row.productId,
    onHand: row.onHand,
    reserved: row.reserved,
    available: availableToSell(row.onHand, row.reserved),
  };
}
