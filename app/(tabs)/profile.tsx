import { View, Text, ScrollView, Image, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { useProfile, useOrders } from '../../src/hooks/useApi';
import { OrdersRowSkeleton, SkeletonBox } from '../../src/components/Skeleton';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, logout } = useAuthStore();
  const { data: user, isLoading: loadingUser, refetch: refetchUser } = useProfile(userId);
  const { data: orders, isLoading: loadingOrders, refetch: refetchOrders } = useOrders(userId);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const onRefresh = async () => {
    await Promise.all([refetchUser(), refetchOrders()]);
  };

  const quickActions = [
    { label: 'Your Addresses', icon: 'location-on', onPress: () => router.push('/address/list') },
    { label: 'Wishlist', icon: 'favorite-border', onPress: () => router.push('/(tabs)/wishlist') },
    { label: 'Buy Again', icon: 'refresh', onPress: () => router.push('/(tabs)/home') },
    { label: 'Sign Out', icon: 'logout', onPress: handleLogout },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Image
          source={{ uri: 'https://assets.stickpng.com/thumbs/580b57fcd9996e24bc43c518.png' }}
          style={s.logo}
          resizeMode="contain"
        />
        <View style={s.headerIcons}>
          <Pressable onPress={() => router.push('/(tabs)/search')} style={s.headerIconBtn}>
            <AntDesign name="search1" size={24} color="white" />
          </Pressable>
          <Pressable style={s.headerIconBtn}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loadingUser && !user} onRefresh={onRefresh} tintColor="#FF9900" />
        }
      >
        {/* Greeting */}
        <View style={s.greetBox}>
          {loadingUser && !user ? (
            <>
              <SkeletonBox height={22} width="50%" borderRadius={6} />
              <SkeletonBox height={14} width="70%" borderRadius={6} style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              <Text style={s.greetName}>Hello, {user?.name ?? '—'}</Text>
              <Text style={s.greetEmail}>{user?.email}</Text>
              {user?.verified && (
                <View style={s.verifiedRow}>
                  <MaterialIcons name="verified" size={14} color="#16A34A" />
                  <Text style={s.verifiedTxt}>Verified account</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Quick actions */}
        <View style={s.actionsGrid}>
          {quickActions.map((btn) => (
            <Pressable key={btn.label} onPress={btn.onPress} style={s.actionBtn}>
              <MaterialIcons name={btn.icon as any} size={22} color="#374151" />
              <Text style={s.actionLabel}>{btn.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent orders */}
        <Text style={s.sectionTitle}>Recent Orders</Text>

        {loadingOrders && !orders ? (
          <OrdersRowSkeleton count={3} />
        ) : orders && orders.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.ordersScroll}>
            {orders.map((order) => (
              <Pressable
                key={order._id}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: order._id } })}
                style={s.orderCard}
              >
                {order.products[0] ? (
                  <Image source={{ uri: order.products[0].image }} style={s.orderImg} resizeMode="contain" />
                ) : (
                  <View style={s.orderImgFallback} />
                )}
                <Text numberOfLines={2} style={s.orderName}>{order.products[0]?.name}</Text>
                <Text style={s.orderTotal}>₹{order.totalPrice.toFixed(2)}</Text>
                <View style={[s.statusBadge, { backgroundColor: order.status === 'delivered' ? '#DCFCE7' : '#FEF9C3' }]}>
                  <Text style={[s.statusTxt, { color: order.status === 'delivered' ? '#16A34A' : '#92400E' }]}>
                    {order.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={s.emptyTxt}>No orders yet</Text>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#232F3E', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 100, height: 40 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { padding: 6 },
  greetBox: { padding: 16, backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderColor: '#FDE68A', minHeight: 72 },
  greetName: { fontSize: 20, fontWeight: '800', color: '#111' },
  greetEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedTxt: { fontSize: 12, color: '#16A34A' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  actionBtn: { flex: 1, minWidth: '45%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginTop: 4, color: '#111' },
  ordersScroll: { paddingHorizontal: 12, paddingVertical: 12 },
  orderCard: { width: 160, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginRight: 10, backgroundColor: '#fff' },
  orderImg: { width: '100%', height: 90 },
  orderImgFallback: { width: '100%', height: 90, borderRadius: 8, backgroundColor: '#F3F4F6' },
  orderName: { fontSize: 11, fontWeight: '700', marginTop: 6, color: '#111' },
  orderTotal: { fontSize: 12, fontWeight: '900', color: '#111', marginTop: 2 },
  statusBadge: { marginTop: 4, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  statusTxt: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  emptyTxt: { padding: 16, color: '#9CA3AF', fontSize: 14 },
});
