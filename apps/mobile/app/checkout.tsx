import type { CheckoutResult } from '@bazaar/contracts';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TopBar } from '../src/components/ui';
import { api, ApiError } from '../src/lib/api';
import { rupees } from '../src/lib/money';
import { openRazorpayCheckout } from '../src/lib/razorpay';
import { useAddressesQuery, useQuoteQuery } from '../src/lib/queries';
import { useSessionValue } from '../src/store/session';

export default function CheckoutScreen() {
  const session = useSessionValue();
  const router = useRouter();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const token = session?.accessToken;

  const addresses = useAddressesQuery();
  const quote = useQuoteQuery();

  const selected = addressId ?? addresses.data?.find((item) => item.isDefault)?.id ?? addresses.data?.[0]?.id ?? null;

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-canvas p-4" edges={['top']}>
        <Text>Sign in to check out.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Checkout" />
      <View className="flex-1 gap-3 px-4">
        <Text className="font-display text-2xl text-ink">Deliver to</Text>
        {addresses.data?.map((address) => (
          <Pressable
            key={address.id}
            onPress={() => setAddressId(address.id)}
            className={`rounded-lg border bg-surface p-3 ${selected === address.id ? 'border-primary' : 'border-line'}`}
          >
            <Text className="font-sans font-semibold text-ink">{address.name}</Text>
            <Text className="font-sans text-muted">
              {address.houseNo}, {address.street}, {address.city} {address.pincode}
            </Text>
          </Pressable>
        ))}
        <Button label="Add an address" tone="secondary" onPress={() => router.push('/addresses')} />
        {quote.data ? (
          <View className="rounded-lg bg-surface p-4">
            <Text className="font-sans text-ink">Items {rupees(quote.data.subtotalPaise)}</Text>
            <Text className="font-sans text-ink">Delivery {quote.data.shippingPaise === 0 ? 'FREE' : rupees(quote.data.shippingPaise)}</Text>
            <Text className="mt-1 font-display text-2xl text-ink">Total {rupees(quote.data.totalPaise)}</Text>
          </View>
        ) : null}
        {error ? <Text className="font-sans text-danger">{error}</Text> : null}
      </View>
      <View className="border-t border-line bg-surface p-4">
        <Button
          label={busy ? 'Placing order...' : 'Pay'}
          disabled={busy || !selected || !quote.data}
          onPress={() => {
            if (!selected) return;
            setBusy(true);
            setError(null);
            void pay(token!, selected, idempotencyKey.current, session.user.email, session.user.name)
              .then((orderId) => router.replace(`/order/${orderId}`))
              .catch((err: unknown) => {
                idempotencyKey.current = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Checkout failed');
              })
              .finally(() => setBusy(false));
          }}
        />
      </View>
    </SafeAreaView>
  );
}

async function pay(token: string, addressId: string, key: string, email: string, name: string) {
  const result = await api<CheckoutResult>('/api/v1/checkout/orders', {
    method: 'POST',
    token,
    headers: { 'idempotency-key': key },
    body: JSON.stringify({ addressId }),
  });
  if (result.razorpayOrderId.startsWith('order_fake_')) {
    Alert.alert(
      'Order placed',
      'This environment uses the fake payment driver. The order stays payment pending until a signed webhook is delivered to the API.',
    );
    return result.orderId;
  }
  try {
    await openRazorpayCheckout(result, { email, name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment was not completed';
    if (/native module|not found|null/i.test(message)) {
      throw new Error('Razorpay needs an Expo development build. Run pnpm --filter @bazaar/mobile prebuild, then rebuild the app. Expo Go cannot load this module.');
    }
    throw new Error(message);
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const order = await api<{ status: string }>(`/api/v1/orders/${result.orderId}`, { token });
    if (order.status !== 'payment_pending') break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return result.orderId;
}
