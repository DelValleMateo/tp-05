import { insertMeasurement } from '../db';
import { getPosition } from '../geo';
import { readNetworkInfo } from '../network';
import type { Measurement, Settings } from '../types';
import { probeAll } from './ping';
import { qualityScore } from './quality';
import { testDownload, testUpload } from './throughput';

export type Phase = 'network' | 'ping' | 'download' | 'upload' | 'saving' | 'idle';
export type ProgressCb = (phase: Phase, detail?: string) => void;

function agg(values: (number | null)[], fn: (xs: number[]) => number): number | null {
  const xs = values.filter((v): v is number => v != null);
  return xs.length ? fn(xs) : null;
}

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;

/** Ejecuta una medición completa, la georreferencia y la persiste. */
export async function runMeasurement(
  settings: Settings,
  sessionId: string,
  source: Measurement['source'],
  onProgress?: ProgressCb,
): Promise<Measurement> {
  onProgress?.('network');
  const [net, pos] = await Promise.all([readNetworkInfo(), getPosition()]);

  onProgress?.('ping');
  const hosts = net.connected
    ? await probeAll(settings.hosts, settings.samples, (d, t) => onProgress?.('ping', `${d}/${t}`))
    : [];

  const rttMin = agg(hosts.map((h) => h.min), (x) => Math.min(...x));
  const rttAvg = agg(hosts.map((h) => h.avg), mean);
  const rttMax = agg(hosts.map((h) => h.max), (x) => Math.max(...x));
  const jitter = agg(hosts.map((h) => h.jitter), mean);
  const loss = hosts.length ? hosts.reduce((a, h) => a + h.loss, 0) / hosts.length : 1;

  let down: number | null = null;
  let up: number | null = null;
  if (net.connected && settings.runThroughput) {
    const base = rttMin ?? 0;
    try {
      onProgress?.('download');
      down = await testDownload(settings.backendUrl, settings.downloadBytes, base);
    } catch {
      /* backend inaccesible */
    }
    try {
      onProgress?.('upload');
      up = await testUpload(settings.backendUrl, settings.uploadBytes, base);
    } catch {
      /* backend inaccesible */
    }
  }

  onProgress?.('saving');
  const partial: Omit<Measurement, 'id'> = {
    sessionId,
    ts: Date.now(),
    lat: pos?.lat ?? null,
    lon: pos?.lon ?? null,
    netType: net.netType,
    generation: net.generation,
    carrier: net.carrier,
    rttMin,
    rttAvg,
    rttMax,
    jitter,
    loss,
    down,
    up,
    quality: qualityScore({ rttAvg, jitter, loss, down }),
    source,
    hosts,
  };
  const id = await insertMeasurement(partial);
  onProgress?.('idle');
  return { ...partial, id };
}
