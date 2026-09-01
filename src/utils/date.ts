import type { DayKey, Timestamp } from '@/domain/types';

export const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local-time calendar day for a timestamp, as YYYY-MM-DD. */
export function toDayKey(ts: Timestamp | Date): DayKey {
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Midnight (local) at the start of the given day key. */
export function dayKeyToDate(day: DayKey): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function todayKey(now: Timestamp = Date.now()): DayKey {
  return toDayKey(now);
}

/** Shift a day key by a whole number of days, staying correct across DST. */
export function addDays(day: DayKey, delta: number): DayKey {
  const d = dayKeyToDate(day);
  d.setDate(d.getDate() + delta);
  return toDayKey(d);
}

/** Whole days from `a` to `b` (b - a). Negative when b is earlier. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const start = dayKeyToDate(a).getTime();
  const end = dayKeyToDate(b).getTime();
  return Math.round((end - start) / DAY_MS);
}

/**
 * Monday-start week containing `day`. Weeks are the unit the whole summary is
 * built on, so this is the one place the convention is decided.
 */
export function startOfWeek(day: DayKey): DayKey {
  const d = dayKeyToDate(day);
  const dow = d.getDay(); // 0 = Sunday
  const shift = dow === 0 ? -6 : 1 - dow;
  return addDays(day, shift);
}

export function endOfWeek(day: DayKey): DayKey {
  return addDays(startOfWeek(day), 6);
}

/** The seven day keys of the week containing `day`, Monday first. */
export function weekDays(day: DayKey): DayKey[] {
  const start = startOfWeek(day);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inclusive list of day keys from `from` to `to`. */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  const total = daysBetween(from, to);
  for (let i = 0; i <= total; i += 1) out.push(addDays(from, i));
  return out;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function weekdayShort(day: DayKey): string {
  return WEEKDAY_SHORT[dayKeyToDate(day).getDay()];
}

/** "12 Mar" style label. */
export function shortDate(day: DayKey): string {
  const d = dayKeyToDate(day);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "Mon 12 Mar" style label. */
export function mediumDate(day: DayKey): string {
  return `${weekdayShort(day)} ${shortDate(day)}`;
}

export function weekLabel(day: DayKey): string {
  return `${shortDate(startOfWeek(day))} – ${shortDate(endOfWeek(day))}`;
}

/** "today" / "yesterday" / "Mon 12 Mar". */
export function relativeDay(day: DayKey, now: DayKey = todayKey()): string {
  const diff = daysBetween(day, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return mediumDate(day);
}

/** "14:05" in 24h local time. */
export function clockTime(ts: Timestamp): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
