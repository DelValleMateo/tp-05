import * as SQLite from 'expo-sqlite';
import { DEFAULT_SETTINGS } from './config';
import type { Measurement, Settings } from './types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('qos.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          ts INTEGER NOT NULL,
          lat REAL, lon REAL,
          net_type TEXT NOT NULL,
          generation TEXT,
          carrier TEXT,
          rtt_min REAL, rtt_avg REAL, rtt_max REAL,
          jitter REAL,
          loss REAL NOT NULL DEFAULT 0,
          down REAL, up REAL,
          quality INTEGER NOT NULL,
          source TEXT NOT NULL,
          hosts TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_m_ts ON measurements(ts);
        CREATE INDEX IF NOT EXISTS idx_m_geo ON measurements(lat, lon);
        CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
      return db;
    })();
  }
  return dbPromise;
}

type Row = Record<string, any>;

function fromRow(r: Row): Measurement {
  return {
    id: r.id,
    sessionId: r.session_id,
    ts: r.ts,
    lat: r.lat,
    lon: r.lon,
    netType: r.net_type,
    generation: r.generation,
    carrier: r.carrier,
    rttMin: r.rtt_min,
    rttAvg: r.rtt_avg,
    rttMax: r.rtt_max,
    jitter: r.jitter,
    loss: r.loss,
    down: r.down,
    up: r.up,
    quality: r.quality,
    source: r.source,
    hosts: JSON.parse(r.hosts),
  };
}

export async function insertMeasurement(m: Omit<Measurement, 'id'>): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO measurements (session_id, ts, lat, lon, net_type, generation, carrier,
      rtt_min, rtt_avg, rtt_max, jitter, loss, down, up, quality, source, hosts)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    m.sessionId, m.ts, m.lat, m.lon, m.netType, m.generation, m.carrier,
    m.rttMin, m.rttAvg, m.rttMax, m.jitter, m.loss, m.down, m.up, m.quality,
    m.source, JSON.stringify(m.hosts),
  );
  return res.lastInsertRowId;
}

export interface Filter {
  netType?: string | null;
  from?: number | null;
  to?: number | null;
  /** Zona geográfica: caja [minLat, minLon, maxLat, maxLon] */
  bbox?: [number, number, number, number] | null;
  sessionId?: string | null;
}

export async function queryMeasurements(f: Filter = {}, limit = 5000): Promise<Measurement[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.netType) { where.push('net_type = ?'); args.push(f.netType); }
  if (f.from != null) { where.push('ts >= ?'); args.push(f.from); }
  if (f.to != null) { where.push('ts <= ?'); args.push(f.to); }
  if (f.sessionId) { where.push('session_id = ?'); args.push(f.sessionId); }
  if (f.bbox) {
    where.push('lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?');
    args.push(f.bbox[0], f.bbox[2], f.bbox[1], f.bbox[3]);
  }
  const sql = `SELECT * FROM measurements ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY ts DESC LIMIT ${limit}`;
  const rows = await db.getAllAsync<Row>(sql, ...args);
  return rows.map(fromRow);
}

export async function clearMeasurements() {
  const db = await getDb();
  await db.runAsync('DELETE FROM measurements');
}

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM kv WHERE key='settings'");
  return row ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) } : DEFAULT_SETTINGS;
}

export async function saveSettings(s: Settings) {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES ('settings', ?)", JSON.stringify(s));
}
