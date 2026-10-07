import NetInfo from '@react-native-community/netinfo';
import * as Cellular from 'expo-cellular';
import type { Generation, NetworkInfo, NetType } from './types';

function mapGeneration(g: Cellular.CellularGeneration): Generation {
  switch (g) {
    case Cellular.CellularGeneration.CELLULAR_2G: return '2G';
    case Cellular.CellularGeneration.CELLULAR_3G: return '3G';
    case Cellular.CellularGeneration.CELLULAR_4G: return '4G';
    case Cellular.CellularGeneration.CELLULAR_5G: return '5G';
    default: return null;
  }
}

/**
 * Tipo de red activa + operador. En iOS el operador y la generación vienen de
 * CoreTelephony (vía expo-cellular); iOS NO expone RSSI a apps de terceros.
 */
export async function readNetworkInfo(): Promise<NetworkInfo> {
  const state = await NetInfo.fetch();
  const known = ['wifi', 'cellular', 'ethernet', 'none'];
  const netType: NetType = known.includes(state.type) ? (state.type as NetType) : 'unknown';

  let generation: Generation = null;
  let carrier: string | null = null;
  if (netType === 'cellular') {
    try {
      const details = state.details as { cellularGeneration?: string | null } | null;
      generation =
        (details?.cellularGeneration as Generation) ??
        mapGeneration(await Cellular.getCellularGenerationAsync());
      carrier = await Cellular.getCarrierNameAsync();
    } catch {
      /* sin SIM o no soportado */
    }
  }
  return { netType, generation, carrier, connected: !!state.isConnected };
}

export function subscribeNetwork(cb: (i: NetworkInfo) => void) {
  return NetInfo.addEventListener(() => {
    readNetworkInfo().then(cb);
  });
}
