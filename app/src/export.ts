import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Measurement } from './types';

const COLS = [
  'id', 'sessionId', 'timestamp', 'lat', 'lon', 'netType', 'generation', 'carrier',
  'rttMin', 'rttAvg', 'rttMax', 'jitter', 'loss', 'downMbps', 'upMbps', 'quality', 'source',
] as const;

export function toCsv(ms: Measurement[]): string {
  const esc = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = ms.map((m) =>
    [
      m.id, m.sessionId, new Date(m.ts).toISOString(), m.lat, m.lon, m.netType, m.generation, m.carrier,
      m.rttMin, m.rttAvg, m.rttMax, m.jitter, m.loss, m.down, m.up, m.quality, m.source,
    ].map(esc).join(','),
  );
  return [COLS.join(','), ...rows].join('\n');
}

export async function exportMeasurements(ms: Measurement[], format: 'csv' | 'json') {
  const name = `qos-mediciones-${Date.now()}.${format}`;
  const file = new File(Paths.cache, name);
  file.create();
  file.write(format === 'csv' ? toCsv(ms) : JSON.stringify(ms, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: format === 'csv' ? 'text/csv' : 'application/json',
      dialogTitle: 'Exportar mediciones',
    });
  }
  return file.uri;
}
