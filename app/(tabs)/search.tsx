import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList,
  Pressable, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fakeStoreApi } from '../../src/lib/api';
import { Product } from '../../src/types';
import { useCartStore } from '../../src/store/cart.store';
import EmptyState from '../../src/components/EmptyState';

export default function SearchScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce: wait 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data } = await fakeStoreApi.get('/products');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const results = debouncedQuery.length > 1
    ? (allProducts ?? []).filter((p) =>
        p.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [];

  const formatPrice = (price: number) => (price * 0.8).toFixed(2);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Search input */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={22} color="#111" />
        </Pressable>
        <View style={s.inputBox}>
          <AntDesign name="search1" size={16} color="#9CA3AF" />
          <TextInput
            autoFocus
            placeholder="Search products…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={s.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={s.loadingBox}>
          <ActivityIndicator color="#FF9900" />
          <Text style={s.loadingTxt}>Searching the catalog…</Text>
        </View>
      )}

      {!isLoading && debouncedQuery.length > 1 && results.length === 0 && (
        <EmptyState
          icon="search"
          title={`No results for "${debouncedQuery}"`}
          subtitle="Try a different keyword or browse categories on the home screen."
        />
      )}

      {debouncedQuery.length <= 1 && !isLoading && (
        <View style={s.hint}>
          <Feather name="search" size={40} color="#E5E7EB" />
          <Text style={s.hintTxt}>Start typing to search products</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
            style={s.resultRow}
          >
            <Image source={{ uri: item.image }} style={s.thumb} resizeMode="contain" />
            <View style={s.resultInfo}>
              <Text numberOfLines={2} style={s.resultTitle}>{item.title}</Text>
              <Text style={s.resultCat}>{item.category}</Text>
              <View style={s.resultPriceRow}>
                <Text style={s.resultPrice}>₹{formatPrice(item.price)}</Text>
                <View style={s.ratingPill}>
                  <AntDesign name="star" size={10} color="#FF9900" />
                  <Text style={s.ratingTxt}>{item.rating.rate}</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation(); addItem(item); }}
              style={s.addBtn}
            >
              <Feather name="shopping-cart" size={14} color="#111" />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  input: { flex: 1, fontSize: 14, color: '#111' },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hintTxt: { fontSize: 14, color: '#9CA3AF' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 32 },
  loadingTxt: { fontSize: 13, color: '#6B7280' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#F9FAFB' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 18 },
  resultCat: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  resultPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resultPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  ratingTxt: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  addBtn: { backgroundColor: '#FFC72C', padding: 8, borderRadius: 8 },
});
