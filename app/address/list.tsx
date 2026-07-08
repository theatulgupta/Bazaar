import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { useAddresses, useDeleteAddress } from '../../src/hooks/useApi';
import AddressCard from '../../src/components/AddressCard';
import { SkeletonBox } from '../../src/components/Skeleton';
import EmptyState from '../../src/components/EmptyState';

export default function AddressListScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { data: addresses, isLoading } = useAddresses(userId);
  const deleteAddress = useDeleteAddress();

  const handleDelete = (addressId: string) => {
    if (!userId) return;
    deleteAddress.mutate({ userId, addressId });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Your Addresses</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>
        <Pressable onPress={() => router.push('/address/add')} style={s.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color="#00CED1" />
          <Text style={s.addBtnTxt}>Add New Address</Text>
        </Pressable>

        {isLoading ? (
          // skeleton cards while loading
          [1, 2, 3].map((n) => (
            <View key={n} style={s.skeletonCard}>
              <SkeletonBox height={14} width="40%" />
              <SkeletonBox height={11} style={{ marginTop: 8 }} />
              <SkeletonBox height={11} style={{ marginTop: 4 }} width="80%" />
              <SkeletonBox height={11} style={{ marginTop: 4 }} width="60%" />
            </View>
          ))
        ) : addresses && addresses.length > 0 ? (
          addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              item={addr}
              onDelete={() => addr._id && handleDelete(addr._id)}
            />
          ))
        ) : (
          <EmptyState
            icon="map-pin"
            title="No addresses saved"
            subtitle="Add a delivery address to get started."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#111' },
  iconBtn: { padding: 4 },
  body: { padding: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#00CED1', borderRadius: 10, padding: 14, marginBottom: 16 },
  addBtnTxt: { color: '#00CED1', fontWeight: '600', fontSize: 14 },
  skeletonCard: { borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 14, marginBottom: 12 },
});
