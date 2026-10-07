import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

export const theme = {
  bg: '#0B1220',
  card: '#131C2E',
  border: '#22304A',
  text: '#E6EDF7',
  muted: '#8A9BB8',
  accent: '#3B82F6',
};

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, color ? { color } : null]}>
        {value}
        {unit ? <Text style={s.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function Button({
  label, onPress, loading, disabled, variant = 'primary',
}: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger';
}) {
  const bg = variant === 'primary' ? theme.accent : variant === 'danger' ? '#dc2626' : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: theme.border },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export const fmt = (n: number | null | undefined, d = 0) => (n == null ? '—' : n.toFixed(d));

const s = StyleSheet.create({
  card: { backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14, marginBottom: 12 },
  title: { color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  stat: { flex: 1, minWidth: 80 },
  statLabel: { color: theme.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 2 },
  statUnit: { color: theme.muted, fontSize: 12, fontWeight: '400' },
  btn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: theme.border, marginRight: 8, marginBottom: 8 },
  chipText: { color: theme.muted, fontSize: 13 },
});
