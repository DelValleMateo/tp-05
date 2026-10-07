import * as Location from 'expo-location';

export async function ensureLocationPermission(): Promise<boolean> {
  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.granted) return true;
  const req = await Location.requestForegroundPermissionsAsync();
  return req.granted;
}

/** Última ubicación conocida si es reciente (cache), si no una lectura nueva. */
export async function getPosition(): Promise<{ lat: number; lon: number } | null> {
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 30_000, requiredAccuracy: 100 });
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null;
  }
}
