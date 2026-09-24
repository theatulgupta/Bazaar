import type { Tx } from '../../../platform/database/unit-of-work';

export type ProviderOrder = { id: string };

export abstract class PaymentGateway {
  abstract createOrder(input: { amountPaise: number; receipt: string }): Promise<ProviderOrder>;
}

export type PaymentView = {
  orderId: string;
  status: 'created' | 'captured' | 'failed';
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
};

export type CapturedPayment = {
  orderId: string;
  paymentId: string;
  amountPaise: number;
};

export type CaptureResult =
  | { kind: 'missing' }
  | { kind: 'duplicate' }
  | { kind: 'captured'; payment: CapturedPayment };

export abstract class PaymentStore {
  abstract createPending(tx: Tx, input: { orderId: string; amountPaise: number }): Promise<{ id: string }>;
  abstract attachProviderOrder(paymentId: string, razorpayOrderId: string): Promise<void>;
  abstract markFailed(tx: Tx, orderId: string): Promise<void>;
  abstract markCaptured(tx: Tx, razorpayOrderId: string, razorpayPaymentId: string): Promise<CaptureResult>;
  abstract markFailedByProviderOrder(tx: Tx, razorpayOrderId: string): Promise<CapturedPayment | null>;
  abstract findByOrder(orderId: string): Promise<PaymentView | null>;
  abstract recordWebhook(tx: Tx, eventId: string, eventType: string, payload: unknown): Promise<boolean>;
}
