import { buildWeeklySummary, tallyEmotions, tallySkills, type WeekData } from '@/domain/weeklySummary';
import type { CopingLog, HardMoment, JournalEntry, MoodEntry } from '@/domain/types';

// 2026-03-09 is a Monday.
const MON = '2026-03-09';

function mood(day: string, value: number, over: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: `m${day}${value}`,
    createdAt: 0,
    day,
    mood: value,
    energy: 3,
    anxiety: 3,
    sleepHours: null,
    emotions: [],
    note: '',
    ...over,
  };
}

function coping(day: string, skillId: string, helpfulness: number | null): CopingLog {
  return {
    id: `c${day}${skillId}${helpfulness}`,
    createdAt: 0,
    day,
    skillId,
    skillName: skillId === 'ground_54321' ? '5-4-3-2-1 senses' : 'Box breathing',
    minutes: 5,
    helpfulness,
    note: '',
  };
}

function hard(day: string, kind: 'urge' | 'incident'): HardMoment {
  return {
    id: `h${day}${kind}`,
    createdAt: 0,
    day,
    kind,
    behaviour: 'self_harm',
    intensity: 6,
    triggers: [],
    feelings: [],
    copingTried: [],
    toldSomeone: false,
    suicidalThoughts: 'none',
    needsMedicalAttention: false,
    preventionPlan: 'p',
    reasons: ['r'],
    aftercare: '',
    note: '',
    assessedLevel: 'steady',
  };
}

function journal(day: string, body: string): JournalEntry {
  return {
    id: `j${day}`,
    createdAt: 0,
    updatedAt: 0,
    day,
    title: '',
    body,
    promptId: null,
    tags: [],
  };
}

const EMPTY: WeekData = { moods: [], journals: [], coping: [], hardMoments: [] };

describe('buildWeeklySummary', () => {
  it('handles a week with nothing in it without dividing by zero', () => {
    const s = buildWeeklySummary(MON, EMPTY);
    expect(s.moodAvg).toBeNull();
    expect(s.checkInDays).toBe(0);
    expect(s.moodByDay).toHaveLength(7);
    expect(s.moodByDay.every((p) => p.mood === null)).toBe(true);
    expect(s.insights[0]).toMatch(/No check-ins/);
  });

  it('averages mood and reports the range', () => {
    const s = buildWeeklySummary(MON, {
      ...EMPTY,
      moods: [mood(MON, 4), mood('2026-03-10', 8), mood('2026-03-11', 6)],
    });
    expect(s.moodAvg).toBe(6);
    expect(s.moodLow).toBe(4);
    expect(s.moodHigh).toBe(8);
    expect(s.checkInDays).toBe(3);
  });

  it('counts a day once even with several check-ins on it', () => {
    const s = buildWeeklySummary(MON, {
      ...EMPTY,
      moods: [mood(MON, 4), mood(MON, 8)],
    });
    expect(s.checkInDays).toBe(1);
    expect(s.moodByDay[0].mood).toBe(6);
  });

  it('excludes entries from other weeks', () => {
    const s = buildWeeklySummary(MON, {
      ...EMPTY,
      moods: [mood(MON, 5), mood('2026-03-08', 1), mood('2026-03-16', 10)],
    });
    expect(s.moodAvg).toBe(5);
  });

  it('compares against the previous week', () => {
    const s = buildWeeklySummary(
      MON,
      { ...EMPTY, moods: [mood(MON, 7)] },
      { ...EMPTY, moods: [mood('2026-03-02', 5)] },
    );
    expect(s.moodDelta).toBe(2);
    expect(s.insights.join(' ')).toMatch(/up 2/);
  });

  it('reports a drop without blaming the person for it', () => {
    const s = buildWeeklySummary(
      MON,
      { ...EMPTY, moods: [mood(MON, 3)] },
      { ...EMPTY, moods: [mood('2026-03-02', 7)] },
    );
    expect(s.moodDelta).toBe(-4);
    expect(s.insights.join(' ')).toMatch(/not a failure/);
  });

  it('scores safe days against days elapsed, not the whole week', () => {
    const s = buildWeeklySummary(
      MON,
      { ...EMPTY, hardMoments: [hard('2026-03-10', 'incident')] },
      undefined,
      '2026-03-11', // Wednesday
    );
    expect(s.daysElapsed).toBe(3);
    expect(s.safeDays).toBe(2);
    expect(s.incidents).toBe(1);
  });

  it('celebrates a week of urges that were all ridden out', () => {
    const s = buildWeeklySummary(MON, {
      ...EMPTY,
      moods: [mood(MON, 4)],
      hardMoments: [hard(MON, 'urge'), hard('2026-03-10', 'urge')],
    });
    expect(s.incidents).toBe(0);
    expect(s.urgesRidden).toBe(2);
    expect(s.insights.join(' ')).toMatch(/without acting on any of them/);
  });

  it('links sleep to mood only when both sides have enough nights', () => {
    const rested = [
      mood(MON, 8, { sleepHours: 8 }),
      mood('2026-03-10', 8, { sleepHours: 7.5 }),
    ];
    const short = [
      mood('2026-03-11', 4, { sleepHours: 5 }),
      mood('2026-03-12', 4, { sleepHours: 4.5 }),
    ];
    const s = buildWeeklySummary(MON, { ...EMPTY, moods: [...rested, ...short] });
    expect(s.insights.join(' ')).toMatch(/Sleep looks like it matters/);

    const notEnough = buildWeeklySummary(MON, {
      ...EMPTY,
      moods: [rested[0], short[0]],
    });
    expect(notEnough.insights.join(' ')).not.toMatch(/Sleep looks like/);
  });

  it('counts journal words', () => {
    const s = buildWeeklySummary(MON, {
      ...EMPTY,
      journals: [journal(MON, 'three words here'), journal('2026-03-10', '  ')],
    });
    expect(s.journalCount).toBe(2);
    expect(s.journalWords).toBe(3);
  });
});

describe('tallies', () => {
  it('ranks skills by use and averages only the rated ones', () => {
    const tallies = tallySkills([
      coping(MON, 'breathe_box', 5),
      coping('2026-03-10', 'breathe_box', 3),
      coping('2026-03-11', 'breathe_box', null),
      coping(MON, 'ground_54321', 4),
    ]);
    expect(tallies[0].skillId).toBe('breathe_box');
    expect(tallies[0].uses).toBe(3);
    expect(tallies[0].avgHelpfulness).toBe(4);
    expect(tallies[1].uses).toBe(1);
  });

  it('returns null helpfulness when nothing was rated', () => {
    const tallies = tallySkills([coping(MON, 'breathe_box', null)]);
    expect(tallies[0].avgHelpfulness).toBeNull();
  });

  it('counts the most frequent emotions', () => {
    const top = tallyEmotions([
      mood(MON, 5, { emotions: ['anxious', 'tired'] }),
      mood('2026-03-10', 5, { emotions: ['anxious'] }),
      mood('2026-03-11', 5, { emotions: ['proud'] }),
    ]);
    expect(top[0]).toEqual({ emotion: 'anxious', count: 2 });
    expect(top).toHaveLength(3);
  });
});
