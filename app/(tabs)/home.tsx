import { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SearchBar from '../../src/components/SearchBar';
import BannerCarousel from '../../src/components/BannerCarousel';
import ProductCard from '../../src/components/ProductCard';
import { ProductGridSkeleton } from '../../src/components/Skeleton';
import { useProducts, useCategories } from '../../src/hooks/useApi';
import { BANNER_IMAGES, DEALS, OFFERS } from '../../src/constants/data';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('electronics');
  const { data: products, isLoading, isError, refetch } = useProducts(selectedCategory);
  const { data: categories } = useCategories();

  const cats = categories ?? ['electronics', "men's clothing", "women's clothing", 'jewelery'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <SearchBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            tintColor="#FF9900"
          />
        }
      >

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsRow}>
          {cats.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[s.pill, selectedCategory === cat && s.pillActive]}
            >
              <Text style={[s.pillTxt, selectedCategory === cat && s.pillTxtActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <BannerCarousel images={BANNER_IMAGES} />

        {/* Trending deals */}
        <SectionHeader title="Trending Deals" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
          {DEALS.map((deal) => (
            <Pressable
              key={deal.id}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: deal.id } })}
              style={s.dealCard}
            >
              <Image source={{ uri: deal.image }} style={s.dealImg} resizeMode="cover" />
              <View style={s.dealInfo}>
                <Text style={s.dealSave}>Save ₹{deal.oldPrice - deal.price}</Text>
                <Text numberOfLines={1} style={s.dealTitle}>{deal.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Today's offers */}
        <SectionHeader title="Today's Offers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
          {OFFERS.map((offer) => (
            <Pressable
              key={offer.id}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: offer.id } })}
              style={s.offerItem}
            >
              <Image source={{ uri: offer.image }} style={s.offerImg} resizeMode="contain" />
              <View style={s.offerBadge}>
                <Text style={s.offerBadgeTxt}>Upto {offer.offer}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Products grid */}
        <SectionHeader title={selectedCategory} capitalize />

        {isError ? (
          <Text style={s.errorTxt}>Failed to load products. Pull to refresh.</Text>
        ) : isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <View style={s.grid}>
            {products?.map((product) => (
              <ProductCard key={product.id} item={product} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, capitalize }: { title: string; capitalize?: boolean }) {
  return (
    <Text style={[s.sectionHeader, capitalize && { textTransform: 'capitalize' }]}>
      {title}
    </Text>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  pillsRow: { paddingVertical: 10, paddingHorizontal: 8 },
  pill: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  pillActive: { backgroundColor: '#131921' },
  pillTxt: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pillTxtActive: { color: '#FF9900' },
  hScroll: { paddingHorizontal: 8, paddingBottom: 4 },
  sectionHeader: { fontSize: 18, fontWeight: '800', paddingHorizontal: 12, marginTop: 20, marginBottom: 10, color: '#111' },
  dealCard: { marginRight: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  dealImg: { width: 160, height: 150 },
  dealInfo: { padding: 8 },
  dealSave: { fontSize: 11, color: '#EF4444', fontWeight: '700' },
  dealTitle: { fontSize: 12, color: '#111', fontWeight: '600', width: 144, marginTop: 2 },
  offerItem: { marginRight: 10, alignItems: 'center', width: 130 },
  offerImg: { width: 120, height: 120 },
  offerBadge: { marginTop: 6, backgroundColor: '#C60C30', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  offerBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 },
  errorTxt: { textAlign: 'center', color: '#EF4444', padding: 20, fontSize: 14 },
});
