import '../global.css';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { queryClient } from '../src/lib/query-client';
import { LoadingMark } from '../src/components/ui';
import { startGuestCartPersistence } from '../src/store/guest-cart';
import { sessionStore, useSessionReady } from '../src/store/session';

export default function RootLayout() {
  const ready = useSessionReady();
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  useEffect(() => {
    void sessionStore.actions.hydrate();
    void startGuestCartPersistence();
  }, []);

  if (!ready || !fontsLoaded) return <LoadingMark />;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF6EF' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="product/[slug]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </QueryClientProvider>
  );
}
