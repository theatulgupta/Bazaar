import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useCartStore } from '../store/cart.store';
import { useRouter } from 'expo-router';

export default function SearchBar() {
  const router = useRouter();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <View style={s.container}>
      <Image
        source={{ uri: 'https://assets.stickpng.com/thumbs/580b57fcd9996e24bc43c518.png' }}
        style={s.logo}
        resizeMode="contain"
      />
      {/* tapping navigates to the dedicated search screen */}
      <Pressable
        onPress={() => router.push('/(tabs)/search')}
        style={s.searchBox}
        accessibilityLabel="Open search"
        accessible
      >
        <AntDesign name="search1" size={16} color="#9CA3AF" />
        <Text style={s.placeholder}>Search Amazon.in</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(tabs)/cart')} style={s.cartBtn}>
        <Feather name="shopping-cart" size={24} color="white" />
        {count > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{count > 9 ? '9+' : count}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#232F3E', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 80, height: 32 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, height: 36, paddingHorizontal: 10, gap: 8 },
  placeholder: { fontSize: 13, color: '#9CA3AF' },
  cartBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#FF9900', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
