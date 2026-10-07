import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, theme } from '../components/ui';
import { Filter, clearMeasurements, queryMeasurements } from '../db';
import { exportMeasurements } from '../export';
import { getPosition } from '../geo';
import { qualityColor } from '../measure/quality';
import { useStore } from '../store';
import type { Measurement } from '../types';

const RANGES: [string, number | null][] = [['1 h', 3600e3], ['24 h', 86400e3], ['7 d', 7 * 86400e3], ['Todo', null]];

export function HistoryScreen() {
  const version = useStore((s) => s.measurements.length);
  const refresh = useStore((s) => s.refresh);
  const [netType, setNetType] = useState<string | null>(null);
  const [range, setRange] = useState<number | null>(null);
  const [zone, setZone] = useState(false);
  const [items, setItems] = useState<Measurement[]>([]);

  const load = useCallback(async () => {
    const f: Filter = { netType, from: range ? Date.now() - range : null };
    if (zone) {
      const p = await getPosition();
      if (p) {
        const d = 0.01; // ~1 km
        f.bbox = [p.lat - d, p.lon - d, p.lat + d, p.lon + d];
      }
    }
    setItems(await queryMeasurements(f));
  }, [netType, range, zone]);

  useEffect(() => { load(); }, [load, version]);

  const doExport = async (fmt: 'csv' | 'json') => {
    try {
      await exportMeasurements(items, fmt);
    } catch (e) {
      Alert.alert('No se pudo exportar', (e as Error).message);
    }
  };

  const wipe = () =>
    Alert.alert('Borrar historial', '¿Eliminar todas las mediciones?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => { await clearMeasurements(); await refresh(); } },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filters}>
        <View style={styles.chips}>
          <Chip label="Todas" active={!netType} onPress={() => setNetType(null)} />
          <Chip label="WiFi" active={netType === 'wifi'} onPress={() => setNetType('wifi')} />
          <Chip label="Celular" active={netType === 'cellular'} onPress={() => setNetType('cellular')} />
          <Chip label="Cerca de mí (1 km)" active={zone} onPress={() => setZone((z) => !z)} />
        </View>
        <View style={styles.chips}>
          {RANGES.map(([l, v]) => (
            <Chip key={l} label={l} active={range === v} onPress={() => setRange(v)} />
          ))}
        </View>
        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Button label={`CSV (${items.length})`} variant="ghost" onPress={() => doExport('csv')} disabled={!items.length} /></View>
          <View style={{ flex: 1 }}><Button label="JSON" variant="ghost" onPress={() => doExport('json')} disabled={!items.length} /></View>
          <View style={{ flex: 1 }}><Button label="Borrar" variant="danger" onPress={wipe} /></View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Sin resultados.</Text>}
        renderItem={({ item: m }) => (
          <View style={styles.item}>
            <View style={[styles.badge, { backgroundColor: qualityColor(m.quality) }]}>
              <Text style={styles.badgeText}>{m.quality}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.line1}>
                {m.netType}{m.generation ? ` ${m.generation}` : ''} · {m.rttAvg != null ? Math.round(m.rttAvg) : '—'} ms ·{' '}
                {m.down != null ? m.down.toFixed(1) : '—'}↓ {m.up != null ? m.up.toFixed(1) : '—'}↑ Mbps
              </Text>
              <Text style={styles.line2}>
                {new Date(m.ts).toLocaleString()} · {m.source}
                {m.lat != null ? ` · ${m.lat.toFixed(4)}, ${m.lon!.toFixed(4)}` : ''}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { padding: 12, borderBottomWidth: 1, borderColor: theme.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  empty: { color: theme.muted, textAlign: 'center', marginTop: 30 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '800' },
  line1: { color: theme.text, fontSize: 14 },
  line2: { color: theme.muted, fontSize: 11, marginTop: 2 },
});
