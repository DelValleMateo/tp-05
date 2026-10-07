import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from '../components/LineChart';
import { Card, Chip, Title, theme } from '../components/ui';
import { useStore } from '../store';

export function ChartsScreen() {
  const measurements = useStore((s) => s.measurements);
  const [sel, setSel] = useState<string | null>(null);

  const sessions = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of measurements) map.set(m.sessionId, Math.max(map.get(m.sessionId) ?? 0, m.ts));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [measurements]);

  const current = sel && sessions.includes(sel) ? sel : sessions[0];
  const data = useMemo(
    () => measurements.filter((m) => m.sessionId === current).sort((a, b) => a.ts - b.ts),
    [measurements, current],
  );

  const label = (id: string) => (id.startsWith('s-') ? `Sesión ${id.slice(2, 16).replace('T', ' ')}` : id);

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Title>Sesión</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sessions.map((id) => (
          <Chip key={id} label={label(id)} active={id === current} onPress={() => setSel(id)} />
        ))}
      </ScrollView>
      {data.length === 0 ? (
        <Text style={styles.empty}>Sin mediciones. Hacé una desde la pestaña Monitor.</Text>
      ) : (
        <Card>
          <LineChart title="Latencia promedio" unit="ms" data={data.map((m) => m.rttAvg)} color="#3B82F6" />
          <LineChart title="Jitter" unit="ms" data={data.map((m) => m.jitter)} color="#a78bfa" />
          <LineChart title="Descarga" unit="Mbps" data={data.map((m) => m.down)} color="#22c55e" />
          <LineChart title="Subida" unit="Mbps" data={data.map((m) => m.up)} color="#f59e0b" />
          <Text style={styles.empty}>{data.length} mediciones en la sesión</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  empty: { color: theme.muted, textAlign: 'center', marginTop: 12 },
});
