# Weekly Mental Tracker

A mental health tracker that runs entirely on your phone. No account, no server,
no analytics — the data lives in a SQLite file inside the app's private storage
and never leaves the device unless you export a backup yourself.

Built with Expo and React Native. Android is the primary target; the same
codebase bundles for iOS and web from the same source, with no platform-specific
branches.

## What it does

**Daily check-in** — mood (1–10), energy, anxiety, hours slept, how it felt in
words, and a note. Twenty seconds.

**Journal** — free-form entries with a rotating set of prompts, searchable.

**Coping skills** — 33 skills across eight categories, each with step-by-step
instructions. Three are interactive: a breathing pacer (box / 4-7-8 / paced),
a guided 5-4-3-2-1 grounding walkthrough, and a 15-minute urge timer. Log which
ones you used and rate whether they actually helped — after a couple of weeks
the app can tell you which ones work *for you* rather than which ones sound
like they should.

**Hard moments** — the part most trackers skip. You can record an urge you rode
out or something that happened, and the flow is the same either way:

1. What it was, and how strong.
2. What set it off, what you felt, what you tried first.
3. Safety questions — do you need medical attention, are you having thoughts of
   suicide, does anyone else know.
4. **A prevention plan.** Required. What you will do differently next time,
   specifically enough to be useful at 2am.
5. **At least one reason not to do it again.** Required. These are saved and
   shown back to you on the help screen, so the argument is already made in
   your own words before the next bad night.
6. Aftercare, and anything else worth remembering.

**Risk check** — after the safety questions, a set of plain rules decides
whether the app should put crisis lines in front of you before you carry on:
active suicidal thoughts, needing medical care, a third incident in a week, a
week of very low mood, an incident nobody else knows about, and so on. It errs
towards showing help. It is a checklist, not a clinical assessment, and it says
so on screen.

**Safety plan** — a Stanley-Brown style plan: warning signs, what you can do
alone, places and people that distract you, who to call, making your space
safer, and reasons to stay. Written on a calm day, read on a bad one. Phone
numbers in it are tappable.

**Crisis screen** — reachable in one tap from *every* screen in the app via the
"Help now" button in the header. Emergency number, region-appropriate crisis
lines (988, Crisis Text Line, Samaritans, Lifeline and others across seven
regions), your own people, your own reasons, the fastest coping skills, and
plain answers to the things that stop people calling ("I'm not in enough
danger", "will they send the police?", "I don't know what to say").

**Weekly summary** — mood chart and average with the change against last week,
check-in count, sleep average, most frequent emotions, which skills you used
and how they scored, urges ridden out versus incidents, days without one, and
a few written observations drawn from the data (sleep against mood, days with
coping practice against days without). Browse back through previous weeks.

**Settings** — region, name, export/restore a JSON backup, and delete
everything permanently.

## Running it

```bash
npm install
npm run android      # or: npm run ios / npm run web
```

You need [Expo Go](https://expo.dev/go) on the device, or a development build.

```bash
npm run typecheck    # tsc --noEmit
npm test             # jest
```

The test suite covers the logic layer — risk assessment, weekly aggregation,
date maths, streaks, and content integrity. 55 tests.

All three platforms build:

```bash
npx expo export --platform android
npx expo export --platform ios
npx expo export --platform web
```

On web, SQLite runs through wa-sqlite in a worker, which needs
`SharedArrayBuffer` and therefore a cross-origin-isolated page. `metro.config.js`
sets the COOP/COEP headers for the dev server; whatever hosts a production web
build has to send them too. Android and iOS have no such requirement.

## How it is put together

```
app/                     expo-router screens (file-based routing)
  (tabs)/                Today, Mood, Journal, Skills, Week
  crisis.tsx             the help screen, reachable from everywhere
  hard-moment.tsx        the multi-step hard-moment flow
  safety-plan.tsx        safety plan editor and reader
  journal/[id].tsx       journal editor (id "new" creates one)
  coping/[id].tsx        skill detail plus its guided tool
src/
  domain/                types and pure logic — no React, no database
    riskAssessment.ts    when to surface crisis resources
    weeklySummary.ts     the week in review
    copingCatalog.ts     the skill library
    crisisResources.ts   helplines by region
  db/                    SQLite schema, migrations, repositories, backup
  ui/                    theme and components
  state/useData.ts       load-on-focus hook
__tests__/               tests for the logic layer
```

The domain layer is deliberately free of React and SQLite imports, which is why
it can be tested in plain Node.

## Privacy

- No network code. The app does not make a single HTTP request.
- No account, no sync, no crash reporting, no analytics.
- Data is stored in `wmtracker.db` in the app's private storage, which other
  apps on the device cannot read.
- The only export is the backup file, created when you tap the button and sent
  wherever you choose. It is plain JSON, so treat it accordingly.
- Deleting everything in Settings actually deletes it.

## Where the content comes from

The coping skills draw on standard self-help material — DBT distress tolerance
(TIPP, STOP, opposite action, radical acceptance), grounding, paced breathing,
and behavioural activation. Nothing in the library involves substituting one
kind of hurt for another: there is no rubber-band snapping, no pinching, no
"safer" version of self-harm, and a test enforces that. The cold-water entries
are the TIPP skill, which works on the nervous system rather than through pain,
and carry the cardiac and eating-disorder cautions.

Crisis numbers were correct at the time of writing for the US, UK, Canada,
Ireland, Australia and New Zealand, with Find A Helpline and the IASP directory
for everywhere else. **Check them against the current published numbers before
shipping this to anyone** — helplines change (the 988 "Press 3" LGBTQ+ service,
for instance, was discontinued in July 2025, which is why the Trevor Project is
listed separately).

## Not a medical device

This is a self-help tool. It is not a therapist, not a monitoring service, and
not a crisis service. Nothing written in it is seen by another human, and
nobody is alerted if you are struggling. The risk checks exist to prompt you
towards real people, not to replace them.

If you are in danger right now, call your local emergency number. In the US,
call or text **988**. In the UK, call **116 123**.

## Next

- Daily reminder notifications (needs a development build; local notifications
  are limited in Expo Go on Android).
- A PIN or biometric lock on opening the app — worth having for a journal on a
  shared phone.
- Longer-range trends beyond the current week.
