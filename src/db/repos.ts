import type { SQLiteDatabase } from 'expo-sqlite';

import {
  packBool,
  packList,
  unpackBool,
  unpackList,
} from '@/db/database';
import {
  DEFAULT_SETTINGS,
  EMPTY_SAFETY_PLAN,
  type AppSettings,
  type CopingLog,
  type DayKey,
  type HardMoment,
  type JournalEntry,
  type MoodEntry,
  type ReasonToStay,
  type RiskLevel,
  type SafetyPlan,
  type SuicidalThoughts,
} from '@/domain/types';
import { toDayKey } from '@/utils/date';
import { newId } from '@/utils/id';

// ---------------------------------------------------------------------------
// Mood check-ins
// ---------------------------------------------------------------------------

type MoodRow = {
  id: string;
  created_at: number;
  day: string;
  mood: number;
  energy: number;
  anxiety: number;
  sleep_hours: number | null;
  emotions: string;
  note: string;
};

function toMood(row: MoodRow): MoodEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    day: row.day,
    mood: row.mood,
    energy: row.energy,
    anxiety: row.anxiety,
    sleepHours: row.sleep_hours,
    emotions: unpackList(row.emotions),
    note: row.note,
  };
}

export async function addMoodEntry(
  db: SQLiteDatabase,
  input: Omit<MoodEntry, 'id' | 'createdAt' | 'day'> & { createdAt?: number },
): Promise<MoodEntry> {
  const createdAt = input.createdAt ?? Date.now();
  const entry: MoodEntry = {
    ...input,
    id: newId('mood'),
    createdAt,
    day: toDayKey(createdAt),
  };
  await db.runAsync(
    `INSERT INTO mood_entries
       (id, created_at, day, mood, energy, anxiety, sleep_hours, emotions, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.createdAt,
    entry.day,
    entry.mood,
    entry.energy,
    entry.anxiety,
    entry.sleepHours,
    packList(entry.emotions),
    entry.note,
  );
  return entry;
}

export async function listMoodEntries(
  db: SQLiteDatabase,
  limit = 200,
): Promise<MoodEntry[]> {
  const rows = await db.getAllAsync<MoodRow>(
    'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toMood);
}

export async function listMoodEntriesBetween(
  db: SQLiteDatabase,
  from: DayKey,
  to: DayKey,
): Promise<MoodEntry[]> {
  const rows = await db.getAllAsync<MoodRow>(
    'SELECT * FROM mood_entries WHERE day >= ? AND day <= ? ORDER BY created_at ASC',
    from,
    to,
  );
  return rows.map(toMood);
}

export async function deleteMoodEntry(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM mood_entries WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

type JournalRow = {
  id: string;
  created_at: number;
  updated_at: number;
  day: string;
  title: string;
  body: string;
  prompt_id: string | null;
  tags: string;
};

function toJournal(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    day: row.day,
    title: row.title,
    body: row.body,
    promptId: row.prompt_id,
    tags: unpackList(row.tags),
  };
}

export async function createJournalEntry(
  db: SQLiteDatabase,
  input: { title: string; body: string; promptId: string | null; tags: string[] },
): Promise<JournalEntry> {
  const now = Date.now();
  const entry: JournalEntry = {
    id: newId('jrn'),
    createdAt: now,
    updatedAt: now,
    day: toDayKey(now),
    ...input,
  };
  await db.runAsync(
    `INSERT INTO journal_entries
       (id, created_at, updated_at, day, title, body, prompt_id, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.createdAt,
    entry.updatedAt,
    entry.day,
    entry.title,
    entry.body,
    entry.promptId,
    packList(entry.tags),
  );
  return entry;
}

export async function updateJournalEntry(
  db: SQLiteDatabase,
  id: string,
  input: { title: string; body: string; tags: string[] },
): Promise<void> {
  await db.runAsync(
    `UPDATE journal_entries SET title = ?, body = ?, tags = ?, updated_at = ?
     WHERE id = ?`,
    input.title,
    input.body,
    packList(input.tags),
    Date.now(),
    id,
  );
}

export async function getJournalEntry(
  db: SQLiteDatabase,
  id: string,
): Promise<JournalEntry | null> {
  const row = await db.getFirstAsync<JournalRow>(
    'SELECT * FROM journal_entries WHERE id = ?',
    id,
  );
  return row ? toJournal(row) : null;
}

export async function listJournalEntries(
  db: SQLiteDatabase,
  limit = 200,
): Promise<JournalEntry[]> {
  const rows = await db.getAllAsync<JournalRow>(
    'SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toJournal);
}

export async function searchJournalEntries(
  db: SQLiteDatabase,
  query: string,
): Promise<JournalEntry[]> {
  const like = `%${query}%`;
  const rows = await db.getAllAsync<JournalRow>(
    `SELECT * FROM journal_entries
     WHERE title LIKE ? OR body LIKE ?
     ORDER BY created_at DESC LIMIT 100`,
    like,
    like,
  );
  return rows.map(toJournal);
}

export async function deleteJournalEntry(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Coping skill usage
// ---------------------------------------------------------------------------

type CopingRow = {
  id: string;
  created_at: number;
  day: string;
  skill_id: string;
  skill_name: string;
  minutes: number | null;
  helpfulness: number | null;
  note: string;
};

function toCoping(row: CopingRow): CopingLog {
  return {
    id: row.id,
    createdAt: row.created_at,
    day: row.day,
    skillId: row.skill_id,
    skillName: row.skill_name,
    minutes: row.minutes,
    helpfulness: row.helpfulness,
    note: row.note,
  };
}

export async function logCopingSkill(
  db: SQLiteDatabase,
  input: {
    skillId: string;
    skillName: string;
    minutes: number | null;
    helpfulness: number | null;
    note: string;
  },
): Promise<CopingLog> {
  const now = Date.now();
  const log: CopingLog = { id: newId('cope'), createdAt: now, day: toDayKey(now), ...input };
  await db.runAsync(
    `INSERT INTO coping_logs
       (id, created_at, day, skill_id, skill_name, minutes, helpfulness, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    log.id,
    log.createdAt,
    log.day,
    log.skillId,
    log.skillName,
    log.minutes,
    log.helpfulness,
    log.note,
  );
  return log;
}

export async function listCopingLogs(
  db: SQLiteDatabase,
  limit = 300,
): Promise<CopingLog[]> {
  const rows = await db.getAllAsync<CopingRow>(
    'SELECT * FROM coping_logs ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toCoping);
}

export async function listCopingLogsBetween(
  db: SQLiteDatabase,
  from: DayKey,
  to: DayKey,
): Promise<CopingLog[]> {
  const rows = await db.getAllAsync<CopingRow>(
    'SELECT * FROM coping_logs WHERE day >= ? AND day <= ? ORDER BY created_at ASC',
    from,
    to,
  );
  return rows.map(toCoping);
}

/** Skills the person has actually found useful, best first. */
export async function favouriteSkills(
  db: SQLiteDatabase,
  limit = 5,
): Promise<{ skillId: string; skillName: string; uses: number; avg: number | null }[]> {
  return db.getAllAsync(
    `SELECT skill_id AS skillId, skill_name AS skillName,
            COUNT(*) AS uses, AVG(helpfulness) AS avg
     FROM coping_logs
     GROUP BY skill_id
     ORDER BY (AVG(helpfulness) IS NULL), AVG(helpfulness) DESC, uses DESC
     LIMIT ?`,
    limit,
  );
}

export async function deleteCopingLog(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM coping_logs WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Hard moments
// ---------------------------------------------------------------------------

type HardRow = {
  id: string;
  created_at: number;
  day: string;
  kind: string;
  behaviour: string;
  intensity: number;
  triggers: string;
  feelings: string;
  coping_tried: string;
  told_someone: number;
  suicidal_thoughts: string;
  needs_medical_attention: number;
  prevention_plan: string;
  reasons: string;
  aftercare: string;
  note: string;
  assessed_level: string;
};

function toHard(row: HardRow): HardMoment {
  return {
    id: row.id,
    createdAt: row.created_at,
    day: row.day,
    kind: row.kind === 'incident' ? 'incident' : 'urge',
    behaviour: row.behaviour as HardMoment['behaviour'],
    intensity: row.intensity,
    triggers: unpackList(row.triggers),
    feelings: unpackList(row.feelings),
    copingTried: unpackList(row.coping_tried),
    toldSomeone: unpackBool(row.told_someone),
    suicidalThoughts: row.suicidal_thoughts as SuicidalThoughts,
    needsMedicalAttention: unpackBool(row.needs_medical_attention),
    preventionPlan: row.prevention_plan,
    reasons: unpackList(row.reasons),
    aftercare: row.aftercare,
    note: row.note,
    assessedLevel: row.assessed_level as RiskLevel,
  };
}

export async function addHardMoment(
  db: SQLiteDatabase,
  input: Omit<HardMoment, 'id' | 'createdAt' | 'day'>,
): Promise<HardMoment> {
  const now = Date.now();
  const moment: HardMoment = { id: newId('hard'), createdAt: now, day: toDayKey(now), ...input };
  await db.runAsync(
    `INSERT INTO hard_moments
       (id, created_at, day, kind, behaviour, intensity, triggers, feelings,
        coping_tried, told_someone, suicidal_thoughts, needs_medical_attention,
        prevention_plan, reasons, aftercare, note, assessed_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    moment.id,
    moment.createdAt,
    moment.day,
    moment.kind,
    moment.behaviour,
    moment.intensity,
    packList(moment.triggers),
    packList(moment.feelings),
    packList(moment.copingTried),
    packBool(moment.toldSomeone),
    moment.suicidalThoughts,
    packBool(moment.needsMedicalAttention),
    moment.preventionPlan,
    packList(moment.reasons),
    moment.aftercare,
    moment.note,
    moment.assessedLevel,
  );
  return moment;
}

export async function listHardMoments(
  db: SQLiteDatabase,
  limit = 300,
): Promise<HardMoment[]> {
  const rows = await db.getAllAsync<HardRow>(
    'SELECT * FROM hard_moments ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toHard);
}

export async function listHardMomentsBetween(
  db: SQLiteDatabase,
  from: DayKey,
  to: DayKey,
): Promise<HardMoment[]> {
  const rows = await db.getAllAsync<HardRow>(
    'SELECT * FROM hard_moments WHERE day >= ? AND day <= ? ORDER BY created_at ASC',
    from,
    to,
  );
  return rows.map(toHard);
}

export async function deleteHardMoment(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM hard_moments WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Reasons to stay
// ---------------------------------------------------------------------------

type ReasonRow = {
  id: string;
  created_at: number;
  text: string;
  source: string;
  hard_moment_id: string | null;
  pinned: number;
};

function toReason(row: ReasonRow): ReasonToStay {
  return {
    id: row.id,
    createdAt: row.created_at,
    text: row.text,
    source: row.source === 'hard_moment' ? 'hard_moment' : 'manual',
    hardMomentId: row.hard_moment_id,
    pinned: unpackBool(row.pinned),
  };
}

export async function addReason(
  db: SQLiteDatabase,
  text: string,
  source: ReasonToStay['source'] = 'manual',
  hardMomentId: string | null = null,
): Promise<ReasonToStay> {
  const reason: ReasonToStay = {
    id: newId('rsn'),
    createdAt: Date.now(),
    text: text.trim(),
    source,
    hardMomentId,
    pinned: false,
  };
  await db.runAsync(
    `INSERT INTO reasons_to_stay (id, created_at, text, source, hard_moment_id, pinned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    reason.id,
    reason.createdAt,
    reason.text,
    reason.source,
    reason.hardMomentId,
    packBool(reason.pinned),
  );
  return reason;
}

export async function listReasons(db: SQLiteDatabase): Promise<ReasonToStay[]> {
  const rows = await db.getAllAsync<ReasonRow>(
    'SELECT * FROM reasons_to_stay ORDER BY pinned DESC, created_at DESC',
  );
  return rows.map(toReason);
}

export async function setReasonPinned(
  db: SQLiteDatabase,
  id: string,
  pinned: boolean,
): Promise<void> {
  await db.runAsync(
    'UPDATE reasons_to_stay SET pinned = ? WHERE id = ?',
    packBool(pinned),
    id,
  );
}

export async function deleteReason(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM reasons_to_stay WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Key/value store: settings and the safety plan
// ---------------------------------------------------------------------------

async function readJson<T>(db: SQLiteDatabase, key: string, fallback: T): Promise<T> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM kv WHERE key = ?',
    key,
  );
  if (!row) return fallback;
  try {
    // Spread the fallback first so a stored object written by an older version
    // of the app still gains any newly added fields.
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === 'object'
      ? { ...(fallback as object), ...parsed } as T
      : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(db: SQLiteDatabase, key: string, value: unknown): Promise<void> {
  await db.runAsync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}

const SETTINGS_KEY = 'settings';
const SAFETY_PLAN_KEY = 'safety_plan';

export function getSettings(db: SQLiteDatabase): Promise<AppSettings> {
  return readJson(db, SETTINGS_KEY, DEFAULT_SETTINGS);
}

export async function saveSettings(
  db: SQLiteDatabase,
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const next = { ...(await getSettings(db)), ...patch };
  await writeJson(db, SETTINGS_KEY, next);
  return next;
}

export function getSafetyPlan(db: SQLiteDatabase): Promise<SafetyPlan> {
  return readJson(db, SAFETY_PLAN_KEY, EMPTY_SAFETY_PLAN);
}

export async function saveSafetyPlan(
  db: SQLiteDatabase,
  plan: SafetyPlan,
): Promise<SafetyPlan> {
  const next = { ...plan, updatedAt: Date.now() };
  await writeJson(db, SAFETY_PLAN_KEY, next);
  return next;
}

// ---------------------------------------------------------------------------
// Whole-database operations
// ---------------------------------------------------------------------------

export type ExportBundle = {
  format: 'weekly-mental-tracker';
  version: 1;
  exportedAt: number;
  moods: MoodEntry[];
  journals: JournalEntry[];
  coping: CopingLog[];
  hardMoments: HardMoment[];
  reasons: ReasonToStay[];
  safetyPlan: SafetyPlan;
  settings: AppSettings;
};

export async function exportEverything(db: SQLiteDatabase): Promise<ExportBundle> {
  return {
    format: 'weekly-mental-tracker',
    version: 1,
    exportedAt: Date.now(),
    moods: await listMoodEntries(db, 100000),
    journals: await listJournalEntries(db, 100000),
    coping: await listCopingLogs(db, 100000),
    hardMoments: await listHardMoments(db, 100000),
    reasons: await listReasons(db),
    safetyPlan: await getSafetyPlan(db),
    settings: await getSettings(db),
  };
}

export async function deleteEverything(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM mood_entries;
      DELETE FROM journal_entries;
      DELETE FROM coping_logs;
      DELETE FROM hard_moments;
      DELETE FROM reasons_to_stay;
      DELETE FROM kv;
    `);
  });
}

/** Row counts, for the "what is stored on this device" screen. */
export async function countEverything(db: SQLiteDatabase): Promise<{
  moods: number;
  journals: number;
  coping: number;
  hardMoments: number;
  reasons: number;
}> {
  const one = async (table: string): Promise<number> => {
    const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    return row?.n ?? 0;
  };
  return {
    moods: await one('mood_entries'),
    journals: await one('journal_entries'),
    coping: await one('coping_logs'),
    hardMoments: await one('hard_moments'),
    reasons: await one('reasons_to_stay'),
  };
}
