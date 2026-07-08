import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

const STORAGE_KEY = 'wishlist';

interface WishlistState {
  items: Product[];
  hydrated: boolean;
  toggle: (product: Product) => void;
  has: (id: number) => boolean;
  hydrate: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  hydrated: false,

  toggle: (product) => {
    const exists = get().items.some((i) => i.id === product.id);
    const next = exists
      ? get().items.filter((i) => i.id !== product.id)
      : [...get().items, product];
    set({ items: next });
    // persist in background
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(console.error);
  },

  has: (id) => get().items.some((i) => i.id === id),

  // call once on app start to restore persisted wishlist
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ items: JSON.parse(raw) });
    } catch {
      // ignore parse errors
    } finally {
      set({ hydrated: true });
    }
  },
}));
