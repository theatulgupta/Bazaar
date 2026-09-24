import type { Address, CartLine, Order, Product, Quote } from '@bazaar/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { api } from './api';
import { sessionStore } from '../store/session';

export function useAccessToken() {
  return useStore(sessionStore, (state) => state.session?.accessToken ?? null);
}

export function useCartQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['cart', token],
    enabled: Boolean(token),
    queryFn: () => api<{ items: CartLine[] }>('/api/v1/cart', { token }),
  });
}

export function useWishlistQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['wishlist', token],
    enabled: Boolean(token),
    queryFn: () => api<Product[]>('/api/v1/wishlist', { token }),
  });
}

export function useOrdersQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['orders', token],
    enabled: Boolean(token),
    queryFn: () => api<Order[]>('/api/v1/orders', { token }),
  });
}

export function useOrderQuery(id: string | undefined) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['order', id, token],
    enabled: Boolean(token && id),
    refetchInterval: (query) => (query.state.data?.status === 'payment_pending' ? 2000 : false),
    queryFn: () => api<Order>(`/api/v1/orders/${id}`, { token }),
  });
}

export function useAddressesQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['addresses', token],
    enabled: Boolean(token),
    queryFn: () => api<Address[]>('/api/v1/addresses', { token }),
  });
}

export function useQuoteQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['quote', token],
    enabled: Boolean(token),
    queryFn: () => api<Quote>('/api/v1/checkout/quote', { token }),
  });
}

export function useCartMutations() {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
  const setQuantity = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      api<{ items: CartLine[] }>(`/api/v1/cart/items/${input.productId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ quantity: input.quantity }),
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (productId: string) => api(`/api/v1/cart/items/${productId}`, { method: 'DELETE', token }),
    onSuccess: refresh,
  });
  const add = useMutation({
    mutationFn: (productId: string) =>
      api('/api/v1/cart/items', { method: 'POST', token, body: JSON.stringify({ productId, quantity: 1 }) }),
    onSuccess: refresh,
  });
  return { add, setQuantity, remove };
}
