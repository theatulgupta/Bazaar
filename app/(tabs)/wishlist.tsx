import { View, Text, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWishlistStore } from '../../src/store/wishlist.store';
import { useCartStore } from '../../src/store/cart.store';
import EmptyState from '../../src/components/EmptyState';

export default function WishlistScreen() {
  const router = useRouter();
  const { items, toggle } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Text style={s.heading}>Wishlist</Text>
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          subtitle="Save items you love by tapping the heart on any product."
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)/home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.heading}>Wishlist ({items.length})</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
            style={s.row}
          >
            <Image source={{ uri: item.image }} style={s.thumb} resizeMode="contain" />
            <View style={s.info}>
              <Text numberOfLines={2} style={s.title}>{item.title}</Text>
              <Text style={s.price}>₹{Math.round(item.price * 80) / 100}</Text>
              <View style={s.actions}>
                <Pressable
                  onPress={(e) => { e.stopPropagation(); addItem(item); }}
                  style={s.cartBtn}
                >
                  <Text style={s.cartBtnTxt}>Add to Cart</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); toggle(item); }} style={s.removeBtn}>
                  <AntDesign name="heart" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: '800', color: '#111', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
  row: { flexDirection: 'row', paddingVertical: 12, gap: 12, alignItems: 'center' },
  thumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F9FAFB' },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 18 },
  price: { fontSize: 16, fontWeight: '800', color: '#111' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  cartBtn: { backgroundColor: '#FFC72C', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  cartBtnTxt: { fontSize: 12, fontWeight: '700', color: '#111' },
  removeBtn: { padding: 4 },
});
