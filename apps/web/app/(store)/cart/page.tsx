'use client';

import Link from 'next/link';
import { useCartMutations, useCartQuery, useMe } from '@/lib/queries';
import { guestCartStore, useGuestItems } from '@/lib/guest-cart';
import { rupees } from '@/lib/money';

export default function CartPage() {
  const me = useMe();
  const guestItems = useGuestItems();
  const cart = useCartQuery(Boolean(me.data));
  const { setQuantity, remove } = useCartMutations();
  const lines = me.data ? (cart.data?.items ?? []) : guestItems;
  const total = lines.reduce((sum, line) => sum + line.unitPricePaise * line.quantity, 0);

  function change(productId: string, quantity: number) {
    if (!me.data) {
      guestCartStore.actions.setQuantity(productId, quantity);
      return;
    }
    if (quantity <= 0) remove.mutate(productId);
    else setQuantity.mutate({ productId, quantity });
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Bag</h1>
      {lines.length === 0 ? <p className="mt-4 text-muted">Your bag is empty.</p> : null}
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <div key={line.productId} className="flex items-center gap-4 rounded-lg bg-white p-3">
            <img src={line.imageUrl} alt="" className="h-16 w-16 object-contain" />
            <div className="flex-1">
              <p>{line.title}</p>
              <p className="font-semibold">{rupees(line.unitPricePaise)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => change(line.productId, line.quantity - 1)} className="h-8 w-8 rounded bg-canvas">
                -
              </button>
              <span>{line.quantity}</span>
              <button onClick={() => change(line.productId, line.quantity + 1)} className="h-8 w-8 rounded bg-canvas">
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-white p-4">
        <p className="text-lg font-semibold">Subtotal {rupees(total)}</p>
        <Link
          href={me.data ? '/checkout' : '/login?next=/checkout'}
          className={`mt-3 inline-block rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary ${lines.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
