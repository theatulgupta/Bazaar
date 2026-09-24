import type { Product } from '@bazaar/contracts';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, discountPercent, Price } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { guestCartStore } from '../../src/store/guest-cart';
import { useSessionValue } from '../../src/store/session';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const session = useSessionValue();
  const queryClient = useQueryClient();
  const [note, setNote] = useState<string | null>(null);
  const product = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<Product>(`/api/v1/catalog/products/${slug}`),
  });
  const add = useMutation({
    mutationFn: (item: Product) =>
      api('/api/v1/cart/items', {
        method: 'POST',
        token: session?.accessToken,
        body: JSON.stringify({ productId: item.id, quantity: 1 }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
  const wish = useMutation({
    mutationFn: (item: Product) =>
      api('/api/v1/wishlist', {
        method: 'POST',
        token: session?.accessToken,
        body: JSON.stringify({ productId: item.id }),
      }),
  });
  const item = product.data;
  const off = item ? discountPercent(item.pricePaise, item.mrpPaise) : 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center px-4 py-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-sand">
          <Ionicons name="chevron-back" size={20} color="#2B1D16" />
        </Pressable>
      </View>
      {item ? (
        <>
          <ScrollView contentContainerClassName="px-4 pb-8">
            <View className="items-center rounded-lg bg-sand py-6">
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 280 }} contentFit="contain" />
            </View>
            <Text className="mt-4 font-sans text-sm text-muted">{item.categoryName}</Text>
            <Text className="mt-1 font-display text-3xl text-ink">{item.title}</Text>
            <View className="mt-3 flex-row items-center gap-2">
              <Price paise={item.pricePaise} />
              {item.mrpPaise > item.pricePaise ? <Price paise={item.mrpPaise} strike /> : null}
              {off > 0 ? <Badge label={`${off}% off`} /> : null}
            </View>
            <Text className={`mt-2 font-sans text-sm ${item.available ? 'text-success' : 'text-danger'}`}>
              {item.available && item.available > 0 ? `${item.available} in stock` : 'Out of stock'}
            </Text>
            <Text className="mt-4 font-sans text-base leading-6 text-ink">{item.description}</Text>
            {note ? <Text className="mt-3 font-sans text-sm text-muted">{note}</Text> : null}
          </ScrollView>
          <View className="flex-row items-center gap-3 border-t border-line bg-surface px-4 py-3">
            <Pressable
              onPress={() => {
                if (!session) {
                  router.push('/(auth)/login');
                  return;
                }
                wish.mutate(item, { onSuccess: () => setNote('Saved to your wishlist.') });
              }}
              className="h-12 w-12 items-center justify-center rounded-full bg-sand"
            >
              <Ionicons name="heart-outline" size={22} color="#C8553D" />
            </Pressable>
            <View className="flex-1">
              <Button
                label="Add to bag"
                disabled={!item.available || add.isPending}
                onPress={() => {
                  if (!session) {
                    guestCartStore.actions.add({
                      productId: item.id,
                      title: item.title,
                      slug: item.slug,
                      imageUrl: item.imageUrl,
                      unitPricePaise: item.pricePaise,
                    });
                    Alert.alert('In your bag', 'Saved on this device. Sign in at checkout.');
                    return;
                  }
                  add.mutate(item, { onSuccess: () => setNote('Added to your bag.') });
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <Text className="p-4 font-sans text-muted">{product.isError ? 'This piece is unavailable.' : 'Loading...'}</Text>
      )}
    </SafeAreaView>
  );
}
