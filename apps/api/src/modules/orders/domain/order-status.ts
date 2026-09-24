import { invariant } from '../../../shared/domain-error';

export const ORDER_STATUSES = [
  'payment_pending',
  'paid',
  'confirmed',
  'shipped',
  'delivered',
  'payment_failed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  payment_pending: ['paid', 'payment_failed', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  payment_failed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw invariant(`Cannot move an order from ${from} to ${to}`);
  }
}

export function customerCanCancel(status: OrderStatus): boolean {
  return status === 'payment_pending' || status === 'paid' || status === 'confirmed';
}

export function formatOrderNumber(number: number): string {
  return `BZ${number}`;
}
