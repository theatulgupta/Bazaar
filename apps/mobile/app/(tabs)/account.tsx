import type { Order } from '@bazaar/contracts';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusPill, TopBar } from '../../src/components/ui';
import { useOrdersQuery } from '../../src/lib/queries';
import { rupees } from '../../src/lib/money';
import { sessionStore, useSessionValue } from '../../src/store/session';

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Order>();
const columns = helper.columns([
  helper.accessor('number', { header: 'Order' }),
  helper.accessor('status', { header: 'Status' }),
  helper.accessor('totalPaise', { header: 'Total' }),
]);
const emptyOrders: Order[] = [];

export default function AccountScreen() {
  const session = useSessionValue();
  const router = useRouter();
  const orders = useOrdersQuery();
  const table = useTable({ features, columns, data: orders.data ?? emptyOrders });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Account" />
      {!session ? (
        <View className="gap-3 px-4">
          <Button label="Sign in" onPress={() => router.push('/(auth)/login')} />
          <Button label="Create account" tone="secondary" onPress={() => router.push('/(auth)/register')} />
        </View>
      ) : (
        <View className="px-4">
          <View className="rounded-lg bg-surface p-4">
            <Text className="font-display text-2xl text-ink">Hello, {session.user.name.split(' ')[0]}</Text>
            <Text className="mt-1 font-sans text-muted">{session.user.email}</Text>
            {!session.user.emailVerified ? <Text className="mt-2 font-sans text-danger">Verify your email before checkout.</Text> : null}
          </View>
          <Pressable onPress={() => router.push('/addresses')} className="mt-4">
            <Text className="font-sans text-info">Your addresses</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/verify-email')} className="mt-2">
            <Text className="font-sans text-info">Verify email</Text>
          </Pressable>
          <Text className="mb-2 mt-6 font-display text-2xl text-ink">Orders</Text>
          {table.getRowModel().rows.map((row) => (
            <Pressable key={row.id} onPress={() => router.push(`/order/${row.original.id}`)} className="mb-3 rounded-lg bg-surface p-4">
              <Text className="font-sans font-semibold text-ink">{row.original.number}</Text>
              <View className="mt-2 flex-row items-center justify-between">
                <StatusPill status={row.original.status} />
                <Text className="font-sans text-ink">{rupees(row.original.totalPaise)}</Text>
              </View>
            </Pressable>
          ))}
          <View className="mt-6">
            <Button label="Sign out" tone="secondary" onPress={() => void sessionStore.actions.clear()} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
