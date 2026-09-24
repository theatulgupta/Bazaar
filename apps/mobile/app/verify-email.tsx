import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TopBar } from '../src/components/ui';
import { api, ApiError } from '../src/lib/api';
import { useSessionValue, sessionStore } from '../src/store/session';

export default function VerifyEmailScreen() {
  const { token: linkToken } = useLocalSearchParams<{ token?: string }>();
  const session = useSessionValue();
  const [message, setMessage] = useState(linkToken ? 'Checking the link...' : 'We will email you a verification link.');

  useEffect(() => {
    if (!linkToken) return;
    api('/api/v1/auth/verify?token=' + encodeURIComponent(linkToken))
      .then(async () => {
        setMessage('Email verified. You can check out.');
        if (session) {
          const user = await api<typeof session.user>('/api/v1/me', { token: session.accessToken });
          await sessionStore.actions.setSession({ ...session, user });
        }
      })
      .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : 'This link is invalid or already used'));
  }, [linkToken, session]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Verify email" />
      <View className="gap-3 px-4">
        <Text className="font-sans text-base leading-6 text-ink">{message}</Text>
        {session ? (
          <Button
            label="Resend link"
            onPress={() => {
              api('/api/v1/auth/resend-verification', { method: 'POST', token: session.accessToken })
                .then(() => setMessage('A new link is on its way. Check the API logs if SMTP is not configured.'))
                .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : 'Could not resend'));
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
