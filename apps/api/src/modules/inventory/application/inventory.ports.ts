import type { Tx } from '../../../platform/database/unit-of-work';

export type StockLine = { productId: string; quantity: number };

export type StockView = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
};

export abstract class InventoryReader {
  abstract availableFor(productIds: string[]): Promise<Map<string, number>>;
  abstract get(productId: string): Promise<StockView | null>;
}

export abstract class InventoryWriter {
  abstract ensure(productId: string, onHand: number): Promise<void>;
  abstract setOnHand(productId: string, onHand: number): Promise<StockView>;
  abstract reserve(tx: Tx, orderId: string, lines: StockLine[], expiresAt: Date): Promise<void>;
  abstract commitByOrder(tx: Tx, orderId: string): Promise<'committed' | 'already' | 'missing'>;
  abstract releaseByOrder(tx: Tx, orderId: string): Promise<void>;
  abstract restoreForCancel(tx: Tx, orderId: string): Promise<void>;
  abstract expireDue(now: Date): Promise<string[]>;
}
