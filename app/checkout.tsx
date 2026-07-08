import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { useCartStore } from '../src/store/cart.store';
import { useAddresses, useCreateOrder } from '../src/hooks/useApi';
import AddressCard from '../src/components/AddressCard';
import { SkeletonBox } from '../src/components/Skeleton';
import { Address } from '../src/types';
import EmptyState from '../src/components/EmptyState';

const STEPS = ['Address', 'Delivery', 'Payment', 'Order'];

export default function CheckoutScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { items, total, clear } = useCartStore();
  const { data: addresses, isLoading: loadingAddresses } = useAddresses(userId);
  const createOrder = useCreateOrder();

  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | ''>('');

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Text style={s.pageTitle}>Checkout</Text>
        <EmptyState
          icon="shopping-cart"
          title="Your cart is empty"
          subtitle="Add products to your cart before checking out."
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)/home')}
        />
      </SafeAreaView>
    );
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !paymentMethod || !userId) return;
    try {
      await createOrder.mutateAsync({
        userId,
        cartItems: items,
        totalPrice: total(),
        shippingAddress: selectedAddress,
        paymentMethod,
      });
      clear();
      router.replace('/order-success');
    } catch {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step indicator */}
      <View style={s.stepper}>
        {STEPS.map((label, i) => (
          <View key={label} style={s.stepItem}>
            <View style={[s.stepDot, i < step && s.stepDone, i === step && s.stepActive]}>
              <Text style={[s.stepNum, i === step && s.stepNumActive]}>
                {i < step ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>

        {/* Step 0 — Address */}
        {step === 0 && (
          <View>
            <Text style={s.stepTitle}>Select Delivery Address</Text>
            {loadingAddresses ? (
              // skeleton placeholders while addresses load
              [1, 2].map((n) => (
                <View key={n} style={s.skeletonCard}>
                  <SkeletonBox height={14} width="40%" />
                  <SkeletonBox height={11} style={{ marginTop: 8 }} />
                  <SkeletonBox height={11} style={{ marginTop: 4 }} width="70%" />
                </View>
              ))
            ) : (
              addresses?.map((addr) => (
                <AddressCard
                  key={addr._id}
                  item={addr}
                  selected={selectedAddress?._id === addr._id}
                  onSelect={() => setSelectedAddress(addr)}
                />
              ))
            )}

            <Pressable onPress={() => router.push('/address/add')} style={s.addAddrBtn}>
              <Text style={s.addAddrTxt}>+ Add New Address</Text>
            </Pressable>

            {selectedAddress && (
              <Pressable onPress={() => setStep(1)} style={s.primaryBtn}>
                <Text style={s.primaryBtnTxt}>Deliver to this Address</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Step 1 — Delivery */}
        {step === 1 && (
          <View>
            <Text style={s.stepTitle}>Choose Delivery Option</Text>
            <View style={s.optionRow}>
              <FontAwesome5 name="dot-circle" size={18} color="#00CED1" />
              <Text style={s.optionTxt}>
                <Text style={s.greenTxt}>Tomorrow by 10 PM</Text>
                {' '}— FREE with Prime
              </Text>
            </View>
            <Pressable onPress={() => setStep(2)} style={s.yellowBtn}>
              <Text style={s.yellowBtnTxt}>Continue</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <View>
            <Text style={s.stepTitle}>Select Payment Method</Text>
            {(['cash', 'card'] as const).map((method) => (
              <Pressable
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={[s.optionRow, s.optionCard, paymentMethod === method && s.optionCardSelected]}
              >
                {paymentMethod === method
                  ? <FontAwesome5 name="dot-circle" size={18} color="#00CED1" />
                  : <Entypo name="circle" size={18} color="#9CA3AF" />}
                <Text style={s.optionTxt}>
                  {method === 'cash' ? 'Cash on Delivery' : 'UPI / Credit or Debit Card'}
                </Text>
              </Pressable>
            ))}
            {paymentMethod !== '' && (
              <Pressable onPress={() => setStep(3)} style={s.yellowBtn}>
                <Text style={s.yellowBtnTxt}>Continue</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Step 3 — Order summary */}
        {step === 3 && (
          <View>
            <Text style={s.stepTitle}>Order Summary</Text>

            <View style={s.summaryCard}>
              <Text style={s.summaryShipTo}>Shipping to {selectedAddress?.name}</Text>
              {[
                { label: 'Items', value: `₹${total().toFixed(2)}` },
                { label: 'Delivery', value: 'FREE' },
              ].map((row) => (
                <View key={row.label} style={s.summaryRow}>
                  <Text style={s.summaryLabel}>{row.label}</Text>
                  <Text style={s.summaryValue}>{row.value}</Text>
                </View>
              ))}
              <View style={[s.summaryRow, s.summaryTotalRow]}>
                <Text style={s.summaryTotalLabel}>Order Total</Text>
                <Text style={s.summaryTotalValue}>₹{total().toFixed(2)}</Text>
              </View>
            </View>

            <View style={s.payCard}>
              <Text style={s.payLabel}>Pay with</Text>
              <Text style={s.payValue}>
                {paymentMethod === 'cash' ? 'Cash on Delivery' : 'UPI / Card'}
              </Text>
            </View>

            <Pressable
              onPress={handlePlaceOrder}
              disabled={createOrder.isPending}
              style={[s.yellowBtn, createOrder.isPending && s.btnDisabled]}
            >
              <Text style={s.yellowBtnTxt}>
                {createOrder.isPending ? 'Placing Order…' : 'Place Order'}
              </Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#111' },
  iconBtn: { padding: 4 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#F9FAFB' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1D5DB' },
  stepDone: { backgroundColor: '#16A34A' },
  stepActive: { backgroundColor: '#131921' },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepNumActive: { color: '#FF9900' },
  stepLabel: { fontSize: 10, marginTop: 3, color: '#9CA3AF' },
  stepLabelActive: { color: '#111', fontWeight: '700' },
  body: { padding: 16 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 14 },
  skeletonCard: { borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 14, marginBottom: 12 },
  addAddrBtn: { borderWidth: 1, borderColor: '#00CED1', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  addAddrTxt: { color: '#00CED1', fontWeight: '600', fontSize: 14 },
  primaryBtn: { backgroundColor: '#00CED1', borderRadius: 24, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionCard: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#fff' },
  optionCardSelected: { borderColor: '#00CED1', backgroundColor: '#F0FDFA' },
  optionTxt: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  greenTxt: { color: '#16A34A', fontWeight: '600' },
  yellowBtn: { backgroundColor: '#FFC72C', borderRadius: 24, padding: 14, alignItems: 'center', marginTop: 12 },
  yellowBtnTxt: { fontWeight: '700', color: '#111', fontSize: 15 },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  summaryCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 10 },
  summaryShipTo: { fontWeight: '700', fontSize: 14, color: '#111', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  summaryTotalRow: { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '800', color: '#111' },
  summaryTotalValue: { fontSize: 16, fontWeight: '900', color: '#C60C30' },
  payCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 4 },
  payLabel: { fontSize: 13, color: '#6B7280' },
  payValue: { fontWeight: '700', fontSize: 14, color: '#111', marginTop: 4 },
});
