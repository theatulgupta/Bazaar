import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.container} accessible accessibilityRole="alert">
      <Feather name={icon} size={56} color="#D1D5DB" />
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={s.btn}>
          <Text style={s.btnTxt}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, backgroundColor: '#FFC72C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { fontWeight: '700', color: '#111', fontSize: 14 },
});
