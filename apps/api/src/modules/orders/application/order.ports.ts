import type { AddressInput, Order, OrderStatus } from '@bazaar/contracts';
import type { Tx } from '../../../platform/database/unit-of-work';

export type OrderDraft = {
  userId: string;
  email: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  address: AddressInput;
  items: Array<{ productId: string; title: string; unitPricePaise: number; quantity: number }>;
};

export type StatusChange = { order: Order; changed: boolean };

export abstract class OrderStore {
  abstract create(tx: Tx, draft: OrderDraft): Promise<Order>;
  abstract markPaid(tx: Tx, orderId: string): Promise<StatusChange | null>;
  abstract markFailed(tx: Tx, orderId: string): Promise<StatusChange | null>;
  abstract transition(orderId: string, to: OrderStatus): Promise<Order>;
  abstract apply(tx: Tx, orderId: string, to: OrderStatus): Promise<Order>;
  abstract get(orderId: string): Promise<Order | null>;
  abstract getForUser(userId: string, orderId: string): Promise<Order | null>;
  abstract contact(orderId: string): Promise<{ email: string; number: string; totalPaise: number } | null>;
  abstract listForUser(userId: string): Promise<Order[]>;
  abstract listAll(status?: OrderStatus): Promise<Order[]>;
}
