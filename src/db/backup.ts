import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { packBool, packList } from '@/db/database';
import { deleteEverything, exportEverything, type ExportBundle } from '@/db/repos';
import { toDayKey } from '@/utils/date';

/**
 * Write everything to a JSON file and hand it to the share sheet.
 *
 * This is the only way data ever leaves the device, and it only happens when
 * the person taps the button and picks a destination themselves.
 */
export async function exportToFile(db: SQLiteDatabase): Promise<string> {
  const bundle = await exportEverything(db);
  const name = `mental-tracker-backup-${toDayKey(bundle.exportedAt)}.json`;
  const file = new File(Paths.cache, name);

  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(bundle, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your backup',
      UTI: 'public.json',
    });
  }
  return file.uri;
}

export type ImportResult = {
  imported: {
    moods: number;
    journals: number;
    coping: number;
    hardMoments: number;
    reasons: number;
  };
};

function isBundle(value: unknown): value is ExportBundle {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as ExportBundle).format === 'weekly-mental-tracker'
  );
}

/**
 * Restore a backup, replacing what is currently stored.
 *
 * Rows are written with their original ids and timestamps so a restore is a
 * true replacement rather than a merge — importing the same file twice leaves
 * the same data, not two copies of it.
 */
export async function importFromFile(db: SQLiteDatabase): Promise<ImportResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || picked.assets.length === 0) return null;

  const raw = await new File(picked.assets[0].uri).text();
  const parsed: unknown = JSON.parse(raw);
  if (!isBundle(parsed)) {
    throw new Error('That file is not a backup from this app.');
  }

  await deleteEverything(db);

  await db.withTransactionAsync(async () => {
    for (const m of parsed.moods ?? []) {
      await db.runAsync(
        `INSERT INTO mood_entries
           (id, created_at, day, mood, energy, anxiety, sleep_hours, emotions, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id, m.createdAt, m.day, m.mood, m.energy, m.anxiety,
        m.sleepHours, packList(m.emotions ?? []), m.note ?? '',
      );
    }
    for (const j of parsed.journals ?? []) {
      await db.runAsync(
        `INSERT INTO journal_entries
           (id, created_at, updated_at, day, title, body, prompt_id, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        j.id, j.createdAt, j.updatedAt, j.day, j.title ?? '', j.body ?? '',
        j.promptId ?? null, packList(j.tags ?? []),
      );
    }
    for (const c of parsed.coping ?? []) {
      await db.runAsync(
        `INSERT INTO coping_logs
           (id, created_at, day, skill_id, skill_name, minutes, helpfulness, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        c.id, c.createdAt, c.day, c.skillId, c.skillName,
        c.minutes, c.helpfulness, c.note ?? '',
      );
    }
    for (const h of parsed.hardMoments ?? []) {
      await db.runAsync(
        `INSERT INTO hard_moments
           (id, created_at, day, kind, behaviour, intensity, triggers, feelings,
            coping_tried, told_someone, suicidal_thoughts, needs_medical_attention,
            prevention_plan, reasons, aftercare, note, assessed_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        h.id, h.createdAt, h.day, h.kind, h.behaviour, h.intensity,
        packList(h.triggers ?? []), packList(h.feelings ?? []),
        packList(h.copingTried ?? []), packBool(h.toldSomeone),
        h.suicidalThoughts ?? 'none', packBool(h.needsMedicalAttention),
        h.preventionPlan ?? '', packList(h.reasons ?? []),
        h.aftercare ?? '', h.note ?? '', h.assessedLevel ?? 'steady',
      );
    }
    for (const r of parsed.reasons ?? []) {
      await db.runAsync(
        `INSERT INTO reasons_to_stay (id, created_at, text, source, hard_moment_id, pinned)
         VALUES (?, ?, ?, ?, ?, ?)`,
        r.id, r.createdAt, r.text, r.source, r.hardMomentId ?? null, packBool(r.pinned),
      );
    }
    if (parsed.safetyPlan) {
      await db.runAsync(
        'INSERT INTO kv (key, value) VALUES (?, ?)',
        'safety_plan',
        JSON.stringify(parsed.safetyPlan),
      );
    }
    if (parsed.settings) {
      await db.runAsync(
        'INSERT INTO kv (key, value) VALUES (?, ?)',
        'settings',
        JSON.stringify(parsed.settings),
      );
    }
  });

  return {
    imported: {
      moods: parsed.moods?.length ?? 0,
      journals: parsed.journals?.length ?? 0,
      coping: parsed.coping?.length ?? 0,
      hardMoments: parsed.hardMoments?.length ?? 0,
      reasons: parsed.reasons?.length ?? 0,
    },
  };
}
