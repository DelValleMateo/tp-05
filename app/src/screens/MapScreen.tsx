import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Chip, theme } from '../components/ui';
import { qualityColor } from '../measure/quality';
import { useStore } from '../store';

export function MapScreen() {
  const measurements = useStore((s) => s.measurements);
  const [netFilter, setNetFilter] = useState<string | null>(null);
  const [markers, setMarkers] = useState(false);

  const geo = useMemo(
    () => measurements.filter((m) => m.lat != null && m.lon != null && (!netFilter || m.netType === netFilter)),
    [measurements, netFilter],
  );

  // La región inicial depende de la última medición con ubicación, no del filtro,
  // para que filtrar sin resultados no aleje el mapa.
  const anchor = measurements.find((m) => m.lat != null && m.lon != null);
  const region: Region | undefined = anchor
    ? { latitude: anchor.lat!, longitude: anchor.lon!, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : undefined;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.bar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="Todas" active={!netFilter} onPress={() => setNetFilter(null)} />
          <Chip label="WiFi" active={netFilter === 'wifi'} onPress={() => setNetFilter('wifi')} />
          <Chip label="Celular" active={netFilter === 'cellular'} onPress={() => setNetFilter('cellular')} />
          <Chip label="Marcadores" active={markers} onPress={() => setMarkers((v) => !v)} />
        </ScrollView>
      </View>

      <MapView style={{ flex: 1 }} showsUserLocation initialRegion={region} key={region ? 'r' : 'n'}>
        {/*
          Heatmap: cada medición es un círculo semitransparente coloreado por calidad;
          al superponerse se acumula la intensidad. (El overlay <Heatmap> nativo de
          react-native-maps solo existe con Google Maps, no con Apple Maps en iOS.)
        */}
        {geo.map((m) => (
          <Circle
            key={`c${m.id}`}
            center={{ latitude: m.lat!, longitude: m.lon! }}
            radius={45}
            fillColor={qualityColor(m.quality) + '55'}
            strokeColor={qualityColor(m.quality) + '99'}
            strokeWidth={1}
          />
        ))}
        {markers &&
          geo.slice(0, 60).map((m) => (
            <Marker
              key={`m${m.id}`}
              coordinate={{ latitude: m.lat!, longitude: m.lon! }}
              pinColor={qualityColor(m.quality)}
              title={`Calidad ${m.quality}/100`}
              description={`${m.rttAvg != null ? Math.round(m.rttAvg) : '—'} ms · ${m.down != null ? m.down.toFixed(1) : '—'} Mbps · ${new Date(m.ts).toLocaleString()}`}
            />
          ))}
      </MapView>

      <View style={styles.legend}>
        {[['Buena', 80], ['Aceptable', 60], ['Pobre', 40], ['Crítica', 10]].map(([l, q]) => (
          <View key={l as string} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: qualityColor(q as number) }]} />
            <Text style={styles.legendText}>{l}</Text>
          </View>
        ))}
        <Text style={styles.legendText}>· {geo.length} puntos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 12, paddingTop: 10, backgroundColor: theme.bg },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: theme.card, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: theme.muted, fontSize: 12 },
});
