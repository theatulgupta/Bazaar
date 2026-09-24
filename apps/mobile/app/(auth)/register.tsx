import { registerSchema } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, TopBar } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { signIn } from '../../src/lib/auth';
import { zodIssue } from '../../src/lib/validate';

export default function RegisterScreen() {
  const router = useRouter();
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value }) => {
      await api('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(value) });
      await signIn(value.email, value.password);
      router.replace('/(tabs)/account');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Join Bazaar" />
      <View className="gap-3 px-4">
        <form.Field name="name" validators={{ onChange: zodIssue(registerSchema.shape.name) }}>
          {(field) => (
            <Field label="Name" value={field.state.value} onBlur={field.handleBlur} onChangeText={field.handleChange} error={field.state.meta.errors[0]?.toString()} />
          )}
        </form.Field>
        <form.Field name="email" validators={{ onChange: zodIssue(registerSchema.shape.email) }}>
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
        <form.Field name="password" validators={{ onChange: zodIssue(registerSchema.shape.password) }}>
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
          {(error) => (error ? <Text className="font-sans text-danger">{error instanceof Error ? error.message : 'Could not create the account'}</Text> : null)}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button label={isSubmitting ? 'Creating...' : 'Create account'} disabled={isSubmitting} onPress={() => void form.handleSubmit()} />
          )}
        </form.Subscribe>
      </View>
    </SafeAreaView>
  );
}
