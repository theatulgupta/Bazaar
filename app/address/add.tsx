import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { useAddAddress } from '../../src/hooks/useApi';
import FormInput from '../../src/components/FormInput';

const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  mobile: z.string().length(10, 'Enter a valid 10-digit number'),
  houseNo: z.string().min(1, 'Required'),
  street: z.string().min(1, 'Required'),
  landmark: z.string().min(1, 'Required'),
  pincode: z.string().length(6, 'Enter a valid 6-digit pincode'),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

const FIELDS: { name: keyof FormData; label: string; placeholder?: string; keyboard?: any }[] = [
  { name: 'name', label: 'Full Name' },
  { name: 'mobile', label: 'Mobile Number', placeholder: '10-digit number', keyboard: 'numeric' },
  { name: 'houseNo', label: 'Flat / House No. / Building' },
  { name: 'street', label: 'Area / Street / Sector' },
  { name: 'landmark', label: 'Landmark', placeholder: 'e.g. near Apollo Hospital' },
  { name: 'pincode', label: 'Pincode', placeholder: '6-digit pincode', keyboard: 'numeric' },
  { name: 'city', label: 'Town / City' },
  { name: 'state', label: 'State' },
];

export default function AddAddressScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const addAddress = useAddAddress();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!userId) return;
    try {
      // mutation already invalidates ['addresses', userId] via onSuccess in useAddAddress
      await addAddress.mutateAsync({ userId, address: data });
      Alert.alert('Success', 'Address added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add address. Please try again.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Add New Address</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        {FIELDS.map((f) => (
          <Controller
            key={f.name}
            control={control}
            name={f.name}
            render={({ field: { onChange, value } }) => (
              <FormInput
                label={f.label}
                placeholder={f.placeholder}
                keyboardType={f.keyboard ?? 'default'}
                value={value}
                onChangeText={onChange}
                error={errors[f.name]?.message}
              />
            )}
          />
        ))}

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
        >
          <Text style={s.submitBtnTxt}>
            {isSubmitting ? 'Saving…' : 'Add Address'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#111' },
  form: { padding: 16, paddingBottom: 40 },
  submitBtn: { backgroundColor: '#FFC72C', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitBtnTxt: { fontWeight: '700', fontSize: 15, color: '#111' },
});
