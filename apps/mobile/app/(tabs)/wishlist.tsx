import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, Price, TopBar } from '../../src/components/ui';
import { useWishlistQuery } from '../../src/lib/queries';
import { useSessionValue } from '../../src/store/session';

export default function WishlistScreen() {
  const session = useSessionValue();
  const router = useRouter();
  const wishlist = useWishlistQuery();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Wishlist" />
      <View className="px-4">
        {!session ? (
          <EmptyState
            title="Save it for later"
            body="Sign in to keep a wishlist across devices."
            action={<Button label="Sign in" onPress={() => router.push('/(auth)/login')} />}
          />
        ) : wishlist.data?.length === 0 ? (
          <EmptyState title="Nothing saved" body="Tap the heart on a piece you want to remember." />
        ) : (
          wishlist.data?.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/product/${item.slug}`)} className="mb-3 flex-row rounded-lg bg-surface p-3">
              <View className="h-16 w-16 items-center justify-center rounded-md bg-sand">
                <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56 }} contentFit="contain" />
              </View>
              <View className="ml-3 flex-1">
                <Text numberOfLines={2} className="font-sans text-ink">
                  {item.title}
                </Text>
                <Price paise={item.pricePaise} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}
