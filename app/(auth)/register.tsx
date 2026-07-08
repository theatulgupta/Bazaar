import { View, Text, Image, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/lib/api';
import FormInput from '../../src/components/FormInput';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const FIELDS: { name: keyof FormData; label: string; placeholder?: string; secure?: boolean; keyboard?: any; capitalize?: any }[] = [
  { name: 'name', label: 'Full Name', capitalize: 'words' },
  { name: 'email', label: 'Email address', placeholder: 'you@example.com', keyboard: 'email-address' },
  { name: 'password', label: 'Password', placeholder: '••••••••', secure: true },
  { name: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', secure: true },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ name, email, password }: FormData) => {
    try {
      await api.post('/users/register', { name, email, password });
      Alert.alert('Account created!', 'Check your email to verify your account.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Something went wrong');
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
            <Text style={s.heading}>Create account</Text>

            {FIELDS.map((f) => (
              <Controller
                key={f.name}
                control={control}
                name={f.name}
                render={({ field: { onChange, value } }) => (
                  <FormInput
                    label={f.label}
                    placeholder={f.placeholder}
                    secureTextEntry={f.secure}
                    autoCapitalize={f.capitalize ?? 'none'}
                    keyboardType={f.keyboard ?? 'default'}
                    value={value}
                    onChangeText={onChange}
                    error={errors[f.name]?.message}
                  />
                )}
              />
            ))}

            <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting} style={[s.btn, isSubmitting && s.btnDisabled]}>
              <Text style={s.btnTxt}>{isSubmitting ? 'Creating account…' : 'Create Account'}</Text>
            </Pressable>

            <Pressable onPress={() => router.back()} style={s.linkRow}>
              <Text style={s.linkTxt}>Already have an account? <Text style={s.link}>Sign In</Text></Text>
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
  btn: { backgroundColor: '#FFC72C', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnTxt: { fontWeight: '700', fontSize: 15, color: '#111' },
  linkRow: { marginTop: 24, alignItems: 'center', marginBottom: 32 },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  link: { color: '#0066B2', fontWeight: '600' },
});
