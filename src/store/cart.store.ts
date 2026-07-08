import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  clear: () => void;
  total: () => number;
}

// Apply 20% discount at add-time — price stays consistent throughout cart/checkout
const discounted = (price: number) => Math.round(price * 0.8 * 100) / 100;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const existing = get().items.find((i) => i.id === product.id);
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }));
    } else {
      // store the discounted price so cart total is always correct
      set((s) => ({
        items: [...s.items, { ...product, price: discounted(product.price), quantity: 1 }],
      }));
    }
  },

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  increment: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)),
    })),

  decrement: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    if (item.quantity <= 1) {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    } else {
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)),
      }));
    }
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
