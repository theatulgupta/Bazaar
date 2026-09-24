import { invariant } from '../../../shared/domain-error';

export function availableToSell(onHand: number, reserved: number): number {
  return onHand - reserved;
}

export function assertCanReserve(onHand: number, reserved: number, quantity: number): void {
  if (quantity > availableToSell(onHand, reserved)) {
    throw invariant('Not enough stock to reserve');
  }
}

export function assertCanSetOnHand(onHand: number, reserved: number): void {
  if (onHand < reserved) {
    throw invariant('On-hand stock cannot drop below the reserved quantity');
  }
}
