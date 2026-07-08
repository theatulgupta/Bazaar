import { Tabs } from 'expo-router';
import { Entypo, AntDesign, Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../src/store/cart.store';
import { useWishlistStore } from '../../src/store/wishlist.store';

function CartIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <View>
      {focused
        ? <Ionicons name="cart" size={24} color="#00CED1" />
        : <Ionicons name="cart-outline" size={24} color="#6B7280" />}
      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function WishlistIcon({ focused }: { focused: boolean }) {
  const count = useWishlistStore((s) => s.items.length);
  return (
    <View>
      <AntDesign name={focused ? 'heart' : 'hearto'} size={22} color={focused ? '#00CED1' : '#6B7280'} />
      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00CED1',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { borderTopColor: '#E5E7EB', backgroundColor: '#fff', height: 56 },
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) =>
            focused ? <Entypo name="home" size={22} color="#00CED1" /> : <AntDesign name="home" size={22} color="#6B7280" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) =>
            <Feather name="search" size={22} color={focused ? '#00CED1' : '#6B7280'} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => <WishlistIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <CartIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) =>
            focused
              ? <MaterialIcons name="person" size={24} color="#00CED1" />
              : <MaterialIcons name="person-outline" size={24} color="#6B7280" />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#FF9900', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
