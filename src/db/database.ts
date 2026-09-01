import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'wmtracker.db';

/**
 * Schema migrations.
 *
 * Every table lives in a single SQLite file inside the app's private storage.
 * Nothing is uploaded anywhere: there is no sync, no account and no analytics,
 * so the only copy of this data is the one on the device (plus any backup the
 * person exports themselves).
 *
 * Add a new entry to run more SQL on upgrade; never edit an existing one.
 */
const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE mood_entries (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        day TEXT NOT NULL,
        mood INTEGER NOT NULL,
        energy INTEGER NOT NULL,
        anxiety INTEGER NOT NULL,
        sleep_hours REAL,
        emotions TEXT NOT NULL DEFAULT '[]',
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_mood_day ON mood_entries (day);

      CREATE TABLE journal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        day TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        prompt_id TEXT,
        tags TEXT NOT NULL DEFAULT '[]'
      );
      CREATE INDEX idx_journal_day ON journal_entries (day);

      CREATE TABLE coping_logs (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        day TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        minutes INTEGER,
        helpfulness INTEGER,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_coping_day ON coping_logs (day);

      CREATE TABLE hard_moments (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        day TEXT NOT NULL,
        kind TEXT NOT NULL,
        behaviour TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        triggers TEXT NOT NULL DEFAULT '[]',
        feelings TEXT NOT NULL DEFAULT '[]',
        coping_tried TEXT NOT NULL DEFAULT '[]',
        told_someone INTEGER NOT NULL DEFAULT 0,
        suicidal_thoughts TEXT NOT NULL DEFAULT 'none',
        needs_medical_attention INTEGER NOT NULL DEFAULT 0,
        prevention_plan TEXT NOT NULL DEFAULT '',
        reasons TEXT NOT NULL DEFAULT '[]',
        aftercare TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        assessed_level TEXT NOT NULL DEFAULT 'steady'
      );
      CREATE INDEX idx_hard_day ON hard_moments (day);

      CREATE TABLE reasons_to_stay (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        text TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        hard_moment_id TEXT,
        pinned INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE kv (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  },
];

/**
 * Bring the database up to the current schema. Safe to call on every launch.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let version = row?.user_version ?? 0;

  for (let i = version; i < MIGRATIONS.length; i += 1) {
    await db.withTransactionAsync(async () => {
      await MIGRATIONS[i](db);
    });
    version = i + 1;
    // PRAGMA does not accept bound parameters, and `version` is a loop counter.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

// ---------------------------------------------------------------------------
// Column helpers. SQLite has no array or boolean type, so lists are stored as
// JSON text and booleans as 0/1.
// ---------------------------------------------------------------------------

export function packList(values: string[]): string {
  return JSON.stringify(values);
}

export function unpackList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function packBool(value: boolean): number {
  return value ? 1 : 0;
}

export function unpackBool(value: number | null): boolean {
  return value === 1;
}
