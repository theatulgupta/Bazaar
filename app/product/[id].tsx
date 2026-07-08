import { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Dimensions, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fakeStoreApi } from '../../src/lib/api';
import { useCartStore } from '../../src/store/cart.store';
import { useWishlistStore } from '../../src/store/wishlist.store';
import { Product } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, has } = useWishlistStore();
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await fakeStoreApi.get(`/products/${id}`);
      return data;
    },
    // only fetch from FakeStore if id is numeric; static deals use their own id
    enabled: !!id && !isNaN(Number(id)),
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    if (!product) return;
    await Share.share({ message: `Check out ${product.title} on Amazon Clone!` });
  };

  if (isLoading || !product) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#FF9900" />
      </View>
    );
  }

  const discountedPrice = (product.price * 0.8).toFixed(2);
  const originalPrice = product.price.toFixed(2);
  const wishlisted = has(product.id);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Product Details</Text>
        <View style={s.headerRight}>
          <Pressable onPress={() => toggle(product)} style={s.iconBtn}>
            <AntDesign name={wishlisted ? 'heart' : 'hearto'} size={22} color={wishlisted ? '#EF4444' : '#111'} />
          </Pressable>
          <Pressable onPress={handleShare} style={s.iconBtn}>
            <Feather name="share-2" size={20} color="#111" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={s.imageBox}>
          <Image source={{ uri: product.image }} style={{ width: width - 80, height: 260 }} resizeMode="contain" />
          <View style={s.discountBadge}>
            <Text style={s.discountTxt}>20% OFF</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.category}>{product.category}</Text>
          <Text style={s.title}>{product.title}</Text>

          {/* Stars */}
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <AntDesign
                key={n}
                name={n <= Math.round(product.rating.rate) ? 'star' : 'staro'}
                size={14}
                color="#FF9900"
              />
            ))}
            <Text style={s.ratingTxt}>{product.rating.rate} ({product.rating.count} reviews)</Text>
          </View>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>₹{discountedPrice}</Text>
            <Text style={s.oldPrice}>₹{originalPrice}</Text>
            <Text style={s.saveTxt}>20% off</Text>
          </View>
          <Text style={s.deliveryTxt}>FREE delivery tomorrow by 3 PM</Text>

          <View style={s.divider} />

          <Text style={s.aboutTitle}>About this item</Text>
          <Text style={s.description}>{product.description}</Text>

          <View style={s.divider} />

          <Text style={s.inStock}>✓ In Stock</Text>

          {/* CTAs */}
          <Pressable onPress={handleAddToCart} style={[s.btn, added && s.btnAdded]}>
            <Text style={s.btnTxt}>{added ? '✓ Added to Cart' : 'Add to Cart'}</Text>
          </Pressable>

          <Pressable onPress={() => { handleAddToCart(); router.push('/checkout'); }} style={s.btnBuy}>
            <Text style={s.btnBuyTxt}>Buy Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 15, color: '#111' },
  headerRight: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  imageBox: { backgroundColor: '#F9FAFB', padding: 20, alignItems: 'center' },
  discountBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#C60C30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  discountTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 16 },
  category: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#111', lineHeight: 22 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingTxt: { fontSize: 13, color: '#6B7280', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 },
  price: { fontSize: 26, fontWeight: '900', color: '#111' },
  oldPrice: { fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saveTxt: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  deliveryTxt: { fontSize: 13, color: '#16A34A', fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  aboutTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 6 },
  description: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  inStock: { fontSize: 15, color: '#16A34A', fontWeight: '700', marginBottom: 16 },
  btn: { backgroundColor: '#FFC72C', borderRadius: 24, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnAdded: { backgroundColor: '#D1FAE5' },
  btnTxt: { fontWeight: '700', fontSize: 15, color: '#111' },
  btnBuy: { backgroundColor: '#FF9900', borderRadius: 24, padding: 14, alignItems: 'center', marginBottom: 24 },
  btnBuyTxt: { fontWeight: '700', fontSize: 15, color: '#fff' },
});
