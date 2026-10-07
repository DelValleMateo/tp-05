# Network QoS Monitor

Analizador de calidad de red móvil con mapa de cobertura personal. TP5 — Desarrollo de Aplicaciones Móviles 2026.

- `app/` — aplicación React Native (Expo SDK 57 + TypeScript), pensada para correr en **Expo Go en iPhone**.
- `backend/` — servidor Node/Express de referencia (ping, descarga, subida).

## Cómo ejecutarlo

### 1. Backend (en la PC)

```bash
cd backend
npm install
npm start          # imprime las IPs LAN, ej: http://192.168.0.15:4000
```

- Windows pide permiso de firewall la primera vez: permitir en **redes privadas**.
- Con Docker: `docker build -t qos-backend . && docker run -p 4000:4000 qos-backend`.
- Para probarlo con **datos móviles** (4G/5G), el backend debe ser alcanzable desde internet (ej. `npx localtunnel --port 4000` o `ngrok http 4000`, o desplegarlo en Render/Fly). En ese caso poné la URL pública en Ajustes.

### 2. App (iPhone con Expo Go)

```bash
cd app
npm install
npx expo start
```

Escaneá el QR con la cámara del iPhone (PC y iPhone en la misma WiFi). En la pestaña **Ajustes** poné la URL del backend (`http://<IP-de-la-PC>:4000`) y los 3 hosts de ping. Los hosts por defecto usan la IP `192.168.0.15`; si cambia, editarlos ahí o en `app/src/config.ts`.

Para la demo (2 sesiones reales): iniciá una sesión en un lugar, caminá a otro, iniciá otra; el mapa muestra ambas.

## Arquitectura

| Capa | Archivos | Detalle |
|---|---|---|
| Red nativa | `src/network.ts` | `@react-native-community/netinfo` (tipo de conexión) + `expo-cellular` (CoreTelephony: operador y generación 2G/3G/4G/5G) |
| Motor de medición | `src/measure/*` | `ping.ts` (RTT min/avg/max, jitter, pérdida), `throughput.ts` (Mbps), `quality.ts` (score 0–100), `engine.ts` (orquesta) |
| Persistencia | `src/db.ts` | `expo-sqlite`; queries por red, fecha y zona (bbox) |
| Geo | `src/geo.ts` | `expo-location`, con caché de última posición |
| Estado | `src/store.ts` | Zustand; el hilo de UI no se bloquea porque todo el I/O es asíncrono |
| Presentación | `src/screens/*` | Monitor, Mapa (heatmap), Gráficos, Historial (filtros + export), Ajustes |
| Segundo plano | `src/background.ts` | `expo-background-task` + `expo-task-manager`, notificación local si la calidad cae bajo el umbral |

## Cobertura de requisitos

| RF | Estado | Dónde |
|---|---|---|
| RF-01 tipo de red y operador | ✅ | Monitor |
| RF-02 RTT a ≥3 hosts, min/avg/max/jitter | ✅ | Monitor (detalle por host) |
| RF-03 descarga/subida en Mbps | ✅ | `throughput.ts` + backend |
| RF-04 timestamp + GPS | ✅ | `engine.ts` |
| RF-05 mapa con heatmap | ✅ (ver limitaciones) | Mapa |
| RF-06 series temporales por sesión | ✅ | Gráficos |
| RF-07 background + notificaciones | ⚠️ parcial | Ajustes (ver limitaciones) |
| RF-08 export CSV/JSON | ✅ | Historial |
| RF-09 filtros por red, fecha, zona | ✅ | Historial |

## Decisiones y limitaciones conocidas

El proyecto se desarrolló y probó **sin Mac ni cuenta Apple Developer**, por lo que corre en Expo Go. Esto obligó a desviarse del stack sugerido:

1. **Latencia por HTTP, no por sockets TCP.** `react-native-tcp-socket` requiere código nativo que Expo Go no incluye. Las sondas son peticiones `HEAD` mínimas con `cache: no-store`; se descarta la primera (handshake DNS/TCP/TLS). Mide RTT de aplicación, ligeramente mayor que un RTT TCP puro. Con un dev client o build propio, reemplazar `probeOnce` en `ping.ts` por una conexión TCP es un cambio acotado a esa función.
2. **Sin módulo nativo propio Kotlin/Swift.** Se usa `expo-cellular`, que envuelve CoreTelephony/TelephonyManager. **iOS no expone RSSI/intensidad de señal a apps de terceros** (ni con módulo propio), por eso la calidad se calcula a partir de latencia, jitter, pérdida y throughput.
3. **Heatmap con círculos.** El overlay `<Heatmap>` de `react-native-maps` solo funciona con Google Maps (no Apple Maps en iOS, y Expo Go en iOS usa Apple Maps). Cada medición se dibuja como círculo semitransparente coloreado por calidad; al superponerse se acumula la intensidad.
4. **Gráficos con `react-native-svg` propio** en lugar de victory-native (que depende de Skia, no disponible en Expo Go).
5. **Segundo plano limitado por iOS.** `expo-background-task` usa BGTaskScheduler: mínimo ~15 min, frecuencia decidida por el sistema, no corre si la app fue cerrada a la fuerza, y puede no funcionar dentro de Expo Go. La opción "sesión" (pestaña Monitor) sí muestrea con frecuencia fija mientras la app está abierta.
6. **Backend en LAN.** Con WiFi alcanza la IP local; para medir sobre datos móviles hace falta exponerlo públicamente.
7. **Persistencia en SQLite** con índices por timestamp y coordenadas, en lugar de WatermelonDB.

## Entregables pendientes (manuales)

- APK/IPA: sin cuenta paga no se puede generar IPA; el build accesible es vía Expo Go (`npx expo start`, o `npx expo start --tunnel` para compartirlo).
- Video demo (3–5 min): detección de red, medición, mapa con ≥2 sesiones.
- Repositorio Git con commits significativos (`git init` en esta carpeta).
