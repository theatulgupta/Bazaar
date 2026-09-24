import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service';
import type { Tx } from '../../../platform/database/unit-of-work';
import { CartStore, type CartLineRecord } from '../application/cart.ports';

const MAX_QTY = 10;

@Injectable()
export class PrismaCart extends CartStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async lines(userId: string): Promise<CartLineRecord[]> {
    const cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: true } });
    return cart?.items.map((item) => ({ productId: item.productId, quantity: item.quantity })) ?? [];
  }

  async add(userId: string, productId: string, quantity: number): Promise<void> {
    const cart = await this.ensureCart(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const next = Math.min(MAX_QTY, (existing?.quantity ?? 0) + quantity);
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: next },
      update: { quantity: next },
    });
  }

  async setQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    const cart = await this.ensureCart(userId);
    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      return;
    }
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: Math.min(MAX_QTY, quantity) },
      update: { quantity: Math.min(MAX_QTY, quantity) },
    });
  }

  async remove(userId: string, productId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  }

  async clear(userId: string, tx?: Tx): Promise<void> {
    const db = tx ?? this.prisma;
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async merge(userId: string, items: CartLineRecord[]): Promise<void> {
    for (const item of items) {
      await this.add(userId, item.productId, item.quantity);
    }
  }

  async wishlist(userId: string): Promise<string[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.productId);
  }

  async saveWishlist(userId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async removeWishlist(userId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  }

  private async ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }
}
