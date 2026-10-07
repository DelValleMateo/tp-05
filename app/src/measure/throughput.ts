/**
 * Test de throughput contra el backend de referencia.
 * Mbps = bytes * 8 / (tiempo - RTT base) / 1e6. Se descuenta el RTT base para
 * que el tamaño del payload no quede sesgado por la latencia de la petición.
 */
function toMbps(bytes: number, elapsedMs: number, baseRttMs: number): number | null {
  const net = Math.max(elapsedMs - baseRttMs, 1);
  const mbps = (bytes * 8) / (net / 1000) / 1e6;
  return Number.isFinite(mbps) ? mbps : null;
}

export async function testDownload(backendUrl: string, bytes: number, baseRtt: number) {
  const t0 = Date.now();
  const res = await fetch(`${backendUrl}/download?bytes=${bytes}&_=${t0}`, { cache: 'no-store' });
  const buf = await res.arrayBuffer();
  return toMbps(buf.byteLength, Date.now() - t0, baseRtt);
}

export async function testUpload(backendUrl: string, bytes: number, baseRtt: number) {
  const body = new Uint8Array(bytes);
  const t0 = Date.now();
  const res = await fetch(`${backendUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
    cache: 'no-store',
  });
  const json = (await res.json()) as { received: number };
  return toMbps(json.received, Date.now() - t0, baseRtt);
}
