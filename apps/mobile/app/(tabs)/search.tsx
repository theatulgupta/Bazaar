import type { Product } from '@bazaar/contracts';
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { EmptyState, Price, TopBar } from '../../src/components/ui';
import { api } from '../../src/lib/api';

type ProductPage = { items: Product[] };

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced] = useDebouncedValue(q, { wait: 300 });
  const query = debounced.trim();
  const results = useQuery({
    queryKey: ['search', query],
    queryFn: () => api<ProductPage>(`/api/v1/catalog/products?q=${encodeURIComponent(query)}`),
    enabled: query.length > 1,
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Search" />
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Look through the stall"
        placeholderTextColor="#7A6A60"
        className="mx-4 mb-3 rounded-full border border-line bg-sand px-4 py-3 font-sans text-ink"
        autoCapitalize="none"
      />
      <FlashList
        data={results.data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          query.length > 1 && !results.isFetching ? (
            <View className="px-4">
              <EmptyState title="Nothing matched" body="Try a shorter word, like gold or cotton." />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/product/${item.slug}`)} className="mx-4 mb-3 flex-row rounded-lg bg-surface p-3">
            <View className="h-16 w-16 items-center justify-center rounded-md bg-sand">
              <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56 }} contentFit="contain" />
            </View>
            <View className="ml-3 flex-1">
              <Text numberOfLines={2} className="font-sans text-ink">
                {item.title}
              </Text>
              <Price paise={item.pricePaise} />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
