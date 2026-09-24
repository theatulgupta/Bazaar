'use client';

import type { CheckoutResult } from '@bazaar/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ApiError, browserApi } from '@/lib/api';
import { rupees } from '@/lib/money';
import { useQueryClient } from '@tanstack/react-query';
import { useAddressesQuery, useMe, useQuoteQuery } from '@/lib/queries';

type RazorpayCheckout = new (options: {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => void;
  modal?: { ondismiss?: () => void };
}) => { open: () => void };

export default function CheckoutPage() {
  const router = useRouter();
  const me = useMe();
  const queryClient = useQueryClient();
  const addresses = useAddressesQuery(Boolean(me.data));
  const quote = useQuoteQuery(Boolean(me.data));
  const [addressId, setAddressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const key = useRef(`web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const saved = addresses.data ?? [];
  const selected = addressId ?? saved.find((item) => item.isDefault)?.id ?? saved[0]?.id ?? null;

  useEffect(() => {
    if (me.isError) router.replace('/login?next=/checkout');
  }, [me.isError, router]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  async function pay() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await browserApi<CheckoutResult>('/api/v1/checkout/orders', {
        method: 'POST',
        headers: { 'idempotency-key': key.current },
        body: JSON.stringify({ addressId: selected }),
      });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (result.razorpayOrderId.startsWith('order_fake_')) {
        router.push(`/orders/${result.orderId}?pending=1`);
        return;
      }
      const Razorpay = (window as unknown as { Razorpay?: RazorpayCheckout }).Razorpay;
      if (!Razorpay) throw new Error('Razorpay Checkout failed to load');
      const checkout = new Razorpay({
        key: result.keyId,
        amount: result.amountPaise,
        currency: 'INR',
        name: 'Bazaar',
        description: result.orderNumber,
        order_id: result.razorpayOrderId,
        handler: () => router.push(`/orders/${result.orderId}`),
        modal: { ondismiss: () => router.push(`/orders/${result.orderId}`) },
      });
      checkout.open();
    } catch (err) {
      key.current = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <div className="mt-4 space-y-2">
          {saved.map((address) => (
            <label key={address.id} className={`block rounded-lg border bg-white p-3 ${selected === address.id ? 'border-action' : 'border-line'}`}>
              <input type="radio" name="address" checked={selected === address.id} onChange={() => setAddressId(address.id)} className="mr-2" />
              <span className="font-semibold">{address.name}</span>
              <span className="mt-1 block text-sm text-muted">
                {address.houseNo}, {address.street}, {address.city} {address.pincode}
              </span>
            </label>
          ))}
          {saved.length === 0 ? <p className="text-muted">Add a delivery address before paying.</p> : null}
          <Link href="/addresses" className="inline-block text-info">
            Manage addresses
          </Link>
        </div>
      </section>
      <aside className="h-fit rounded-lg bg-white p-4">
        {quote.data ? (
          <>
            <p>Items {rupees(quote.data.subtotalPaise)}</p>
            <p>Delivery {quote.data.shippingPaise === 0 ? 'FREE' : rupees(quote.data.shippingPaise)}</p>
            <p className="mt-2 text-lg font-semibold">Total {rupees(quote.data.totalPaise)}</p>
          </>
        ) : (
          <p>Loading quote...</p>
        )}
        {error ? <p className="mt-3 text-danger">{error}</p> : null}
        <button
          disabled={busy || !selected || !quote.data}
          onClick={() => void pay()}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary disabled:opacity-50"
        >
          {busy ? 'Placing order...' : 'Pay with Razorpay'}
        </button>
      </aside>
    </div>
  );
}
