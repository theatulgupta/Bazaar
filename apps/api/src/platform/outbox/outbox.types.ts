export type OutboxType =
  | 'identity.user_registered'
  | 'checkout.order_placed'
  | 'payments.captured'
  | 'payments.failed'
  | 'orders.paid';

export type OutboxPayloads = {
  'identity.user_registered': { userId: string; email: string; name: string; token: string };
  'checkout.order_placed': { orderId: string; userId: string };
  'payments.captured': { orderId: string; paymentId: string; amountPaise: number };
  'payments.failed': { orderId: string; paymentId: string };
  'orders.paid': { orderId: string; email: string; number: string; totalPaise: number };
};

export type OutboxMessage<T extends OutboxType = OutboxType> = {
  id: string;
  type: T;
  payload: OutboxPayloads[T];
  correlationId: string;
  attempts: number;
};
