export type NetType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';
export type Generation = '2G' | '3G' | '4G' | '5G' | null;

export interface HostRtt {
  host: string;
  min: number | null;
  avg: number | null;
  max: number | null;
  jitter: number | null;
  loss: number; // 0..1
}

export interface Measurement {
  id: number;
  sessionId: string;
  ts: number;
  lat: number | null;
  lon: number | null;
  netType: NetType;
  generation: Generation;
  carrier: string | null;
  rttMin: number | null;
  rttAvg: number | null;
  rttMax: number | null;
  jitter: number | null;
  loss: number;
  down: number | null; // Mbps
  up: number | null; // Mbps
  quality: number; // 0..100
  source: 'manual' | 'session' | 'background';
  hosts: HostRtt[];
}

export interface Settings {
  backendUrl: string;
  hosts: string[];
  samples: number;
  intervalSec: number;
  downloadBytes: number;
  uploadBytes: number;
  alertQuality: number;
  runThroughput: boolean;
}

export interface NetworkInfo {
  netType: NetType;
  generation: Generation;
  carrier: string | null;
  connected: boolean;
}
