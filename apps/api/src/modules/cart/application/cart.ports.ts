import type { Tx } from '../../../platform/database/unit-of-work';

export type CartLineRecord = { productId: string; quantity: number };

export abstract class CartStore {
  abstract lines(userId: string): Promise<CartLineRecord[]>;
  abstract add(userId: string, productId: string, quantity: number): Promise<void>;
  abstract setQuantity(userId: string, productId: string, quantity: number): Promise<void>;
  abstract remove(userId: string, productId: string): Promise<void>;
  abstract clear(userId: string, tx?: Tx): Promise<void>;
  abstract merge(userId: string, items: CartLineRecord[]): Promise<void>;
  abstract wishlist(userId: string): Promise<string[]>;
  abstract saveWishlist(userId: string, productId: string): Promise<void>;
  abstract removeWishlist(userId: string, productId: string): Promise<void>;
}
