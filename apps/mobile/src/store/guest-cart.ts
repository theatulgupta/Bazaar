import AsyncStorage from '@react-native-async-storage/async-storage';
import { Store, useStore } from '@tanstack/react-store';

const KEY = 'bazaar.guest-cart';

export type GuestItem = {
  productId: string;
  quantity: number;
  title: string;
  slug: string;
  imageUrl: string;
  unitPricePaise: number;
};

type GuestState = { items: GuestItem[] };

export const guestCartStore = new Store({ items: [] } as GuestState, ({ setState, get }) => ({
  add(item: Omit<GuestItem, 'quantity'>, quantity = 1) {
    const items = get().items;
    const existing = items.find((line) => line.productId === item.productId);
    if (existing) {
      setState(() => ({
        items: items.map((line) =>
          line.productId === item.productId ? { ...line, quantity: Math.min(10, line.quantity + quantity) } : line,
        ),
      }));
      return;
    }
    setState(() => ({ items: [...items, { ...item, quantity }] }));
  },
  setQuantity(productId: string, quantity: number) {
    const items = get().items;
    setState(() => ({
      items:
        quantity <= 0
          ? items.filter((line) => line.productId !== productId)
          : items.map((line) => (line.productId === productId ? { ...line, quantity: Math.min(10, quantity) } : line)),
    }));
  },
  clear() {
    setState(() => ({ items: [] }));
  },
}));

let persistenceStarted = false;

export async function startGuestCartPersistence() {
  if (persistenceStarted) return;
  persistenceStarted = true;
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as GuestState;
      if (Array.isArray(parsed.items) && guestCartStore.get().items.length === 0) guestCartStore.setState(() => parsed);
    } catch {
      // Ignore a corrupt cart and start empty.
    }
  }
  guestCartStore.subscribe((state) => {
    void AsyncStorage.setItem(KEY, JSON.stringify(state));
  });
}

export function useGuestItems() {
  return useStore(guestCartStore, (state) => state.items);
}
