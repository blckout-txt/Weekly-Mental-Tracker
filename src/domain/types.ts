/**
 * Core data shapes for the tracker.
 *
 * Everything here lives on the device only. There is no server, no account and
 * no network call anywhere in this app, so these types never leave the phone
 * unless the person explicitly exports a backup file themselves.
 */

/** Calendar day in the device's local timezone, formatted YYYY-MM-DD. */
export type DayKey = string;

/** Milliseconds since epoch. */
export type Timestamp = number;

export type MoodEntry = {
  id: string;
  createdAt: Timestamp;
  day: DayKey;
  /** 1 (worst) .. 10 (best). */
  mood: number;
  /** 1 (drained) .. 5 (energised). */
  energy: number;
  /** 1 (calm) .. 5 (very anxious). */
  anxiety: number;
  /** Hours slept the night before, or null if not recorded. */
  sleepHours: number | null;
  emotions: string[];
  note: string;
};

export type JournalEntry = {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  day: DayKey;
  title: string;
  body: string;
  /** Id of the prompt that seeded the entry, when one was used. */
  promptId: string | null;
  tags: string[];
};

export type CopingLog = {
  id: string;
  createdAt: Timestamp;
  day: DayKey;
  skillId: string;
  skillName: string;
  minutes: number | null;
  /** 1 (did nothing) .. 5 (really helped), or null if not rated. */
  helpfulness: number | null;
  note: string;
};

/** What the person was struggling with. Deliberately broad. */
export type HardMomentBehaviour =
  | 'self_harm'
  | 'suicidal_thoughts'
  | 'substance'
  | 'disordered_eating'
  | 'other';

/**
 * `urge` = the person felt the pull and did not act on it.
 * `incident` = it happened.
 *
 * Both are worth recording. An urge that was ridden out is a win, and the app
 * treats it as one.
 */
export type HardMomentKind = 'urge' | 'incident';

/** Self-reported thoughts of suicide, in the person's own words, simplified. */
export type SuicidalThoughts = 'none' | 'passive' | 'active';

export type HardMoment = {
  id: string;
  createdAt: Timestamp;
  day: DayKey;
  kind: HardMomentKind;
  behaviour: HardMomentBehaviour;
  /** How strong the urge was, 1 .. 10. */
  intensity: number;
  triggers: string[];
  feelings: string[];
  /** Coping skill ids tried before or instead. */
  copingTried: string[];
  /** Did they tell anyone / reach out to anyone? */
  toldSomeone: boolean;
  suicidalThoughts: SuicidalThoughts;
  /** Does this need physical care (a wound, an overdose, anything medical)? */
  needsMedicalAttention: boolean;
  /** Required: what they will do differently next time. */
  preventionPlan: string;
  /** Required, at least one: reasons not to do it again. */
  reasons: string[];
  /** Optional: how they looked after themselves afterwards. */
  aftercare: string;
  note: string;
  /** Risk level computed at the time of logging, kept for the weekly summary. */
  assessedLevel: RiskLevel;
};

export type RiskLevel = 'steady' | 'elevated' | 'urgent';

export type ReasonToStay = {
  id: string;
  createdAt: Timestamp;
  text: string;
  source: 'hard_moment' | 'manual';
  hardMomentId: string | null;
  pinned: boolean;
};

export type SupportContact = {
  name: string;
  detail: string;
};

/**
 * A safety plan in the spirit of the Stanley-Brown safety planning
 * intervention: written while calm, read when not.
 */
export type SafetyPlan = {
  warningSigns: string[];
  internalCoping: string[];
  distractions: string[];
  supportPeople: SupportContact[];
  professionals: SupportContact[];
  environmentSteps: string[];
  reasonsForLiving: string[];
  updatedAt: Timestamp | null;
};

export const EMPTY_SAFETY_PLAN: SafetyPlan = {
  warningSigns: [],
  internalCoping: [],
  distractions: [],
  supportPeople: [],
  professionals: [],
  environmentSteps: [],
  reasonsForLiving: [],
  updatedAt: null,
};

export type AppSettings = {
  onboardingComplete: boolean;
  lockEnabled: boolean;
  /** Region key used to pick which crisis lines to show first. */
  region: string;
  /** Hide the harder tracking features for people who do not need them. */
  trackHardMoments: boolean;
  displayName: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  lockEnabled: false,
  region: 'US',
  trackHardMoments: true,
  displayName: '',
};
