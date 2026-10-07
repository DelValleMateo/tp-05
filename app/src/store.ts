import { create } from 'zustand';
import { DEFAULT_SETTINGS } from './config';
import { loadSettings, queryMeasurements, saveSettings } from './db';
import { ensureLocationPermission } from './geo';
import { Phase, runMeasurement } from './measure/engine';
import { readNetworkInfo, subscribeNetwork } from './network';
import { ensureNotificationPermission, notifyDegradation } from './notify';
import type { Measurement, NetworkInfo, Settings } from './types';

interface State {
  ready: boolean;
  settings: Settings;
  network: NetworkInfo | null;
  measurements: Measurement[];
  phase: Phase;
  phaseDetail?: string;
  error: string | null;
  sessionId: string | null;
  sessionRunning: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  updateSettings: (s: Settings) => Promise<void>;
  measureOnce: () => Promise<void>;
  startSession: () => void;
  stopSession: () => void;
}

// Las mediciones manuales de cada apertura de la app forman una sesión propia.
const launchSessionId = `s-${new Date().toISOString().replace(/[:.]/g, '-')}`;

let timer: ReturnType<typeof setTimeout> | null = null;
let busy = false;

export const useStore = create<State>((set, get) => {
  const runOne = async (source: Measurement['source']) => {
    if (busy) return;
    busy = true;
    set({ error: null });
    try {
      const { settings } = get();
      const sid = get().sessionRunning && get().sessionId ? get().sessionId! : launchSessionId;
      const m = await runMeasurement(settings, sid, source, (phase, phaseDetail) =>
        set({ phase, phaseDetail }),
      );
      await notifyDegradation(m, settings.alertQuality);
      await get().refresh();
    } catch (e) {
      set({ error: (e as Error).message, phase: 'idle' });
    } finally {
      busy = false;
      set({ phase: 'idle', phaseDetail: undefined });
    }
  };

  const loop = async () => {
    if (!get().sessionRunning) return;
    await runOne('session');
    if (get().sessionRunning) {
      timer = setTimeout(loop, get().settings.intervalSec * 1000);
    }
  };

  return {
    ready: false,
    settings: DEFAULT_SETTINGS,
    network: null,
    measurements: [],
    phase: 'idle',
    error: null,
    sessionId: null,
    sessionRunning: false,

    init: async () => {
      const settings = await loadSettings();
      set({ settings });
      await ensureLocationPermission();
      await ensureNotificationPermission();
      set({ network: await readNetworkInfo() });
      subscribeNetwork((network) => set({ network }));
      await get().refresh();
      set({ ready: true });
    },

    refresh: async () => {
      set({ measurements: await queryMeasurements({}, 2000) });
    },

    updateSettings: async (settings) => {
      await saveSettings(settings);
      set({ settings });
    },

    measureOnce: async () => {
      await runOne('manual');
    },

    startSession: () => {
      if (get().sessionRunning) return;
      set({ sessionId: `s-${new Date().toISOString().replace(/[:.]/g, '-')}`, sessionRunning: true });
      loop();
    },

    stopSession: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      set({ sessionRunning: false });
    },
  };
});
