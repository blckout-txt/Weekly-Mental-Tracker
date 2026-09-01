export type ContactMethod = 'call' | 'text' | 'chat' | 'web';

export type CrisisResource = {
  id: string;
  name: string;
  /** Who it is for, if it is not for everyone. */
  audience?: string;
  method: ContactMethod;
  /** The number to dial, the short code to text, or the URL to open. */
  value: string;
  /** What the person actually types or dials, shown on the button. */
  display: string;
  hours: string;
  note?: string;
};

export type Region = {
  code: string;
  name: string;
  emergency: string;
  resources: CrisisResource[];
};

export const REGIONS: Region[] = [
  {
    code: 'US',
    name: 'United States',
    emergency: '911',
    resources: [
      {
        id: 'us_988_call',
        name: '988 Suicide & Crisis Lifeline',
        method: 'call',
        value: '988',
        display: 'Call 988',
        hours: '24/7, free',
        note: 'For suicidal thoughts, self-harm, or any mental health crisis. Press 1 for the Veterans Crisis Line, 2 for Spanish.',
      },
      {
        id: 'us_988_text',
        name: '988 Suicide & Crisis Lifeline',
        method: 'text',
        value: '988',
        display: 'Text 988',
        hours: '24/7, free',
        note: 'If talking out loud feels impossible, text instead.',
      },
      {
        id: 'us_988_chat',
        name: '988 Lifeline web chat',
        method: 'chat',
        value: 'https://988lifeline.org/chat/',
        display: 'Open chat',
        hours: '24/7, free',
      },
      {
        id: 'us_ctl',
        name: 'Crisis Text Line',
        method: 'text',
        value: '741741',
        display: 'Text HOME to 741741',
        hours: '24/7, free',
        note: 'Text-only, with a trained volunteer crisis counsellor.',
      },
      {
        id: 'us_trevor',
        name: 'The Trevor Project',
        audience: 'LGBTQ+ young people',
        method: 'call',
        value: '1-866-488-7386',
        display: 'Call 1-866-488-7386',
        hours: '24/7, free',
        note: 'Also text START to 678678, or chat at thetrevorproject.org.',
      },
      {
        id: 'us_trans',
        name: 'Trans Lifeline',
        audience: 'Trans and questioning people',
        method: 'call',
        value: '1-877-565-8860',
        display: 'Call 1-877-565-8860',
        hours: 'See translifeline.org for hours',
        note: 'Peer support, run by trans people. They do not call emergency services without your consent.',
      },
      {
        id: 'us_samhsa',
        name: 'SAMHSA National Helpline',
        audience: 'Substance use and mental health',
        method: 'call',
        value: '1-800-662-4357',
        display: 'Call 1-800-662-4357',
        hours: '24/7, free',
        note: 'Treatment referrals and information, not a crisis line.',
      },
      {
        id: 'us_anad',
        name: 'ANAD Eating Disorders Helpline',
        audience: 'Eating disorders',
        method: 'call',
        value: '1-888-375-7767',
        display: 'Call 1-888-375-7767',
        hours: 'Weekdays, see anad.org',
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    emergency: '999',
    resources: [
      {
        id: 'gb_samaritans',
        name: 'Samaritans',
        method: 'call',
        value: '116123',
        display: 'Call 116 123',
        hours: '24/7, free',
        note: 'You do not have to be suicidal to call. Any distress counts.',
      },
      {
        id: 'gb_shout',
        name: 'Shout',
        method: 'text',
        value: '85258',
        display: 'Text SHOUT to 85258',
        hours: '24/7, free',
      },
      {
        id: 'gb_111',
        name: 'NHS 111',
        method: 'call',
        value: '111',
        display: 'Call 111',
        hours: '24/7',
        note: 'Select the mental health option to reach your local crisis team.',
      },
      {
        id: 'gb_papyrus',
        name: 'PAPYRUS HOPELINE247',
        audience: 'Under 35s',
        method: 'call',
        value: '0800 068 4141',
        display: 'Call 0800 068 4141',
        hours: '24/7, free',
      },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    emergency: '911',
    resources: [
      {
        id: 'ca_988_call',
        name: '9-8-8 Suicide Crisis Helpline',
        method: 'call',
        value: '988',
        display: 'Call 988',
        hours: '24/7, free, English and French',
      },
      {
        id: 'ca_988_text',
        name: '9-8-8 Suicide Crisis Helpline',
        method: 'text',
        value: '988',
        display: 'Text 988',
        hours: '24/7, free',
      },
      {
        id: 'ca_kids',
        name: 'Kids Help Phone',
        audience: 'Young people',
        method: 'text',
        value: '686868',
        display: 'Text CONNECT to 686868',
        hours: '24/7, free',
        note: 'Or call 1-800-668-6868.',
      },
    ],
  },
  {
    code: 'IE',
    name: 'Ireland',
    emergency: '112',
    resources: [
      {
        id: 'ie_samaritans',
        name: 'Samaritans Ireland',
        method: 'call',
        value: '116123',
        display: 'Call 116 123',
        hours: '24/7, free',
      },
      {
        id: 'ie_5080',
        name: 'Text About It',
        method: 'text',
        value: '50808',
        display: 'Text HELLO to 50808',
        hours: '24/7, free',
      },
      {
        id: 'ie_pieta',
        name: 'Pieta House',
        method: 'call',
        value: '1800 247 247',
        display: 'Call 1800 247 247',
        hours: '24/7, free',
      },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    emergency: '000',
    resources: [
      {
        id: 'au_lifeline',
        name: 'Lifeline',
        method: 'call',
        value: '131114',
        display: 'Call 13 11 14',
        hours: '24/7',
        note: 'Also text 0477 13 11 14, or chat at lifeline.org.au.',
      },
      {
        id: 'au_suicide_callback',
        name: 'Suicide Call Back Service',
        method: 'call',
        value: '1300 659 467',
        display: 'Call 1300 659 467',
        hours: '24/7, free',
      },
      {
        id: 'au_beyondblue',
        name: 'Beyond Blue',
        method: 'call',
        value: '1300 22 4636',
        display: 'Call 1300 22 4636',
        hours: '24/7',
      },
      {
        id: 'au_kids',
        name: 'Kids Helpline',
        audience: 'Ages 5 to 25',
        method: 'call',
        value: '1800 55 1800',
        display: 'Call 1800 55 1800',
        hours: '24/7, free',
      },
    ],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    emergency: '111',
    resources: [
      {
        id: 'nz_1737',
        name: '1737 Need to Talk?',
        method: 'call',
        value: '1737',
        display: 'Call or text 1737',
        hours: '24/7, free',
      },
      {
        id: 'nz_lifeline',
        name: 'Lifeline Aotearoa',
        method: 'call',
        value: '0800 543 354',
        display: 'Call 0800 543 354',
        hours: '24/7',
      },
    ],
  },
  {
    code: 'INT',
    name: 'Somewhere else',
    emergency: '112',
    resources: [
      {
        id: 'int_findahelpline',
        name: 'Find A Helpline',
        method: 'web',
        value: 'https://findahelpline.com',
        display: 'findahelpline.com',
        hours: 'Directory',
        note: 'Pick your country and get a verified free crisis line, worldwide.',
      },
      {
        id: 'int_iasp',
        name: 'IASP crisis centre directory',
        method: 'web',
        value: 'https://www.iasp.info/crisis-centres-helplines/',
        display: 'iasp.info',
        hours: 'Directory',
      },
      {
        id: 'int_befrienders',
        name: 'Befrienders Worldwide',
        method: 'web',
        value: 'https://befrienders.org',
        display: 'befrienders.org',
        hours: 'Directory',
      },
    ],
  },
];

export const DEFAULT_REGION = 'US';

export function regionByCode(code: string): Region {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0];
}

/**
 * Plain answers to the reasons people talk themselves out of calling.
 * These are the objections that actually stop someone dialling.
 */
export const CALL_FAQ: { q: string; a: string }[] = [
  {
    q: 'I am not in enough danger to call',
    a: 'Crisis lines are for distress, not just emergencies. Feeling awful is enough. People call about loneliness, panic, urges, and bad nights every day, and nobody is turned away for not being bad enough.',
  },
  {
    q: 'Will they send the police or an ambulance?',
    a: 'Usually not. The overwhelming majority of calls end on the phone with nobody being sent anywhere. Emergency services get involved only when there is an immediate risk to life and it cannot be resolved on the call. You can ask a counsellor about this directly at the start of the call.',
  },
  {
    q: 'I do not know what to say',
    a: '"I do not really know what to say, I am just having a bad night" is a completely normal opening. They are trained to take it from there. You do not need a prepared story.',
  },
  {
    q: 'I cannot speak out loud',
    a: 'Text and chat services exist for exactly this. In the US, text 988 or text HOME to 741741. In the UK, text SHOUT to 85258.',
  },
  {
    q: 'I called before and it did not help',
    a: 'Different counsellors land differently, the same way therapists do. Hanging up and calling back to get someone else is a normal, accepted thing to do.',
  },
];
