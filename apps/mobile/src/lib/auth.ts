import type { UserProfile } from '@bazaar/contracts';
import { api } from './api';
import { queryClient } from './query-client';
import { guestCartStore } from '../store/guest-cart';
import { sessionStore, type Session } from '../store/session';

type Issued = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

export async function signIn(email: string, password: string): Promise<Session> {
  const issued = await api<Issued>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const guest = guestCartStore.get().items;
  if (guest.length > 0) {
    await api('/api/v1/cart/merge', {
      method: 'POST',
      token: issued.accessToken,
      body: JSON.stringify({
        items: guest.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    });
    guestCartStore.actions.clear();
  }
  const session: Session = {
    accessToken: issued.accessToken,
    refreshToken: issued.refreshToken,
    user: issued.user,
  };
  await sessionStore.actions.setSession(session);
  await queryClient.invalidateQueries();
  return session;
}
