/** Word lists used by the check-in and hard-moment forms. */

export const EMOTIONS: string[] = [
  'calm', 'content', 'grateful', 'hopeful', 'proud', 'connected', 'excited',
  'motivated', 'relieved', 'loved', 'tired', 'flat', 'numb', 'restless',
  'lonely', 'anxious', 'panicky', 'overwhelmed', 'irritable', 'angry',
  'guilty', 'ashamed', 'sad', 'hopeless', 'empty', 'scared', 'jealous',
  'embarrassed', 'frustrated', 'disconnected',
];

export const POSITIVE_EMOTIONS = new Set([
  'calm', 'content', 'grateful', 'hopeful', 'proud', 'connected', 'excited',
  'motivated', 'relieved', 'loved',
]);

export const TRIGGERS: string[] = [
  'conflict', 'rejection', 'criticism', 'being alone', 'crowds', 'work',
  'school', 'money', 'family', 'a memory', 'an anniversary', 'social media',
  'body image', 'not sleeping', 'not eating', 'alcohol', 'physical pain',
  'boredom', 'bad news', 'feeling like a burden', 'nothing specific',
];

export const MOOD_LABELS: Record<number, string> = {
  1: 'As bad as it gets',
  2: 'Really struggling',
  3: 'Low',
  4: 'Below par',
  5: 'Flat',
  6: 'Okay',
  7: 'Decent',
  8: 'Good',
  9: 'Really good',
  10: 'The best it gets',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: 'Running on empty',
  2: 'Low',
  3: 'Enough to get by',
  4: 'Good',
  5: 'Full of it',
};

export const ANXIETY_LABELS: Record<number, string> = {
  1: 'Settled',
  2: 'A bit on edge',
  3: 'Tense',
  4: 'Very anxious',
  5: 'Panicking',
};

export type JournalPrompt = {
  id: string;
  text: string;
  tone: 'reflect' | 'hard' | 'kind' | 'plan';
};

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { id: 'p_today', text: 'What actually happened today, in plain words?', tone: 'reflect' },
  { id: 'p_carrying', text: 'What have you been carrying around all day without saying out loud?', tone: 'hard' },
  { id: 'p_hardest', text: 'What was the hardest hour today, and what got you through it?', tone: 'hard' },
  { id: 'p_body', text: 'Where has the stress been sitting in your body?', tone: 'reflect' },
  { id: 'p_kind', text: 'What would you say to a friend who had your exact day?', tone: 'kind' },
  { id: 'p_smallwin', text: 'What is one thing you did today that you are not giving yourself credit for?', tone: 'kind' },
  { id: 'p_needed', text: 'What did you need today that you did not ask for?', tone: 'reflect' },
  { id: 'p_avoid', text: 'What are you avoiding, and what is the smallest first step?', tone: 'plan' },
  { id: 'p_tomorrow', text: 'What is one thing that would make tomorrow 5% easier?', tone: 'plan' },
  { id: 'p_pattern', text: 'Have you felt this way before? What was different about how it ended?', tone: 'reflect' },
  { id: 'p_anger', text: 'What are you angry about that you have been calling something else?', tone: 'hard' },
  { id: 'p_grateful', text: 'Three things that did not go wrong today.', tone: 'kind' },
  { id: 'p_people', text: 'Who felt safe to be around this week, and who did not?', tone: 'reflect' },
  { id: 'p_future', text: 'Write to yourself a year from now. What do you want them to know about right now?', tone: 'kind' },
  { id: 'p_lie', text: 'What is the meanest thing your head has told you this week? Is it actually true?', tone: 'hard' },
  { id: 'p_energy', text: 'What gave you energy this week, and what drained it?', tone: 'reflect' },
];

export function randomPrompt(exclude?: string | null): JournalPrompt {
  const pool = JOURNAL_PROMPTS.filter((p) => p.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
