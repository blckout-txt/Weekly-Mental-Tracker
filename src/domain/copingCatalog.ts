export type CopingCategory =
  | 'ground'
  | 'breathe'
  | 'soothe'
  | 'move'
  | 'think'
  | 'connect'
  | 'create'
  | 'delay';

export type CopingSkill = {
  id: string;
  name: string;
  category: CopingCategory;
  /** One line shown in the list. */
  blurb: string;
  /** Rough time cost, in minutes. */
  minutes: number;
  steps: string[];
  /** Safe and useful in an acute urge, not just for general upkeep. */
  forCrisis: boolean;
  /** Built-in guided tool, if this skill has one. */
  tool?: 'breathing' | 'grounding54321' | 'timer';
};

export const CATEGORY_LABELS: Record<CopingCategory, string> = {
  ground: 'Grounding',
  breathe: 'Breathing',
  soothe: 'Self-soothe',
  move: 'Body & movement',
  think: 'Thinking tools',
  connect: 'Connection',
  create: 'Expression',
  delay: 'Riding out an urge',
};

export const CATEGORY_ORDER: CopingCategory[] = [
  'delay',
  'ground',
  'breathe',
  'soothe',
  'move',
  'think',
  'connect',
  'create',
];

/**
 * The skill library.
 *
 * Most of these come from the standard self-help toolkit — DBT distress
 * tolerance, grounding, paced breathing, behavioural activation. Nothing here
 * involves substituting one kind of hurt for another: no snapping, no pinching,
 * no "safer" versions of self-harm. The cold-water entries are the TIPP skill,
 * which works on the nervous system rather than through pain.
 */
export const COPING_SKILLS: CopingSkill[] = [
  // ---- Riding out an urge -------------------------------------------------
  {
    id: 'delay_15',
    name: 'The 15 minute wait',
    category: 'delay',
    blurb: 'Not "no" — just "not yet". Urges peak and fall.',
    minutes: 15,
    forCrisis: true,
    tool: 'timer',
    steps: [
      'Say to yourself: I am not deciding never. I am deciding not in the next 15 minutes.',
      'Set the timer and put the phone down somewhere you can still hear it.',
      'Do anything else at all until it goes off — it does not have to be a good thing.',
      'When it rings, check in. If the urge dropped even slightly, set another 15.',
      'Most urges peak within 20 to 30 minutes. You are outlasting it, not fighting it.',
    ],
  },
  {
    id: 'urge_surf',
    name: 'Urge surfing',
    category: 'delay',
    blurb: 'Watch the wave rise and fall instead of trying to stop it.',
    minutes: 10,
    forCrisis: true,
    steps: [
      'Sit or lie somewhere you can be still.',
      'Find where the urge lives in your body — chest, hands, jaw, stomach.',
      'Describe it to yourself like weather: tight, hot, buzzing, heavy.',
      'Breathe into that spot. Do not push it away and do not feed it.',
      'Notice it change. It will rise, hold, and pass. Ride it to the other side.',
    ],
  },
  {
    id: 'remove_means',
    name: 'Put distance between you and it',
    category: 'delay',
    blurb: 'Make the harder choice take more steps.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Name what you would use.',
      'Move it out of the room — a locked drawer, a high shelf, a neighbour, the bin.',
      'If you cannot move it, move yourself: another room, outside, a shop, anywhere.',
      'Ask someone to hold onto it for tonight if you can. You can ask for it back.',
      'You are not proving anything by keeping it close.',
    ],
  },
  {
    id: 'cold_water',
    name: 'Cold water on your face',
    category: 'delay',
    blurb: 'The fastest physical reset there is.',
    minutes: 2,
    forCrisis: true,
    steps: [
      'Fill a bowl with cold water, or use a cold wet flannel.',
      'Hold your breath and put your face in — or press the flannel over your eyes and cheeks.',
      'Stay for about 30 seconds. Come up, breathe, repeat once or twice.',
      'This triggers the dive reflex: heart rate drops, the panic loses its edge.',
      'Skip this one if you have a heart condition or an eating disorder that affects your heart.',
    ],
  },
  {
    id: 'ice_hold',
    name: 'Hold ice',
    category: 'delay',
    blurb: 'Intense sensation, no damage, over in a minute.',
    minutes: 3,
    forCrisis: true,
    steps: [
      'Take an ice cube in your fist, or press it to your inner wrist.',
      'Hold it until it is uncomfortable — about 30 seconds, then swap hands.',
      'Focus completely on the cold: where it starts, where it spreads.',
      'Put it down before it hurts properly. The point is intensity, not injury.',
    ],
  },

  // ---- Grounding ----------------------------------------------------------
  {
    id: 'ground_54321',
    name: '5-4-3-2-1 senses',
    category: 'ground',
    blurb: 'Pull yourself back into the room through your senses.',
    minutes: 5,
    forCrisis: true,
    tool: 'grounding54321',
    steps: [
      'Name 5 things you can see.',
      'Name 4 things you can feel touching you.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
      'Say them out loud if you can. Out loud works better than in your head.',
    ],
  },
  {
    id: 'ground_orient',
    name: 'Orient to now',
    category: 'ground',
    blurb: 'For flashbacks and dissociation.',
    minutes: 3,
    forCrisis: true,
    steps: [
      'Say your name, your age, and where you are.',
      'Say today\'s date and the year out loud.',
      'Name three things in the room that did not exist back then.',
      'Press your feet flat into the floor and feel the ground hold you.',
      'That was then. This is a different room, and you got out.',
    ],
  },
  {
    id: 'ground_category',
    name: 'Category game',
    category: 'ground',
    blurb: 'Occupy the part of your brain that is spiralling.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Pick a category: dog breeds, cities, football teams, things that are blue.',
      'Name one for every letter of the alphabet, in order.',
      'When you get stuck, start a new category rather than giving up.',
      'This is deliberately boring. Boring is the medicine.',
    ],
  },
  {
    id: 'ground_feet',
    name: 'Feet on the floor',
    category: 'ground',
    blurb: 'Thirty seconds, works anywhere, nobody notices.',
    minutes: 1,
    forCrisis: true,
    steps: [
      'Put both feet flat on the ground.',
      'Press down through your heels, then your toes.',
      'Notice the floor pressing back. It is holding all of your weight.',
      'Follow that solidity up through your legs to your seat.',
    ],
  },

  // ---- Breathing ----------------------------------------------------------
  {
    id: 'breathe_box',
    name: 'Box breathing',
    category: 'breathe',
    blurb: 'In 4, hold 4, out 4, hold 4.',
    minutes: 4,
    forCrisis: true,
    tool: 'breathing',
    steps: [
      'Breathe in through your nose for 4.',
      'Hold for 4.',
      'Out through your mouth for 4.',
      'Hold empty for 4.',
      'Four rounds minimum. Use the guided pacer so you do not have to count.',
    ],
  },
  {
    id: 'breathe_478',
    name: '4-7-8 breathing',
    category: 'breathe',
    blurb: 'A long slow out-breath is what actually calms you down.',
    minutes: 4,
    forCrisis: true,
    tool: 'breathing',
    steps: [
      'In through the nose for 4.',
      'Hold for 7.',
      'Out through the mouth for 8, slowly, like blowing through a straw.',
      'Four cycles. Stop if you feel lightheaded — shorten the counts instead.',
    ],
  },
  {
    id: 'breathe_paced',
    name: 'Paced breathing',
    category: 'breathe',
    blurb: 'Make the out-breath longer than the in-breath.',
    minutes: 5,
    forCrisis: true,
    tool: 'breathing',
    steps: [
      'In for 4, out for 6. That is the whole technique.',
      'Breathe low, into your belly, not high in your chest.',
      'Five minutes if you can. Two is still worth doing.',
    ],
  },
  {
    id: 'breathe_sigh',
    name: 'Physiological sigh',
    category: 'breathe',
    blurb: 'Two in, one long out. Fastest way down.',
    minutes: 1,
    forCrisis: true,
    steps: [
      'Breathe in through your nose.',
      'On top of that, sip in a second short breath.',
      'Let it all out through your mouth, long and slow.',
      'Three of these is often enough to take the top off a panic spike.',
    ],
  },

  // ---- Self-soothe --------------------------------------------------------
  {
    id: 'soothe_senses',
    name: 'Soothe five senses',
    category: 'soothe',
    blurb: 'Be kind to your body on purpose.',
    minutes: 15,
    forCrisis: false,
    steps: [
      'See: something you find beautiful — a photo, out a window, a plant.',
      'Hear: one song that you know helps, not one that makes it worse.',
      'Smell: coffee, soap, clean laundry, anything strong and good.',
      'Taste: a hot drink, something sharp like mint or lemon.',
      'Touch: a hot shower, a soft blanket, a heavy jumper, a pet.',
    ],
  },
  {
    id: 'soothe_shower',
    name: 'Shower reset',
    category: 'soothe',
    blurb: 'When the day has gone completely wrong.',
    minutes: 20,
    forCrisis: false,
    steps: [
      'Hot as you can stand it. Stay longer than you need to.',
      'Clean clothes afterwards, even if you are going straight back to bed.',
      'Drink a glass of water.',
      'The day is not fixed. But you are a bit more comfortable inside it.',
    ],
  },
  {
    id: 'soothe_weighted',
    name: 'Weight and warmth',
    category: 'soothe',
    blurb: 'Pressure tells your nervous system it is safe.',
    minutes: 10,
    forCrisis: true,
    steps: [
      'Heavy blanket, or lie under a duvet folded double.',
      'Hot water bottle on your chest or stomach.',
      'Cross your arms and squeeze your own shoulders firmly.',
      'Stay there for ten minutes without asking yourself to feel better yet.',
    ],
  },
  {
    id: 'soothe_butterfly',
    name: 'Butterfly hug',
    category: 'soothe',
    blurb: 'Alternating taps, borrowed from trauma therapy.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Cross your arms over your chest, hands on opposite shoulders.',
      'Tap left, right, left, right — slow, like a heartbeat.',
      'Breathe normally. Keep tapping for a minute or two.',
      'Notice what changes. Often it just takes the sharpness off.',
    ],
  },

  // ---- Body and movement --------------------------------------------------
  {
    id: 'move_burst',
    name: 'Burn it off',
    category: 'move',
    blurb: 'Intense effort for 60 seconds changes your body chemistry.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Star jumps, running on the spot, stairs, press-ups against a wall.',
      'Go hard for 60 seconds. Properly out of breath.',
      'Stop, sit, and feel your heart come back down.',
      'Skip or go gentler if you have a heart condition, are unwell, or have not eaten.',
    ],
  },
  {
    id: 'move_pmr',
    name: 'Progressive muscle release',
    category: 'move',
    blurb: 'Tense, hold, let go — from feet to face.',
    minutes: 12,
    forCrisis: false,
    steps: [
      'Lie down. Start at your feet: curl them tight for 5 seconds.',
      'Let go all at once and notice the difference for 10 seconds.',
      'Work up: calves, thighs, stomach, hands, arms, shoulders, jaw, forehead.',
      'Do not hold a tense muscle if it cramps or hurts.',
    ],
  },
  {
    id: 'move_walk',
    name: 'Walk without a destination',
    category: 'move',
    blurb: 'Outside, phone in your pocket, ten minutes.',
    minutes: 20,
    forCrisis: false,
    steps: [
      'Shoes on before you decide whether you feel like it.',
      'Turn left at random. Ten minutes out, ten minutes back.',
      'Look up at roofline height — it changes what your brain does.',
      'Daylight counts double, even through cloud.',
    ],
  },
  {
    id: 'move_stretch',
    name: 'Unfold',
    category: 'move',
    blurb: 'For a body that has been curled up for hours.',
    minutes: 8,
    forCrisis: false,
    steps: [
      'Stand up. Reach both arms straight overhead and hold for 10 seconds.',
      'Roll your shoulders back five times.',
      'Slowly bend forward and let your head hang heavy.',
      'Roll up one vertebra at a time.',
      'Open your jaw wide, then let it go slack.',
    ],
  },

  // ---- Thinking tools -----------------------------------------------------
  {
    id: 'think_stop',
    name: 'STOP',
    category: 'think',
    blurb: 'Stop, Take a step back, Observe, Proceed mindfully.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Stop. Do not move, do not act, freeze for a moment.',
      'Take a step back. Physically, if you can. Breathe out.',
      'Observe. What is happening, in and around you, in plain words?',
      'Proceed mindfully. Ask: what does the version of me from next week want here?',
    ],
  },
  {
    id: 'think_record',
    name: 'Check the thought',
    category: 'think',
    blurb: 'Put the harshest thought on trial.',
    minutes: 12,
    forCrisis: false,
    steps: [
      'Write the thought down word for word, however cruel it is.',
      'What is the actual evidence for it?',
      'What is the evidence against it that you keep skipping over?',
      'What would you say to a friend who said this about themselves?',
      'Write a version that is both kinder and still honest.',
    ],
  },
  {
    id: 'think_opposite',
    name: 'Opposite action',
    category: 'think',
    blurb: 'When the feeling is telling you to do the thing that makes it worse.',
    minutes: 10,
    forCrisis: false,
    steps: [
      'Name the emotion and what it is urging you to do.',
      'Ask: does acting on this fit the facts, or just the feeling?',
      'If it does not fit, do the opposite, fully. Shame says hide — so text someone.',
      'All the way, not half-heartedly. Half measures teach the feeling it was right.',
    ],
  },
  {
    id: 'think_postpone',
    name: 'Worry postponement',
    category: 'think',
    blurb: 'Book the worry in for later so it stops interrupting.',
    minutes: 5,
    forCrisis: false,
    steps: [
      'Write the worry in one line.',
      'Set a specific 15 minute slot later today to worry about it properly.',
      'When it comes back before then, tell it: 6pm, I wrote it down.',
      'At 6pm, worry deliberately for 15 minutes. Most of it will have deflated.',
    ],
  },
  {
    id: 'think_accept',
    name: 'Radical acceptance',
    category: 'think',
    blurb: 'For the things that cannot be fixed tonight.',
    minutes: 10,
    forCrisis: false,
    steps: [
      'Say the fact out loud, plainly, without arguing with it.',
      'Notice where you are fighting reality: "this should not be happening".',
      'Accepting it is not approving of it. It is stopping the second fight.',
      'Ask: given that this is true, what is the next small thing I can do?',
    ],
  },

  // ---- Connection ---------------------------------------------------------
  {
    id: 'connect_text',
    name: 'Send the text',
    category: 'connect',
    blurb: 'You do not have to explain everything.',
    minutes: 5,
    forCrisis: true,
    steps: [
      'Pick one person. Not the perfect person, just one.',
      'You can copy this: "Having a rough night. Can you talk, or just send me something dumb?"',
      'You do not owe them the whole story to be allowed to reach out.',
      'If nobody answers, that is about their evening, not about your worth.',
      'A crisis line counts as a person. They are there specifically for this.',
    ],
  },
  {
    id: 'connect_presence',
    name: 'Be near someone',
    category: 'connect',
    blurb: 'Company without conversation.',
    minutes: 30,
    forCrisis: true,
    steps: [
      'Go where people are: kitchen, a cafe, a library, a shop.',
      'You do not have to talk to anyone or explain why you are there.',
      'Being alone with an urge is much harder than being near strangers with it.',
    ],
  },
  {
    id: 'connect_animal',
    name: 'Look after something',
    category: 'connect',
    blurb: 'A pet, a plant, a person. Care given works both ways.',
    minutes: 10,
    forCrisis: false,
    steps: [
      'Feed the animal, water the plant, wash a mug for someone.',
      'Do it slowly and pay attention to it.',
      'Being needed by something is a legitimate reason to stay.',
    ],
  },

  // ---- Expression ---------------------------------------------------------
  {
    id: 'create_dump',
    name: 'Brain dump',
    category: 'create',
    blurb: 'Ten minutes, no editing, nobody reads it.',
    minutes: 10,
    forCrisis: false,
    steps: [
      'Open a journal entry or grab paper.',
      'Write without stopping for ten minutes. Do not fix spelling. Do not be fair.',
      'If you run out, write "I do not know what to write" until something comes.',
      'You can delete it afterwards. Getting it out of your head is the point.',
    ],
  },
  {
    id: 'create_letter',
    name: 'Letter to next week',
    category: 'create',
    blurb: 'Write to the version of you who got through this.',
    minutes: 15,
    forCrisis: false,
    steps: [
      'Address it to yourself, seven days from now.',
      'Tell them what tonight was like. Do not soften it.',
      'Ask them one question you want answered.',
      'Tell them one thing you hope they remembered to do.',
    ],
  },
  {
    id: 'create_draw',
    name: 'Make a mess on paper',
    category: 'create',
    blurb: 'Scribble, tear, colour in. No skill required.',
    minutes: 15,
    forCrisis: true,
    steps: [
      'Any paper, any pen. Press hard.',
      'Scribble until the page is full, or tear it into the smallest pieces you can.',
      'Colouring one shape in completely also works — repetitive and absorbing.',
      'Throw it away or keep it. Either is fine.',
    ],
  },
  {
    id: 'create_music',
    name: 'Change the soundtrack',
    category: 'create',
    blurb: 'Match the mood first, then move it.',
    minutes: 15,
    forCrisis: true,
    steps: [
      'Start with a song that matches how you feel. Do not force cheerful.',
      'Then queue something one step lighter. Then one more.',
      'Sing or move if you are alone. Loud helps.',
    ],
  },
];

export function skillById(id: string): CopingSkill | undefined {
  return COPING_SKILLS.find((s) => s.id === id);
}

export function crisisSkills(): CopingSkill[] {
  return COPING_SKILLS.filter((s) => s.forCrisis);
}

export function skillsByCategory(category: CopingCategory): CopingSkill[] {
  return COPING_SKILLS.filter((s) => s.category === category);
}
