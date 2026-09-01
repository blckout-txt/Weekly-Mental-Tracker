import type { HardMoment, MoodEntry, RiskLevel } from '@/domain/types';
import { daysBetween, todayKey } from '@/utils/date';

export type RiskSignal = {
  /** Short label shown back to the person, phrased without judgement. */
  label: string;
  weight: RiskLevel;
};

export type RiskAssessment = {
  level: RiskLevel;
  signals: RiskSignal[];
  /** Whether to put crisis lines in front of the person right now. */
  recommendResources: boolean;
  /** Whether to lead with "this needs physical care" before anything else. */
  urgeMedicalCare: boolean;
  /** One paragraph, written to be read in a bad moment. */
  message: string;
};

/**
 * The input a single assessment works from: the moment being logged plus
 * everything already recorded.
 */
export type RiskInput = {
  current: Pick<
    HardMoment,
    | 'kind'
    | 'behaviour'
    | 'intensity'
    | 'suicidalThoughts'
    | 'needsMedicalAttention'
    | 'toldSomeone'
  >;
  history: HardMoment[];
  recentMoods: MoodEntry[];
  today?: string;
};

const RANK: Record<RiskLevel, number> = { steady: 0, elevated: 1, urgent: 2 };

function highest(levels: RiskLevel[]): RiskLevel {
  let best: RiskLevel = 'steady';
  for (const level of levels) {
    if (RANK[level] > RANK[best]) best = level;
  }
  return best;
}

function withinDays(moments: HardMoment[], today: string, days: number): HardMoment[] {
  return moments.filter((m) => {
    const age = daysBetween(m.day, today);
    return age >= 0 && age < days;
  });
}

/**
 * Decide how loudly the app should point towards other people.
 *
 * This is intentionally conservative: it errs towards showing help. It is a
 * set of plain rules over what the person told us, not a clinical instrument,
 * and nothing here is a diagnosis or a prediction.
 */
export function assessRisk(input: RiskInput): RiskAssessment {
  const today = input.today ?? todayKey();
  const { current, history } = input;
  const signals: RiskSignal[] = [];

  if (current.needsMedicalAttention) {
    signals.push({
      label: 'You said this needs medical attention',
      weight: 'urgent',
    });
  }

  if (current.suicidalThoughts === 'active') {
    signals.push({
      label: 'You are having thoughts of acting on suicide',
      weight: 'urgent',
    });
  } else if (current.suicidalThoughts === 'passive') {
    signals.push({
      label: 'You are having thoughts of not wanting to be here',
      weight: 'elevated',
    });
  }

  if (current.kind === 'incident' && current.intensity >= 9) {
    signals.push({ label: 'This was as intense as it gets', weight: 'urgent' });
  } else if (current.intensity >= 7) {
    signals.push({ label: 'This was a very strong urge', weight: 'elevated' });
  }

  const incidents = history.filter((m) => m.kind === 'incident');
  const incidents7 = withinDays(incidents, today, 7);
  const incidents14 = withinDays(incidents, today, 14);
  const urges7 = withinDays(
    history.filter((m) => m.kind === 'urge'),
    today,
    7,
  );

  // The current moment is counted alongside history so a third incident in a
  // week reads as three, not two.
  const incidentsThisWeek = incidents7.length + (current.kind === 'incident' ? 1 : 0);
  const incidentsTwoWeeks = incidents14.length + (current.kind === 'incident' ? 1 : 0);
  const urgesThisWeek = urges7.length + (current.kind === 'urge' ? 1 : 0);

  if (incidentsThisWeek >= 3) {
    signals.push({
      label: `${incidentsThisWeek} times in the last 7 days`,
      weight: 'urgent',
    });
  } else if (incidentsTwoWeeks >= 2) {
    signals.push({
      label: `More than once in the last 2 weeks`,
      weight: 'elevated',
    });
  }

  if (urgesThisWeek >= 5) {
    signals.push({
      label: `${urgesThisWeek} strong urges this week`,
      weight: 'elevated',
    });
  }

  const moods = input.recentMoods.filter((m) => daysBetween(m.day, today) < 7);
  if (moods.length >= 3) {
    const avg = moods.reduce((s, m) => s + m.mood, 0) / moods.length;
    if (avg <= 3) {
      signals.push({
        label: 'Your mood has been very low all week',
        weight: 'elevated',
      });
    }
  }

  if (!current.toldSomeone && current.kind === 'incident') {
    signals.push({
      label: 'Nobody else knows about this yet',
      weight: 'elevated',
    });
  }

  const level = highest(signals.map((s) => s.weight));

  return {
    level,
    signals,
    recommendResources: level !== 'steady',
    urgeMedicalCare: current.needsMedicalAttention,
    message: messageFor(level, current.needsMedicalAttention),
  };
}

function messageFor(level: RiskLevel, medical: boolean): string {
  if (medical) {
    return (
      'Please take care of the physical injury first — a clinic, an urgent care ' +
      'line, or someone who can drive you. Nothing else on this screen matters ' +
      'more than that right now. You are allowed to get treated.'
    );
  }
  switch (level) {
    case 'urgent':
      return (
        'What you have just written is a lot to be holding by yourself. Please ' +
        'talk to a person tonight, not an app — a crisis line, someone you ' +
        'trust, or emergency services. Reaching out is not an overreaction, ' +
        'and you do not have to be in danger to be allowed to call.'
      );
    case 'elevated':
      return (
        'This has been building for a while, and that is worth taking ' +
        'seriously. Would you be willing to tell one real person this week, or ' +
        'call a line and just talk? You have got through this before, and you ' +
        'do not have to do it alone this time.'
      );
    default:
      return (
        'Thank you for writing it down. Noticing what happened, and being ' +
        'honest about it, is the part most people skip. Be gentle with ' +
        'yourself for the rest of today.'
      );
  }
}

/**
 * The same reasoning applied to the record as a whole, used on the home screen
 * and in the weekly summary rather than in the moment.
 */
export function assessTrend(
  history: HardMoment[],
  recentMoods: MoodEntry[],
  today: string = todayKey(),
): RiskAssessment {
  const recent = withinDays(history, today, 14);
  const latest = recent[0];
  return assessRisk({
    current: {
      kind: latest?.kind ?? 'urge',
      behaviour: latest?.behaviour ?? 'other',
      intensity: 0,
      suicidalThoughts: latest?.suicidalThoughts ?? 'none',
      needsMedicalAttention: false,
      toldSomeone: true,
    },
    history: recent.filter((m) => m.id !== latest?.id),
    recentMoods,
    today,
  });
}
