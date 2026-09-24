import { describe, expect, it } from 'vitest';
import { shippingPaise } from '../../src/modules/checkout/domain/shipping';
import { assertCanSetOnHand, availableToSell } from '../../src/modules/inventory/domain/stock';
import { assertTransition, customerCanCancel } from '../../src/modules/orders/domain/order-status';
import { signWebhook, verifyWebhookSignature } from '../../src/modules/payments/domain/webhook-signature';
import { permissionsFor } from '../../src/platform/auth/permissions';
import { DomainError } from '../../src/shared/domain-error';

describe('commerce domain', () => {
  it('charges shipping below ₹499 and waives it at the threshold', () => {
    expect(shippingPaise(49_899)).toBe(4_000);
    expect(shippingPaise(49_900)).toBe(0);
  });

  it('rejects illegal order transitions and allows cancel before shipment', () => {
    expect(() => assertTransition('shipped', 'cancelled')).toThrow(DomainError);
    expect(() => assertTransition('paid', 'confirmed')).not.toThrow();
    expect(customerCanCancel('confirmed')).toBe(true);
    expect(customerCanCancel('shipped')).toBe(false);
  });

  it('computes available stock and refuses on-hand below reserved', () => {
    expect(availableToSell(10, 4)).toBe(6);
    expect(() => assertCanSetOnHand(3, 4)).toThrow(DomainError);
  });

  it('verifies Razorpay webhook signatures and rejects tampering', () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = signWebhook(body, 'test-webhook-secret');
    expect(verifyWebhookSignature(body, signature, 'test-webhook-secret')).toBe(true);
    expect(verifyWebhookSignature(body, signature, 'other-secret')).toBe(false);
    expect(verifyWebhookSignature(Buffer.from('{}'), signature, 'test-webhook-secret')).toBe(false);
  });

  it('grants fulfillment permissions only to admins', () => {
    expect(permissionsFor('CUSTOMER')).toEqual(['orders:read']);
    expect(permissionsFor('ADMIN')).toContain('orders:fulfill');
    expect(permissionsFor('ADMIN')).toContain('catalog:write');
  });
});
