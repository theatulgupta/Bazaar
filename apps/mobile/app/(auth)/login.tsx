import { loginSchema } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, TopBar } from '../../src/components/ui';
import { ApiError } from '../../src/lib/api';
import { signIn } from '../../src/lib/auth';
import { zodIssue } from '../../src/lib/validate';

export default function LoginScreen() {
  const router = useRouter();
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      await signIn(value.email, value.password);
      router.replace('/(tabs)/account');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Welcome back" />
      <View className="gap-3 px-4">
        <form.Field name="email" validators={{ onChange: zodIssue(loginSchema.shape.email) }}>
          {(field) => (
            <Field
              label="Email"
              keyboardType="email-address"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={field.state.meta.errors[0]?.toString()}
            />
          )}
        </form.Field>
        <form.Field name="password" validators={{ onChange: zodIssue(loginSchema.shape.password) }}>
          {(field) => (
            <Field
              label="Password"
              secureTextEntry
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={field.state.meta.errors[0]?.toString()}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
          {(error) => (error ? <Text className="font-sans text-danger">{messageOf(error)}</Text> : null)}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button label={isSubmitting ? 'Signing in...' : 'Sign in'} disabled={isSubmitting} onPress={() => void form.handleSubmit()} />
          )}
        </form.Subscribe>
        <Button label="Create account" tone="secondary" onPress={() => router.push('/(auth)/register')} />
      </View>
    </SafeAreaView>
  );
}

function messageOf(error: unknown) {
  if (typeof error === 'string') return error;
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return 'Could not sign in';
}
