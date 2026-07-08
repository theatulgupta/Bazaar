import { useRef, useEffect, useState } from 'react';
import { ScrollView, Image, View, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

interface Props { images: string[] }

export default function BannerCarousel({ images }: Props) {
  const ref = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (current + 1) % images.length;
      ref.current?.scrollTo({ x: next * width, animated: true });
      setCurrent(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [current, images.length]);

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width, height: 180 }} resizeMode="cover" />
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={s.dots}>
        {images.map((_, i) => (
          <View key={i} style={[s.dot, i === current ? s.dotActive : s.dotInactive]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 16, backgroundColor: '#FF9900' },
  dotInactive: { width: 6, backgroundColor: '#D1D5DB' },
});
