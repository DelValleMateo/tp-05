function clamp(n: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, n));
}

/** Puntaje 0..100 combinando latencia, jitter, pérdida y throughput de bajada. */
export function qualityScore(m: {
  rttAvg: number | null;
  jitter: number | null;
  loss: number;
  down: number | null;
}): number {
  if (m.rttAvg == null) return 0;
  const lat = 1 - clamp((m.rttAvg - 20) / 380); // 20ms=1 .. 400ms=0
  const jit = 1 - clamp((m.jitter ?? 0) / 100);
  const loss = 1 - clamp(m.loss / 0.2);
  const dl = m.down == null ? 0.6 : clamp(m.down / 25); // 25 Mbps = 1
  return Math.round(100 * (0.4 * lat + 0.15 * jit + 0.25 * loss + 0.2 * dl));
}

export function qualityColor(q: number): string {
  if (q >= 70) return '#22c55e';
  if (q >= 50) return '#eab308';
  if (q >= 30) return '#f97316';
  return '#ef4444';
}

export function qualityLabel(q: number): string {
  if (q >= 70) return 'Buena';
  if (q >= 50) return 'Aceptable';
  if (q >= 30) return 'Pobre';
  return 'Crítica';
}
