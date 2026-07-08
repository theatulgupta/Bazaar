import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth.store';
import { useWishlistStore } from '../src/store/wishlist.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } },
});

function AuthGate({ onReady }: { onReady: () => void }) {
  const router = useRouter();
  const segments = useSegments();
  const { userId, loadFromStorage } = useAuthStore();

  const hydrateWishlist = useWishlistStore((s) => s.hydrate);

  useEffect(() => {
    // load auth token and wishlist in parallel
    Promise.all([loadFromStorage(), hydrateWishlist()]).finally(onReady);
  }, []);

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!userId && !inAuth) router.replace('/(auth)/login');
    if (userId && inAuth) router.replace('/(tabs)/home');
  }, [userId, segments]);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Show a full-screen splash while reading AsyncStorage on first launch
  if (!ready) {
    return (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: '#131921', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FF9900" />
        </View>
        {/* AuthGate still runs in background to trigger onReady */}
        <AuthGate onReady={() => setReady(true)} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate onReady={() => {}} />
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="address/add" />
        <Stack.Screen name="address/list" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="order-success" options={{ animation: 'fade' }} />
      </Stack>
    </QueryClientProvider>
  );
}
