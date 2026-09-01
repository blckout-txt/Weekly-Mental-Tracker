import type { DayKey } from '@/domain/types';
import { addDays, daysBetween, todayKey } from '@/utils/date';

/**
 * Length of the run of consecutive days ending today (or yesterday, so the
 * streak is not "broken" before the day is over).
 */
export function currentStreak(days: DayKey[], today: DayKey = todayKey()): number {
  const set = new Set(days);
  if (set.size === 0) return 0;

  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;

  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Longest run of consecutive days anywhere in the record. */
export function longestStreak(days: DayKey[]): number {
  const sorted = Array.from(new Set(days)).sort();
  let best = 0;
  let run = 0;
  let prev: DayKey | null = null;

  for (const day of sorted) {
    run = prev !== null && daysBetween(prev, day) === 1 ? run + 1 : 1;
    prev = day;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Days since the last day in the list, e.g. days since the last incident.
 * Returns null when the list is empty (nothing to count from).
 */
export function daysSince(days: DayKey[], today: DayKey = todayKey()): number | null {
  if (days.length === 0) return null;
  const latest = days.reduce((a, b) => (a > b ? a : b));
  return Math.max(0, daysBetween(latest, today));
}
