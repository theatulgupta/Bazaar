import type { UserProfile } from '@bazaar/contracts';
import { Store, useStore } from '@tanstack/react-store';
import * as SecureStore from 'expo-secure-store';

const KEY = 'bazaar.session';

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

type SessionState = {
  session: Session | null;
  ready: boolean;
};

export const sessionStore = new Store(
  { session: null, ready: false } as SessionState,
  ({ setState }) => ({
    async hydrate() {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        setState(() => ({ session: raw ? (JSON.parse(raw) as Session) : null, ready: true }));
      } catch {
        setState(() => ({ session: null, ready: true }));
      }
    },
    async setSession(session: Session) {
      await SecureStore.setItemAsync(KEY, JSON.stringify(session));
      setState(() => ({ session, ready: true }));
    },
    async clear() {
      await SecureStore.deleteItemAsync(KEY);
      setState(() => ({ session: null, ready: true }));
    },
  }),
);

export function useSessionValue() {
  return useStore(sessionStore, (state) => state.session);
}

export function useSessionReady() {
  return useStore(sessionStore, (state) => state.ready);
}
