import type { CheckoutResult } from '@bazaar/contracts';

export async function openRazorpayCheckout(result: CheckoutResult, prefill: { email: string; name: string; contact?: string }) {
  const RazorpayCheckout = (await import('react-native-razorpay')).default;
  return RazorpayCheckout.open({
    key: result.keyId,
    amount: result.amountPaise,
    currency: 'INR',
    name: 'Bazaar',
    description: result.orderNumber,
    order_id: result.razorpayOrderId,
    prefill,
    theme: { color: '#0F1111' },
  });
}
