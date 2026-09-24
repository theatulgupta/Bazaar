import type { Category, Product } from '@bazaar/contracts';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Badge, discountPercent, Price, SectionHeader, TopBar } from '../../src/components/ui';
import { api } from '../../src/lib/api';

type ProductPage = { items: Product[] };

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  electronics: 'hardware-chip-outline',
  jewelery: 'diamond-outline',
  'mens-clothing': 'shirt-outline',
  'womens-clothing': 'woman-outline',
};

export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string | undefined>();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/api/v1/catalog/categories'),
    staleTime: 0,
  });
  const deals = useQuery({
    queryKey: ['deals'],
    queryFn: () => api<Product[]>('/api/v1/catalog/deals'),
    staleTime: 0,
  });
  const products = useQuery({
    queryKey: ['products', category],
    queryFn: () => api<ProductPage>(`/api/v1/catalog/products?pageSize=24${category ? `&category=${category}` : ''}`),
    staleTime: 0,
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar
        title="Bazaar"
        action={
          <Pressable onPress={() => router.push('/search')} className="h-11 w-11 items-center justify-center rounded-full bg-sand">
            <Ionicons name="search" size={20} color="#2B1D16" />
          </Pressable>
        }
      />
      <FlashList
        data={products.data?.items ?? []}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => router.push('/search')}>
              <LinearGradient colors={['#C8553D', '#A9432F']} style={{ borderRadius: 20, padding: 20, marginTop: 8 }}>
                <Text className="font-sans text-sm text-onPrimary">This week</Text>
                <Text className="mt-1 font-display text-3xl text-onPrimary">Fresh finds</Text>
                <Text className="mt-2 font-sans text-onPrimary">Deals picked from the stall, priced in rupees.</Text>
              </LinearGradient>
            </Pressable>
            <SectionHeader title="Browse" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable onPress={() => setCategory(undefined)} className="mr-3 items-center">
                <View className={`h-16 w-16 items-center justify-center rounded-full ${!category ? 'bg-primary' : 'bg-sand'}`}>
                  <Ionicons name="grid-outline" size={22} color={!category ? '#fff' : '#2B1D16'} />
                </View>
                <Text className="mt-2 font-sans text-xs text-ink">All</Text>
              </Pressable>
              {categories.data?.map((item) => {
                const active = category === item.slug;
                return (
                  <Pressable key={item.id} onPress={() => setCategory(item.slug)} className="mr-3 items-center">
                    <View className={`h-16 w-16 items-center justify-center rounded-full ${active ? 'bg-primary' : 'bg-sand'}`}>
                      <Ionicons name={categoryIcons[item.slug] ?? 'pricetag-outline'} size={22} color={active ? '#fff' : '#2B1D16'} />
                    </View>
                    <Text className="mt-2 max-w-[72px] text-center font-sans text-xs text-ink" numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <SectionHeader title="On the stall" caption="Marked down from the listed price" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {deals.data?.map((deal) => (
                <Pressable key={deal.id} onPress={() => router.push(`/product/${deal.slug}`)} className="mr-3 w-40 rounded-lg bg-surface p-3">
                  <View className="h-28 items-center justify-center rounded-md bg-sand">
                    <Image source={{ uri: deal.imageUrl }} style={{ width: '100%', height: 100 }} contentFit="contain" />
                  </View>
                  {discountPercent(deal.pricePaise, deal.mrpPaise) > 0 ? (
                    <View className="absolute right-5 top-5">
                      <Badge label={`${discountPercent(deal.pricePaise, deal.mrpPaise)}% off`} />
                    </View>
                  ) : null}
                  <Text numberOfLines={2} className="mt-2 font-sans text-sm text-ink">
                    {deal.title}
                  </Text>
                  <Price paise={deal.pricePaise} />
                </Pressable>
              ))}
            </ScrollView>
            <SectionHeader title="New arrivals" />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/product/${item.slug}`)} className="m-1 flex-1 rounded-lg bg-surface p-3">
            <View className="h-32 items-center justify-center rounded-md bg-sand">
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 112 }} contentFit="contain" />
            </View>
            <Text numberOfLines={2} className="mt-2 font-sans text-sm text-ink">
              {item.title}
            </Text>
            <Price paise={item.pricePaise} />
            {item.mrpPaise > item.pricePaise ? <Price paise={item.mrpPaise} strike /> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
