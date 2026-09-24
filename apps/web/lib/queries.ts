'use client';

import type { Address, CartLine, Category, Order, Product, Quote, UserProfile } from '@bazaar/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browserApi } from '@/lib/api';
import type { AuditEntry } from '@/lib/types';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => browserApi<UserProfile>('/api/v1/me'),
    retry: false,
  });
}

export function useCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['cart'],
    enabled,
    queryFn: () => browserApi<{ items: CartLine[] }>('/api/v1/cart'),
  });
}

export function useWishlistQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['wishlist'],
    enabled,
    queryFn: () => browserApi<Product[]>('/api/v1/wishlist'),
  });
}

export function useAddressesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['addresses'],
    enabled,
    queryFn: () => browserApi<Address[]>('/api/v1/addresses'),
  });
}

export function useQuoteQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['quote'],
    enabled,
    queryFn: () => browserApi<Quote>('/api/v1/checkout/quote'),
  });
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => browserApi<Order>(`/api/v1/orders/${id}`),
    refetchInterval: (query) => (query.state.data?.status === 'payment_pending' ? 2000 : false),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => browserApi<{ items: Product[] }>('/admin/v1/products'),
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => browserApi<Order[]>('/admin/v1/orders'),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => browserApi<Category[]>('/api/v1/catalog/categories'),
  });
}

export function useAudit() {
  return useQuery({
    queryKey: ['audit'],
    queryFn: () => browserApi<AuditEntry[]>('/admin/v1/audit?limit=12'),
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
  const setQuantity = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      browserApi<{ items: CartLine[] }>(`/api/v1/cart/items/${input.productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: input.quantity }),
      }),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  });
  const remove = useMutation({
    mutationFn: (productId: string) =>
      browserApi<{ items: CartLine[] }>(`/api/v1/cart/items/${productId}`, { method: 'DELETE' }),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  });
  return { setQuantity, remove, refresh };
}
