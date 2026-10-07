import type { HostRtt } from '../types';

const TIMEOUT_MS = 3000;

async function probeOnce(url: string): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const sep = url.includes('?') ? '&' : '?';
  const t0 = Date.now();
  try {
    // Cache-buster + no-store para medir siempre contra el servidor.
    await fetch(`${url}${sep}_=${t0}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: ctrl.signal,
    });
    return Date.now() - t0;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Jitter = media de |RTT[i] - RTT[i-1]| (RFC 3550 simplificado). */
export function computeJitter(rtts: number[]): number | null {
  if (rtts.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < rtts.length; i++) sum += Math.abs(rtts[i] - rtts[i - 1]);
  return sum / (rtts.length - 1);
}

/**
 * Sonda de latencia de aplicación sobre HTTP (tiempo de ida y vuelta de una
 * petición mínima). El primer intento se descarta: incluye DNS + TCP + TLS.
 * Para RTT sobre sockets TCP crudos ver README (requiere dev client).
 */
export async function probeHost(url: string, samples: number): Promise<HostRtt> {
  await probeOnce(url); // warm-up (conexión)
  const rtts: number[] = [];
  let lost = 0;
  for (let i = 0; i < samples; i++) {
    const r = await probeOnce(url);
    if (r == null) lost++;
    else rtts.push(r);
  }
  return {
    host: url,
    min: rtts.length ? Math.min(...rtts) : null,
    avg: rtts.length ? rtts.reduce((a, b) => a + b, 0) / rtts.length : null,
    max: rtts.length ? Math.max(...rtts) : null,
    jitter: computeJitter(rtts),
    loss: samples ? lost / samples : 0,
  };
}

export async function probeAll(
  hosts: string[],
  samples: number,
  onHost?: (done: number, total: number) => void,
): Promise<HostRtt[]> {
  const out: HostRtt[] = [];
  for (let i = 0; i < hosts.length; i++) {
    out.push(await probeHost(hosts[i], samples));
    onHost?.(i + 1, hosts.length);
  }
  return out;
}
