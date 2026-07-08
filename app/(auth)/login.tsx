import { View, Text, Image, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import FormInput from '../../src/components/FormInput';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/users/login', data);
      await setToken(res.data.data.token);
    } catch (e: any) {
      Alert.alert('Login Failed', e?.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.container}>
            <Image
              source={{ uri: 'https://assets.stickpng.com/thumbs/6160562276000b00045a7d97.png' }}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.heading}>Welcome back</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} error={errors.email?.message} />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormInput label="Password" placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
              )}
            />

            <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting} style={[s.btn, isSubmitting && s.btnDisabled]}>
              <Text style={s.btnTxt}>{isSubmitting ? 'Signing in…' : 'Sign In'}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/register')} style={s.linkRow}>
              <Text style={s.linkTxt}>New to Amazon? <Text style={s.link}>Create account</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  logo: { width: 144, height: 80, alignSelf: 'center' },
  heading: { fontSize: 28, fontWeight: '900', color: '#131921', marginTop: 24, marginBottom: 28 },
  btn: { backgroundColor: '#FFC72C', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnTxt: { fontWeight: '700', fontSize: 15, color: '#111' },
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  link: { color: '#0066B2', fontWeight: '600' },
});
