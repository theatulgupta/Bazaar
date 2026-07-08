import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { Order } from '../../src/types';
import { SkeletonBox } from '../../src/components/Skeleton';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/order/detail/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </Pressable>
          <Text style={s.headerTitle}>Order Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SkeletonBox height={80} borderRadius={10} style={{ marginBottom: 16 }} />
          <SkeletonBox height={16} width="40%" style={{ marginBottom: 8 }} />
          <SkeletonBox height={120} borderRadius={10} style={{ marginBottom: 16 }} />
          <SkeletonBox height={16} width="40%" style={{ marginBottom: 8 }} />
          {[1, 2].map((n) => (
            <SkeletonBox key={n} height={90} borderRadius={10} style={{ marginBottom: 10 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9CA3AF' }}>Order not found</Text>
      </View>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status as any);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Order ID + date */}
        <View style={s.metaBox}>
          <Text style={s.metaLabel}>Order ID</Text>
          <Text style={s.metaValue} numberOfLines={1}>{order._id}</Text>
          <Text style={s.metaLabel}>Placed on</Text>
          <Text style={s.metaValue}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>

        {/* Status timeline */}
        <Text style={s.sectionTitle}>Order Status</Text>
        <View style={s.timeline}>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentStep;
            return (
              <View key={step} style={s.timelineRow}>
                <View style={s.timelineLeft}>
                  <View style={[s.dot, done && s.dotDone]} />
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[s.line, done && i < currentStep && s.lineDone]} />
                  )}
                </View>
                <Text style={[s.stepLabel, done && s.stepLabelDone]}>{step.charAt(0).toUpperCase() + step.slice(1)}</Text>
              </View>
            );
          })}
        </View>

        {/* Products */}
        <Text style={s.sectionTitle}>Items ({order.products.length})</Text>
        {order.products.map((p, i) => (
          <View key={i} style={s.productRow}>
            <Image source={{ uri: p.image }} style={s.productImg} resizeMode="contain" />
            <View style={s.productInfo}>
              <Text numberOfLines={2} style={s.productName}>{p.name}</Text>
              <Text style={s.productMeta}>Qty: {p.quantity}</Text>
              <Text style={s.productPrice}>₹{p.price * p.quantity}</Text>
            </View>
          </View>
        ))}

        {/* Shipping address */}
        <Text style={s.sectionTitle}>Shipping Address</Text>
        <View style={s.addressBox}>
          <Text style={s.addressName}>{order.shippingAddress.name}</Text>
          <Text style={s.addressLine}>{order.shippingAddress.houseNo}, {order.shippingAddress.landmark}</Text>
          <Text style={s.addressLine}>{order.shippingAddress.street}</Text>
          <Text style={s.addressLine}>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</Text>
          <Text style={s.addressLine}>📞 {order.shippingAddress.mobile}</Text>
        </View>

        {/* Price summary */}
        <Text style={s.sectionTitle}>Price Summary</Text>
        <View style={s.summaryBox}>
          {[
            { label: 'Items total', value: `₹${order.totalPrice.toFixed(2)}` },
            { label: 'Delivery', value: 'FREE' },
            { label: 'Payment', value: order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'UPI / Card' },
          ].map((row) => (
            <View key={row.label} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={s.summaryValue}>{row.value}</Text>
            </View>
          ))}
          <View style={[s.summaryRow, { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 8, marginTop: 4 }]}>
            <Text style={[s.summaryLabel, { fontWeight: '800', color: '#111' }]}>Order Total</Text>
            <Text style={[s.summaryValue, { fontWeight: '900', color: '#C60C30', fontSize: 16 }]}>₹{order.totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#111' },
  metaBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 16, gap: 2 },
  metaLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10, marginTop: 4 },
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#D1D5DB', borderWidth: 2, borderColor: '#D1D5DB' },
  dotDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  line: { width: 2, height: 28, backgroundColor: '#E5E7EB' },
  lineDone: { backgroundColor: '#16A34A' },
  stepLabel: { fontSize: 13, color: '#9CA3AF', paddingTop: 1 },
  stepLabelDone: { color: '#111', fontWeight: '600' },
  productRow: { flexDirection: 'row', gap: 12, marginBottom: 12, padding: 10, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 10 },
  productImg: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#F9FAFB' },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 13, fontWeight: '600', color: '#111' },
  productMeta: { fontSize: 12, color: '#6B7280' },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  addressBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 16, gap: 3 },
  addressName: { fontWeight: '700', fontSize: 14, color: '#111' },
  addressLine: { fontSize: 13, color: '#4B5563' },
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 32 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
});
