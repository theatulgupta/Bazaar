import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const icons = {
  index: 'home-outline',
  search: 'search-outline',
  wishlist: 'heart-outline',
  cart: 'bag-outline',
  account: 'person-outline',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#C8553D',
        tabBarInactiveTintColor: '#7A6A60',
        tabBarStyle: { backgroundColor: '#FAF6EF', borderTopColor: '#E7DCCB' },
        tabBarLabelStyle: { fontFamily: 'Manrope_500Medium', fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name as keyof typeof icons]} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />
      <Tabs.Screen name="cart" options={{ title: 'Bag' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
