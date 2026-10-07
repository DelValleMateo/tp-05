import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { BACKGROUND_TASK } from './config';
import { loadSettings } from './db';
import { runMeasurement } from './measure/engine';
import { notifyDegradation } from './notify';

// Debe definirse a nivel de módulo (se importa desde index.ts).
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const settings = await loadSettings();
    const m = await runMeasurement(settings, `bg-${new Date().toISOString().slice(0, 10)}`, 'background');
    await notifyDegradation(m, settings.alertQuality);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function setBackgroundSampling(enabled: boolean): Promise<string> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return 'Segundo plano restringido por el sistema (¿Ahorro de batería o Expo Go?).';
    }
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (enabled && !registered) {
      // iOS decide la frecuencia real; el mínimo es de 15 minutos.
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, { minimumInterval: 15 });
    } else if (!enabled && registered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK);
    }
    return enabled ? 'Muestreo en segundo plano activado (mín. 15 min, lo decide iOS).' : 'Muestreo en segundo plano desactivado.';
  } catch (e) {
    return `No disponible en este entorno: ${(e as Error).message}`;
  }
}

export async function isBackgroundEnabled(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
  } catch {
    return false;
  }
}
