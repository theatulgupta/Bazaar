import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';
import { Address } from '../types';

interface Props {
  item: Address;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export default function AddressCard({ item, selected, onSelect, onDelete }: Props) {
  return (
    <View style={[s.card, selected && s.cardSelected]}>
      <View style={s.headerRow}>
        <View style={s.nameRow}>
          {onSelect && (
            <Pressable onPress={onSelect}>
              {selected
                ? <FontAwesome5 name="dot-circle" size={18} color="#00CED1" />
                : <Entypo name="circle" size={18} color="#9CA3AF" />}
            </Pressable>
          )}
          <Text style={s.name}>{item.name}</Text>
        </View>
        <Entypo name="location-pin" size={18} color="#EF4444" />
      </View>

      <Text style={s.line}>{item.houseNo}, {item.landmark}</Text>
      <Text style={s.line}>{item.street}</Text>
      <Text style={s.line}>{item.city}, {item.state} - {item.pincode}</Text>
      <Text style={s.line}>📞 {item.mobile}</Text>

      {onDelete && (
        <Pressable onPress={onDelete} style={s.deleteBtn}>
          <Text style={s.deleteTxt}>Remove</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 12, backgroundColor: '#fff' },
  cardSelected: { borderColor: '#00CED1', backgroundColor: '#F0FDFA' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: '700', fontSize: 15, color: '#111' },
  line: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-start' },
  deleteTxt: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});
