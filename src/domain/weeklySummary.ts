import type {
  CopingLog,
  DayKey,
  HardMoment,
  JournalEntry,
  MoodEntry,
} from '@/domain/types';
import { daysBetween, startOfWeek, weekDays, weekLabel } from '@/utils/date';

export type WeekData = {
  moods: MoodEntry[];
  journals: JournalEntry[];
  coping: CopingLog[];
  hardMoments: HardMoment[];
};

export type MoodPoint = { day: DayKey; mood: number | null };

export type SkillTally = {
  skillId: string;
  skillName: string;
  uses: number;
  /** Average helpfulness across the rated uses, or null if never rated. */
  avgHelpfulness: number | null;
};

export type WeeklySummary = {
  weekStart: DayKey;
  label: string;
  /** How many of the seven days have at least one mood check-in. */
  checkInDays: number;
  moodAvg: number | null;
  moodLow: number | null;
  moodHigh: number | null;
  moodByDay: MoodPoint[];
  /** Change in average mood against the previous week, or null if no basis. */
  moodDelta: number | null;
  sleepAvg: number | null;
  topEmotions: { emotion: string; count: number }[];
  journalCount: number;
  journalWords: number;
  copingCount: number;
  skills: SkillTally[];
  urges: number;
  incidents: number;
  /** Days in the week with no incident recorded, out of the days elapsed. */
  safeDays: number;
  daysElapsed: number;
  /** Urges that were sat with rather than acted on. */
  urgesRidden: number;
  insights: string[];
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function round1(v: number | null): number | null {
  return v === null ? null : Math.round(v * 10) / 10;
}

function inWeek<T extends { day: DayKey }>(items: T[], days: DayKey[]): T[] {
  const set = new Set(days);
  return items.filter((i) => set.has(i.day));
}

export function tallySkills(logs: CopingLog[]): SkillTally[] {
  const map = new Map<string, { name: string; uses: number; ratings: number[] }>();
  for (const log of logs) {
    const entry = map.get(log.skillId) ?? {
      name: log.skillName,
      uses: 0,
      ratings: [],
    };
    entry.uses += 1;
    entry.name = log.skillName || entry.name;
    if (log.helpfulness !== null) entry.ratings.push(log.helpfulness);
    map.set(log.skillId, entry);
  }
  return Array.from(map.entries())
    .map(([skillId, v]) => ({
      skillId,
      skillName: v.name,
      uses: v.uses,
      avgHelpfulness: round1(avg(v.ratings)),
    }))
    .sort((a, b) => b.uses - a.uses || a.skillName.localeCompare(b.skillName));
}

export function tallyEmotions(
  moods: MoodEntry[],
  limit = 5,
): { emotion: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of moods) {
    for (const e of m.emotions) {
      counts.set(e, (counts.get(e) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count || a.emotion.localeCompare(b.emotion))
    .slice(0, limit);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Build the week in review.
 *
 * `previous` is last week's data, used only for the mood trend. `today` bounds
 * the "days elapsed" figures so a Tuesday summary is not scored out of seven.
 */
export function buildWeeklySummary(
  anyDayInWeek: DayKey,
  data: WeekData,
  previous?: WeekData,
  today?: DayKey,
): WeeklySummary {
  const weekStart = startOfWeek(anyDayInWeek);
  const days = weekDays(weekStart);
  const label = weekLabel(weekStart);

  const moods = inWeek(data.moods, days);
  const journals = inWeek(data.journals, days);
  const coping = inWeek(data.coping, days);
  const hardMoments = inWeek(data.hardMoments, days);

  const elapsedRaw = today ? daysBetween(weekStart, today) + 1 : 7;
  const daysElapsed = Math.max(1, Math.min(7, elapsedRaw));

  const moodValues = moods.map((m) => m.mood);
  const moodAvg = round1(avg(moodValues));

  const moodByDay: MoodPoint[] = days.map((day) => {
    const forDay = moods.filter((m) => m.day === day).map((m) => m.mood);
    return { day, mood: round1(avg(forDay)) };
  });

  const prevAvg = previous ? avg(previous.moods.map((m) => m.mood)) : null;
  const moodDelta =
    moodAvg !== null && prevAvg !== null ? round1(moodAvg - prevAvg) : null;

  const sleepValues = moods
    .map((m) => m.sleepHours)
    .filter((h): h is number => h !== null);

  const checkInDays = new Set(moods.map((m) => m.day)).size;

  const incidents = hardMoments.filter((h) => h.kind === 'incident');
  const urges = hardMoments.filter((h) => h.kind === 'urge');
  const incidentDays = new Set(incidents.map((h) => h.day));
  const safeDays = days
    .slice(0, daysElapsed)
    .filter((d) => !incidentDays.has(d)).length;

  const summary: WeeklySummary = {
    weekStart,
    label,
    checkInDays,
    moodAvg,
    moodLow: moodValues.length ? Math.min(...moodValues) : null,
    moodHigh: moodValues.length ? Math.max(...moodValues) : null,
    moodByDay,
    moodDelta,
    sleepAvg: round1(avg(sleepValues)),
    topEmotions: tallyEmotions(moods),
    journalCount: journals.length,
    journalWords: journals.reduce((s, j) => s + countWords(j.body), 0),
    copingCount: coping.length,
    skills: tallySkills(coping),
    urges: urges.length,
    incidents: incidents.length,
    safeDays,
    daysElapsed,
    urgesRidden: urges.length,
    insights: [],
  };

  summary.insights = buildInsights(summary, moods, coping);
  return summary;
}

/**
 * Turn the numbers into a few sentences a person would actually want to read.
 *
 * These are observations about what was recorded, never conclusions about the
 * person. Nothing here diagnoses anything, and the wording stays warm even
 * when the week went badly.
 */
export function buildInsights(
  summary: WeeklySummary,
  moods: MoodEntry[],
  coping: CopingLog[],
): string[] {
  const out: string[] = [];

  if (summary.checkInDays === 0) {
    out.push(
      'No check-ins this week. That is information too — weeks like this are ' +
        'often the busiest or the heaviest ones. One tap is enough to start again.',
    );
    return out;
  }

  if (summary.moodAvg !== null) {
    if (summary.moodDelta === null) {
      out.push(
        `Your mood averaged ${summary.moodAvg} out of 10 across ` +
          `${summary.checkInDays} ${summary.checkInDays === 1 ? 'day' : 'days'}.`,
      );
    } else if (summary.moodDelta >= 0.5) {
      out.push(
        `Your mood averaged ${summary.moodAvg}, up ${Math.abs(summary.moodDelta)} ` +
          'from last week. Whatever you did differently, it is worth noticing.',
      );
    } else if (summary.moodDelta <= -0.5) {
      out.push(
        `Your mood averaged ${summary.moodAvg}, down ${Math.abs(summary.moodDelta)} ` +
          'from last week. Harder weeks happen, and they are not a failure of effort.',
      );
    } else {
      out.push(
        `Your mood held steady around ${summary.moodAvg}, close to last week.`,
      );
    }
  }

  // Sleep against mood, only when there is enough of both sides to compare.
  const withSleep = moods.filter((m) => m.sleepHours !== null);
  const rested = withSleep.filter((m) => (m.sleepHours as number) >= 7);
  const short = withSleep.filter((m) => (m.sleepHours as number) < 6);
  if (rested.length >= 2 && short.length >= 2) {
    const restedAvg = avg(rested.map((m) => m.mood)) as number;
    const shortAvg = avg(short.map((m) => m.mood)) as number;
    const diff = Math.round((restedAvg - shortAvg) * 10) / 10;
    if (diff >= 1) {
      out.push(
        `On nights you slept 7 hours or more, your mood the next day averaged ` +
          `${diff} higher than after nights under 6. Sleep looks like it matters for you.`,
      );
    }
  }

  // Did the days with coping practice look different from the days without?
  const copingDays = new Set(coping.map((c) => c.day));
  const onDays = moods.filter((m) => copingDays.has(m.day)).map((m) => m.mood);
  const offDays = moods.filter((m) => !copingDays.has(m.day)).map((m) => m.mood);
  if (onDays.length >= 2 && offDays.length >= 2) {
    const diff = Math.round(((avg(onDays) as number) - (avg(offDays) as number)) * 10) / 10;
    if (diff >= 0.8) {
      out.push(
        `Days you used a coping skill averaged ${diff} higher than days you did not.`,
      );
    }
  }

  const best = summary.skills
    .filter((s) => s.avgHelpfulness !== null && s.uses >= 2)
    .sort((a, b) => (b.avgHelpfulness as number) - (a.avgHelpfulness as number))[0];
  if (best) {
    out.push(
      `${best.skillName} was your most reliable skill this week ` +
        `(${best.uses} uses, ${best.avgHelpfulness}/5 helpful).`,
    );
  } else if (summary.copingCount > 0) {
    out.push(
      `You reached for a coping skill ${summary.copingCount} ` +
        `${summary.copingCount === 1 ? 'time' : 'times'} this week.`,
    );
  }

  if (summary.urges > 0 && summary.incidents === 0) {
    out.push(
      `You sat with ${summary.urges} ${summary.urges === 1 ? 'urge' : 'urges'} ` +
        'this week without acting on any of them. That is the hardest thing on ' +
        'this whole list, and you did it.',
    );
  } else if (summary.incidents > 0) {
    out.push(
      `You recorded ${summary.incidents} hard ` +
        `${summary.incidents === 1 ? 'moment' : 'moments'} this week, and ` +
        `${summary.safeDays} of ${summary.daysElapsed} days came through ` +
        'without one. Both of those are true at the same time.',
    );
  }

  if (summary.journalCount >= 3) {
    out.push(
      `${summary.journalCount} journal entries, about ${summary.journalWords} words. ` +
        'Future you will be glad you wrote them down.',
    );
  }

  return out;
}
