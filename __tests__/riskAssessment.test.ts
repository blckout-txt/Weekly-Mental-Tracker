import { assessRisk, type RiskInput } from '@/domain/riskAssessment';
import type { HardMoment, MoodEntry } from '@/domain/types';

const TODAY = '2026-03-10';

function moment(over: Partial<HardMoment>): HardMoment {
  return {
    id: Math.random().toString(36),
    createdAt: 0,
    day: TODAY,
    kind: 'incident',
    behaviour: 'self_harm',
    intensity: 5,
    triggers: [],
    feelings: [],
    copingTried: [],
    toldSomeone: false,
    suicidalThoughts: 'none',
    needsMedicalAttention: false,
    preventionPlan: 'x',
    reasons: ['x'],
    aftercare: '',
    note: '',
    assessedLevel: 'steady',
    ...over,
  };
}

function mood(day: string, value: number): MoodEntry {
  return {
    id: Math.random().toString(36),
    createdAt: 0,
    day,
    mood: value,
    energy: 3,
    anxiety: 3,
    sleepHours: null,
    emotions: [],
    note: '',
  };
}

function input(over: Partial<RiskInput> = {}): RiskInput {
  return {
    current: {
      kind: 'urge',
      behaviour: 'self_harm',
      intensity: 3,
      suicidalThoughts: 'none',
      needsMedicalAttention: false,
      toldSomeone: true,
    },
    history: [],
    recentMoods: [],
    today: TODAY,
    ...over,
  };
}

describe('assessRisk', () => {
  it('stays calm for a mild, isolated urge that was shared with someone', () => {
    const result = assessRisk(input());
    expect(result.level).toBe('steady');
    expect(result.recommendResources).toBe(false);
    expect(result.signals).toHaveLength(0);
  });

  it('escalates to urgent for active suicidal thoughts', () => {
    const result = assessRisk(
      input({ current: { ...input().current, suicidalThoughts: 'active' } }),
    );
    expect(result.level).toBe('urgent');
    expect(result.recommendResources).toBe(true);
  });

  it('escalates to elevated for passive suicidal thoughts', () => {
    const result = assessRisk(
      input({ current: { ...input().current, suicidalThoughts: 'passive' } }),
    );
    expect(result.level).toBe('elevated');
    expect(result.recommendResources).toBe(true);
  });

  it('leads with medical care when the person says they are injured', () => {
    const result = assessRisk(
      input({ current: { ...input().current, needsMedicalAttention: true } }),
    );
    expect(result.level).toBe('urgent');
    expect(result.urgeMedicalCare).toBe(true);
    expect(result.message).toMatch(/physical injury/i);
  });

  it('counts the moment being logged towards the weekly total', () => {
    // Two in history plus this one makes three in seven days.
    const result = assessRisk(
      input({
        current: { ...input().current, kind: 'incident', toldSomeone: true },
        history: [
          moment({ day: '2026-03-08' }),
          moment({ day: '2026-03-05' }),
        ],
      }),
    );
    expect(result.level).toBe('urgent');
    expect(result.signals.map((s) => s.label)).toContain(
      '3 times in the last 7 days',
    );
  });

  it('ignores incidents that have aged out of the window', () => {
    const result = assessRisk(
      input({
        current: { ...input().current, kind: 'incident', toldSomeone: true },
        history: [
          moment({ day: '2026-01-08' }),
          moment({ day: '2026-01-05' }),
        ],
      }),
    );
    expect(result.level).toBe('steady');
  });

  it('notices a sustained run of urges even without an incident', () => {
    const history = ['2026-03-04', '2026-03-05', '2026-03-06', '2026-03-08'].map(
      (day) => moment({ day, kind: 'urge' }),
    );
    const result = assessRisk(input({ history }));
    expect(result.level).toBe('elevated');
    expect(result.signals.map((s) => s.label)).toContain(
      '5 strong urges this week',
    );
  });

  it('notices a week of very low mood', () => {
    const result = assessRisk(
      input({
        recentMoods: [
          mood('2026-03-08', 2),
          mood('2026-03-09', 3),
          mood('2026-03-10', 2),
        ],
      }),
    );
    expect(result.level).toBe('elevated');
  });

  it('does not judge mood from a single data point', () => {
    const result = assessRisk(input({ recentMoods: [mood('2026-03-10', 1)] }));
    expect(result.level).toBe('steady');
  });

  it('flags an incident nobody else knows about', () => {
    const result = assessRisk(
      input({
        current: { ...input().current, kind: 'incident', toldSomeone: false },
      }),
    );
    expect(result.level).toBe('elevated');
    expect(result.signals.map((s) => s.label)).toContain(
      'Nobody else knows about this yet',
    );
  });

  it('takes the highest signal, not the average', () => {
    const result = assessRisk(
      input({
        current: {
          ...input().current,
          kind: 'incident',
          intensity: 10,
          suicidalThoughts: 'passive',
          toldSomeone: true,
        },
      }),
    );
    expect(result.level).toBe('urgent');
  });
});
