'use client';

import type { UserProfile } from '@bazaar/contracts';
import { browserApi } from '@/lib/api';
import { guestCartStore } from '@/lib/guest-cart';
import { getQueryClient } from '@/lib/query-client';

type Issued = { accessToken: string; refreshToken: string; user: UserProfile };

export async function signIn(email: string, password: string) {
  await browserApi<Issued>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const guest = guestCartStore.get().items;
  if (guest.length > 0) {
    await browserApi('/api/v1/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items: guest.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
    });
    guestCartStore.actions.clear();
  }
  await getQueryClient().invalidateQueries();
}
