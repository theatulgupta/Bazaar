'use client';

import type { Product } from '@bazaar/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, browserApi } from '@/lib/api';
import { guestCartStore } from '@/lib/guest-cart';
import { useMe } from '@/lib/queries';

export function AddToCart({ product }: { product: Product }) {
  const me = useMe();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: () =>
      browserApi('/api/v1/cart/items', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: 1 }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
  const wish = useMutation({
    mutationFn: () => browserApi('/api/v1/wishlist', { method: 'POST', body: JSON.stringify({ productId: product.id }) }),
  });
  const inStock = (product.available ?? 0) > 0;

  return (
    <div className="mt-6 flex max-w-sm flex-col gap-3">
      <p className={inStock ? 'text-success' : 'text-danger'}>{inStock ? `${product.available} in stock` : 'Out of stock'}</p>
      <button
        disabled={!inStock || add.isPending}
        onClick={() => {
          setMessage(null);
          if (!me.data) {
            guestCartStore.actions.add({
              productId: product.id,
              title: product.title,
              slug: product.slug,
              imageUrl: product.imageUrl,
              unitPricePaise: product.pricePaise,
            });
            setMessage('Saved in the cart on this browser. Sign in at checkout.');
            return;
          }
          add.mutate(undefined, {
            onSuccess: () => setMessage('Added to your cart.'),
            onError: (error) => setMessage(error instanceof ApiError ? error.message : 'Could not add this item'),
          });
        }}
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary disabled:opacity-50"
      >
        Add to bag
      </button>
      <button
        onClick={() => {
          if (!me.data) {
            setMessage('Sign in to keep a wishlist.');
            return;
          }
          wish.mutate(undefined, {
            onSuccess: () => setMessage('Saved to your wishlist.'),
            onError: (error) => setMessage(error instanceof Error ? error.message : 'Could not save this item'),
          });
        }}
        className="rounded-lg bg-sand px-4 py-3 font-semibold text-ink"
      >
        Save to wishlist
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
