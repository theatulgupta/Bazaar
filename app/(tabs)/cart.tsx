import { View, Text, ScrollView, Image, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SearchBar from '../../src/components/SearchBar';
import { useCartStore } from '../../src/store/cart.store';
import EmptyState from '../../src/components/EmptyState';

export default function CartScreen() {
  const router = useRouter();
  const { items, increment, decrement, removeItem, total } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <SearchBar />
        <EmptyState
          icon="shopping-cart"
          title="Your cart is empty"
          subtitle="Add items to your cart to see them here."
          actionLabel="Continue Shopping"
          onAction={() => router.push('/(tabs)/home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <SearchBar />
      <ScrollView style={{ flex: 1 }}>

        {/* Subtotal bar */}
        <View style={s.subtotalBar}>
          <Text style={s.subtotalLabel}>
            Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items):
          </Text>
          <Text style={s.subtotalAmount}>₹{total().toFixed(2)}</Text>
        </View>

        <Pressable onPress={() => router.push('/checkout')} style={s.checkoutBtn}>
          <Text style={s.checkoutBtnTxt}>
            Proceed to Buy ({items.length} {items.length === 1 ? 'item' : 'items'})
          </Text>
        </Pressable>

        <View style={s.divider} />

        {items.map((item) => (
          <View key={item.id} style={s.itemBox}>
            <View style={s.itemRow}>
              <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="contain" />
              <View style={s.itemInfo}>
                <Text numberOfLines={3} style={s.itemTitle}>{item.title}</Text>
                {/* price is already discounted from the store */}
                <Text style={s.itemPrice}>₹{item.price.toFixed(2)}</Text>
                <View style={s.ratingRow}>
                  <AntDesign name="star" size={11} color="#FF9900" />
                  <Text style={s.ratingTxt}>{item.rating.rate}</Text>
                </View>
                <Text style={s.inStock}>In Stock</Text>
              </View>
            </View>

            {/* Quantity controls */}
            <View style={s.controls}>
              <View style={s.qtyRow}>
                <Pressable onPress={() => decrement(item.id)} style={s.qtyBtn}>
                  {item.quantity > 1
                    ? <Feather name="minus" size={16} color="#374151" />
                    : <AntDesign name="delete" size={16} color="#EF4444" />}
                </Pressable>
                <Text style={s.qtyTxt}>{item.quantity}</Text>
                <Pressable onPress={() => increment(item.id)} style={s.qtyBtn}>
                  <Feather name="plus" size={16} color="#374151" />
                </Pressable>
              </View>

              <Pressable onPress={() => removeItem(item.id)} style={s.deleteBtn}>
                <Text style={s.deleteBtnTxt}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  subtotalBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderColor: '#FDE68A' },
  subtotalLabel: { fontSize: 15, color: '#374151' },
  subtotalAmount: { fontSize: 20, fontWeight: '900', color: '#111', marginLeft: 4 },
  checkoutBtn: { margin: 12, backgroundColor: '#FFC72C', borderRadius: 8, padding: 14, alignItems: 'center' },
  checkoutBtnTxt: { fontWeight: '700', fontSize: 15, color: '#111' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  itemBox: { padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  itemRow: { flexDirection: 'row', gap: 12 },
  itemImg: { width: 110, height: 110, borderRadius: 8, backgroundColor: '#F9FAFB' },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontWeight: '600', fontSize: 13, color: '#111', lineHeight: 18 },
  itemPrice: { fontSize: 18, fontWeight: '900', color: '#111' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 11, color: '#6B7280' },
  inStock: { color: '#16A34A', fontSize: 12, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, overflow: 'hidden' },
  qtyBtn: { padding: 8, backgroundColor: '#F3F4F6' },
  qtyTxt: { paddingHorizontal: 16, fontWeight: '700', fontSize: 15, color: '#111' },
  deleteBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  deleteBtnTxt: { fontSize: 13, color: '#374151' },
});
