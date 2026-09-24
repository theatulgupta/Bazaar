import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export function discountPercent(pricePaise: number, mrpPaise: number) {
  if (mrpPaise <= pricePaise) return 0;
  return Math.round((1 - pricePaise / mrpPaise) * 100);
}

export function TopBar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between bg-canvas px-4 pb-2 pt-1">
      <Text className="font-display text-3xl text-ink">{title}</Text>
      {action}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'ghost';
}) {
  const toneClass =
    tone === 'secondary' ? 'bg-sand' : tone === 'ghost' ? 'bg-transparent' : 'bg-primary';
  const textClass = tone === 'primary' ? 'text-onPrimary' : 'text-ink';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-lg px-4 py-3.5 ${toneClass} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`font-sans text-base font-semibold ${textClass}`}>{label}</Text>
    </Pressable>
  );
}

export function Price({ paise, strike = false }: { paise: number; strike?: boolean }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
  return (
    <Text className={strike ? 'font-sans text-sm text-muted line-through' : 'font-sans text-lg font-semibold text-ink'}>
      {formatted}
    </Text>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-accent px-2 py-0.5">
      <Text className="font-sans text-xs font-semibold text-ink">{label}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const good = status === 'delivered' || status === 'paid' || status === 'confirmed';
  const bad = status === 'cancelled' || status === 'payment_failed';
  return (
    <View className="self-start rounded-full bg-sand px-3 py-1">
      <Text className={`font-sans text-xs font-semibold capitalize ${good ? 'text-success' : bad ? 'text-danger' : 'text-ink'}`}>
        {status.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View className="mb-3 mt-6">
      <Text className="font-display text-2xl text-ink">{title}</Text>
      {caption ? <Text className="mt-1 font-sans text-sm text-muted">{caption}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  placeholder?: string;
}) {
  return (
    <View>
      <Text className="mb-1 font-sans text-sm text-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        placeholder={placeholder ?? label}
        placeholderTextColor="#7A6A60"
        className="rounded-lg border border-line bg-sand px-3 py-3 font-sans text-base text-ink"
      />
      {error ? <Text className="mt-1 font-sans text-sm text-danger">{error}</Text> : null}
    </View>
  );
}

export function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <View className="flex-row items-center rounded-full bg-sand">
      <Pressable onPress={() => onChange(quantity - 1)} className="h-9 w-9 items-center justify-center">
        <Text className="font-sans text-lg text-ink">−</Text>
      </Pressable>
      <Text className="min-w-[20px] text-center font-sans text-ink">{quantity}</Text>
      <Pressable onPress={() => onChange(quantity + 1)} className="h-9 w-9 items-center justify-center">
        <Text className="font-sans text-lg text-ink">+</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <View className="items-center rounded-lg bg-surface px-6 py-10">
      <Text className="font-display text-2xl text-ink">{title}</Text>
      <Text className="mt-2 text-center font-sans text-muted">{body}</Text>
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`rounded-lg bg-sand ${className}`} />;
}

export function LoadingMark() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <ActivityIndicator color="#C8553D" />
    </View>
  );
}
