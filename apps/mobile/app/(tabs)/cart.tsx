import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, Price, QuantityStepper, TopBar } from '../../src/components/ui';
import { useCartMutations, useCartQuery } from '../../src/lib/queries';
import { rupees } from '../../src/lib/money';
import { guestCartStore, useGuestItems } from '../../src/store/guest-cart';
import { useSessionValue } from '../../src/store/session';

export default function CartScreen() {
  const router = useRouter();
  const session = useSessionValue();
  const guestItems = useGuestItems();
  const cart = useCartQuery();
  const { setQuantity, remove } = useCartMutations();
  const lines = session ? (cart.data?.items ?? []) : guestItems;
  const total = lines.reduce((sum, line) => sum + line.unitPricePaise * line.quantity, 0);

  function change(productId: string, quantity: number) {
    if (!session) {
      guestCartStore.actions.setQuantity(productId, quantity);
      return;
    }
    if (quantity <= 0) remove.mutate(productId);
    else setQuantity.mutate({ productId, quantity });
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Bag" />
      <View className="flex-1 px-4">
        {lines.length === 0 ? (
          <EmptyState
            title="Your bag is empty"
            body="The stall is open. Find something you like."
            action={<Button label="Start browsing" onPress={() => router.push('/(tabs)')} />}
          />
        ) : null}
        {lines.map((line) => (
          <View key={line.productId} className="mb-3 flex-row rounded-lg bg-surface p-3">
            <View className="h-20 w-20 items-center justify-center rounded-md bg-sand">
              <Image source={{ uri: line.imageUrl }} style={{ width: 72, height: 72 }} contentFit="contain" />
            </View>
            <View className="ml-3 flex-1 justify-between">
              <Text numberOfLines={2} className="font-sans text-ink">
                {line.title}
              </Text>
              <View className="flex-row items-center justify-between">
                <Price paise={line.unitPricePaise} />
                <QuantityStepper quantity={line.quantity} onChange={(quantity) => change(line.productId, quantity)} />
              </View>
            </View>
          </View>
        ))}
      </View>
      <View className="border-t border-line bg-surface px-4 py-4">
        <Text className="mb-3 font-sans text-base text-ink">Subtotal {rupees(total)}</Text>
        <Button label="Checkout" disabled={lines.length === 0} onPress={() => router.push(session ? '/checkout' : '/(auth)/login')} />
      </View>
    </SafeAreaView>
  );
}
