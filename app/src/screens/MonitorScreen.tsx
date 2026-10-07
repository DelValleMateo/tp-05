import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Stat, Title, fmt, theme } from '../components/ui';
import { qualityColor, qualityLabel } from '../measure/quality';
import { useStore } from '../store';

const PHASES: Record<string, string> = {
  network: 'Detectando red y ubicación…',
  ping: 'Midiendo latencia…',
  download: 'Test de descarga…',
  upload: 'Test de subida…',
  saving: 'Guardando…',
};

export function MonitorScreen() {
  const { network, measurements, phase, phaseDetail, error, measureOnce, startSession, stopSession, sessionRunning, settings } =
    useStore();
  const last = measurements[0];
  const running = phase !== 'idle';
  const netLabel = !network
    ? '…'
    : !network.connected
      ? 'Sin conexión'
      : network.netType === 'cellular'
        ? `Celular ${network.generation ?? ''}`.trim()
        : network.netType === 'wifi' ? 'WiFi' : network.netType;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Card>
        <Title>Red activa</Title>
        <View style={styles.row}>
          <Stat label="Tipo" value={netLabel} />
          <Stat label="Operador" value={network?.carrier ?? '—'} />
        </View>
        <Text style={styles.note}>
          iOS no expone RSSI a apps de terceros: la calidad se calcula con latencia, jitter, pérdida y throughput.
        </Text>
      </Card>

      <Card>
        <Title>Última medición</Title>
        {last ? (
          <>
            <View style={styles.row}>
              <Stat label="Calidad" value={`${last.quality}`} unit={qualityLabel(last.quality)} color={qualityColor(last.quality)} />
              <Stat label="RTT prom." value={fmt(last.rttAvg)} unit="ms" />
            </View>
            <View style={[styles.row, { marginTop: 14 }]}>
              <Stat label="Mín / Máx" value={`${fmt(last.rttMin)} / ${fmt(last.rttMax)}`} unit="ms" />
              <Stat label="Jitter" value={fmt(last.jitter, 1)} unit="ms" />
            </View>
            <View style={[styles.row, { marginTop: 14 }]}>
              <Stat label="Bajada" value={fmt(last.down, 1)} unit="Mbps" />
              <Stat label="Subida" value={fmt(last.up, 1)} unit="Mbps" />
              <Stat label="Pérdida" value={fmt(last.loss * 100)} unit="%" />
            </View>
            <Text style={styles.note}>
              {new Date(last.ts).toLocaleString()} ·{' '}
              {last.lat != null ? `${last.lat.toFixed(5)}, ${last.lon!.toFixed(5)}` : 'sin ubicación'}
            </Text>
          </>
        ) : (
          <Text style={styles.note}>Todavía no hay mediciones.</Text>
        )}
      </Card>

      {last && last.hosts.length > 0 && (
        <Card>
          <Title>RTT por host</Title>
          {last.hosts.map((h) => (
            <View key={h.host} style={styles.hostRow}>
              <Text style={styles.host} numberOfLines={1}>{h.host.replace(/^https?:\/\//, '')}</Text>
              <Text style={styles.hostVal}>
                {fmt(h.min)}/{fmt(h.avg)}/{fmt(h.max)} ms · j {fmt(h.jitter, 1)} · {fmt(h.loss * 100)}%
              </Text>
            </View>
          ))}
        </Card>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      {running && <Text style={styles.note}>{PHASES[phase]} {phaseDetail ?? ''}</Text>}

      <Button label="Medir ahora" onPress={measureOnce} loading={running && !sessionRunning} disabled={running} />
      <View style={{ height: 10 }} />
      {sessionRunning ? (
        <Button label="Detener sesión" variant="danger" onPress={stopSession} />
      ) : (
        <Button label={`Iniciar sesión (cada ${settings.intervalSec}s)`} variant="ghost" onPress={startSession} disabled={running} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  note: { color: theme.muted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  error: { color: '#f87171', marginBottom: 10 },
  hostRow: { marginBottom: 8 },
  host: { color: theme.text, fontSize: 13 },
  hostVal: { color: theme.muted, fontSize: 12, marginTop: 2 },
});
