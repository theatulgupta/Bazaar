import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '../types';
import { useCartStore } from '../store/cart.store';
import { useWishlistStore } from '../store/wishlist.store';

interface Props { item: Product }

export default function ProductCard({ item }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, has } = useWishlistStore();
  const wishlisted = has(item.id);

  const discountedPrice = (item.price * 0.8).toFixed(2);
  const originalPrice = Number(item.price).toFixed(2);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
      style={s.card}
    >
      {/* Wishlist button */}
      <Pressable onPress={(e) => { e.stopPropagation(); toggle(item); }} style={s.heartBtn}>
        <AntDesign name={wishlisted ? 'heart' : 'hearto'} size={16} color={wishlisted ? '#EF4444' : '#9CA3AF'} />
      </Pressable>

      <Image source={{ uri: item.image }} style={s.image} resizeMode="contain" />

      <View style={s.ratingRow}>
        <AntDesign name="star" size={11} color="#FF9900" />
        <Text style={s.ratingTxt}>{item.rating.rate} ({item.rating.count})</Text>
      </View>

      <Text numberOfLines={2} style={s.title}>{item.title}</Text>

      <View style={s.priceRow}>
        <Text style={s.price}>₹{discountedPrice}</Text>
        <Text style={s.oldPrice}>₹{originalPrice}</Text>
      </View>

      <Pressable onPress={(e) => { e.stopPropagation(); addItem(item); }} style={s.addBtn}>
        <Text style={s.addBtnTxt}>Add to Cart</Text>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, margin: '1%', padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1, padding: 4 },
  image: { width: '100%', height: 130, backgroundColor: '#fff' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  ratingTxt: { fontSize: 11, color: '#6B7280' },
  title: { fontSize: 12, fontWeight: '600', color: '#111', marginTop: 4, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '800', color: '#111' },
  oldPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  addBtn: { marginTop: 8, backgroundColor: '#FFC72C', borderRadius: 20, paddingVertical: 6, alignItems: 'center' },
  addBtnTxt: { fontSize: 12, fontWeight: '700', color: '#111' },
});
