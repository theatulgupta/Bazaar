import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OrderSuccessScreen() {
  const router = useRouter();

  // Auto-redirect to home after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)/home'), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <LottieView
        source={require('../assets/json/thumbs.json')}
        style={{ width: 220, height: 220 }}
        autoPlay
        loop={false}
        speed={0.8}
      />

      <LottieView
        source={require('../assets/json/sparkle.json')}
        style={{ width: 300, height: 300, position: 'absolute' }}
        autoPlay
        loop={false}
        speed={0.7}
      />

      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', paddingHorizontal: 32, marginTop: 16 }}>
        Order placed successfully! 🎉
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
        You'll receive a confirmation shortly.
      </Text>

      <Pressable
        onPress={() => router.replace('/(tabs)/home')}
        style={{ marginTop: 32, backgroundColor: '#FFC72C', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 14 }}
      >
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#111' }}>Continue Shopping</Text>
      </Pressable>
    </SafeAreaView>
  );
}
