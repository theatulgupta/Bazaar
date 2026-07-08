import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { fakeStoreApi } from '../lib/api';
import { Product, Address, Order, User } from '../types';

export const useProducts = (category?: string) =>
  useQuery<Product[]>({
    queryKey: ['products', category],
    queryFn: async () => {
      const url = category
        ? `/products/category/${encodeURIComponent(category)}`
        : '/products';
      const { data } = await fakeStoreApi.get(url);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCategories = () =>
  useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await fakeStoreApi.get('/products/categories');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

export const useProfile = (userId: string | null) =>
  useQuery<User>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await api.get(`/user/profile/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });

export const useAddresses = (userId: string | null) =>
  useQuery<Address[]>({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      const { data } = await api.get(`/address/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });

export const useOrders = (userId: string | null) =>
  useQuery<Order[]>({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data } = await api.get(`/order/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });

export const useAddAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; address: Omit<Address, '_id'> }) =>
      api.post('/address/add', payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['addresses', vars.userId] }),
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, addressId }: { userId: string; addressId: string }) =>
      api.delete(`/address/${userId}/${addressId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['addresses', vars.userId] }),
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: object) => api.post('/order/add', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};
