import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusPill, TopBar } from '../../src/components/ui';
import { rupees } from '../../src/lib/money';
import { useOrderQuery } from '../../src/lib/queries';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderQuery(id);
  const data = order.data;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Order" />
      {data ? (
        <View className="mx-4 rounded-lg bg-surface p-4">
          <Text className="font-display text-3xl text-ink">{data.number}</Text>
          <View className="mt-2">
            <StatusPill status={data.status} />
          </View>
          {data.status === 'payment_pending' ? (
            <Text className="mt-3 font-sans text-ink">Waiting for payment confirmation from the server.</Text>
          ) : null}
          <Text className="mt-4 font-sans text-lg font-semibold text-ink">Total {rupees(data.totalPaise)}</Text>
          {data.items.map((item) => (
            <Text key={item.productId} className="mt-2 font-sans text-ink">
              {item.quantity} × {item.title}
            </Text>
          ))}
          <Text className="mt-4 font-sans text-muted">
            {data.address.name}, {data.address.city} {data.address.pincode}
          </Text>
        </View>
      ) : (
        <Text className="p-4 font-sans text-muted">{order.isError ? 'Order not found' : 'Loading...'}</Text>
      )}
    </SafeAreaView>
  );
}
