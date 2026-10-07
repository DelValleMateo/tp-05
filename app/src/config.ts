import type { Settings } from './types';

// Cambiar por la IP LAN de la PC donde corre el backend (ver README).
export const DEFAULT_SETTINGS: Settings = {
  backendUrl: 'http://192.168.0.15:4000',
  hosts: [
    'http://192.168.0.15:4000/ping',
    'https://www.google.com/generate_204',
    'https://cloudflare.com/cdn-cgi/trace',
  ],
  samples: 6,
  intervalSec: 30,
  downloadBytes: 5 * 1024 * 1024,
  uploadBytes: 1024 * 1024,
  alertQuality: 35,
  runThroughput: true,
};

export const BACKGROUND_TASK = 'qos-background-sample';
