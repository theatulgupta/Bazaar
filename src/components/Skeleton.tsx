import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Single animated shimmer block
export function SkeletonBox({ width = '100%', height = 16, borderRadius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]}
    />
  );
}

// Skeleton for a product card in the grid
export function ProductCardSkeleton() {
  return (
    <View style={s.card}>
      <SkeletonBox height={130} borderRadius={8} />
      <SkeletonBox height={10} style={{ marginTop: 10, width: '50%' }} />
      <SkeletonBox height={12} style={{ marginTop: 6 }} />
      <SkeletonBox height={12} style={{ marginTop: 4, width: '70%' }} />
      <SkeletonBox height={30} borderRadius={20} style={{ marginTop: 10 }} />
    </View>
  );
}

// Grid of skeleton cards
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </View>
  );
}

// Skeleton for a horizontal order card in profile
export function OrderCardSkeleton() {
  return (
    <View style={s.orderCard}>
      <SkeletonBox height={90} borderRadius={8} />
      <SkeletonBox height={10} style={{ marginTop: 8 }} />
      <SkeletonBox height={10} style={{ marginTop: 4, width: '60%' }} />
      <SkeletonBox height={16} borderRadius={4} style={{ marginTop: 6, width: '40%' }} />
    </View>
  );
}

// Row of order card skeletons
export function OrdersRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={s.ordersRow}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, margin: '1%', padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 },
  orderCard: { width: 160, borderRadius: 12, padding: 10, marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#fff' },
  ordersRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12 },
});
