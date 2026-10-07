import * as Notifications from 'expo-notifications';
import type { Measurement } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Notificación local ante una degradación severa de la calidad. */
export async function notifyDegradation(m: Measurement, threshold: number) {
  if (m.quality >= threshold) return;
  try {
    const rtt = m.rttAvg != null ? `${Math.round(m.rttAvg)} ms` : 'sin respuesta';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Degradación de red detectada',
        body: `Calidad ${m.quality}/100 · latencia ${rtt} · pérdida ${Math.round(m.loss * 100)}%`,
      },
      trigger: null,
    });
  } catch {
    /* sin permiso */
  }
}
