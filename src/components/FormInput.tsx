import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...props }: Props) {
  return (
    <View style={s.wrapper}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, error ? s.inputError : null]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text style={s.errorTxt}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', backgroundColor: '#fff' },
  inputError: { borderColor: '#F87171' },
  errorTxt: { fontSize: 11, color: '#EF4444', marginTop: 4 },
});
