import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import {
  addHardMoment,
  addReason,
  getSettings,
  listHardMoments,
  listMoodEntries,
} from '@/db/repos';
import { COPING_SKILLS, crisisSkills } from '@/domain/copingCatalog';
import { regionByCode } from '@/domain/crisisResources';
import { assessRisk, type RiskAssessment } from '@/domain/riskAssessment';
import type {
  HardMomentBehaviour,
  HardMomentKind,
  SuicidalThoughts,
} from '@/domain/types';
import { TRIGGERS } from '@/domain/vocab';
import { EMOTIONS } from '@/domain/vocab';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  Chip,
  ChipGroup,
  Field,
  Heading,
  Label,
  Muted,
  ScalePicker,
  Screen,
  SegmentedControl,
  Title,
  Toggle,
} from '@/ui/components/base';
import { radius, riskColors, spacing, useTheme } from '@/ui/theme';
import { dial, openResource } from '@/utils/contact';

type Step =
  | 'kind'
  | 'context'
  | 'safety'
  | 'support'
  | 'prevention'
  | 'reasons'
  | 'care'
  | 'done';

const BEHAVIOURS: { value: HardMomentBehaviour; label: string }[] = [
  { value: 'self_harm', label: 'Self-harm' },
  { value: 'suicidal_thoughts', label: 'Suicidal thoughts' },
  { value: 'substance', label: 'Drinking or using' },
  { value: 'disordered_eating', label: 'Eating or purging' },
  { value: 'other', label: 'Something else' },
];

export default function HardMomentScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('kind');
  const [saving, setSaving] = useState(false);

  const [kind, setKind] = useState<HardMomentKind>('urge');
  const [behaviour, setBehaviour] = useState<HardMomentBehaviour>('self_harm');
  const [intensity, setIntensity] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [copingTried, setCopingTried] = useState<string[]>([]);
  const [suicidalThoughts, setSuicidalThoughts] = useState<SuicidalThoughts>('none');
  const [needsMedical, setNeedsMedical] = useState(false);
  const [toldSomeone, setToldSomeone] = useState(false);
  const [preventionPlan, setPreventionPlan] = useState('');
  const [reasons, setReasons] = useState<string[]>(['']);
  const [aftercare, setAftercare] = useState('');
  const [note, setNote] = useState('');

  const loadHistory = useCallback(
    async (database: Parameters<typeof listHardMoments>[0]) => ({
      history: await listHardMoments(database, 200),
      moods: await listMoodEntries(database, 60),
    }),
    [],
  );
  const { data: history } = useData(loadHistory, { history: [], moods: [] });

  const assessment: RiskAssessment = useMemo(
    () =>
      assessRisk({
        current: {
          kind,
          behaviour,
          intensity,
          suicidalThoughts,
          needsMedicalAttention: needsMedical,
          toldSomeone,
        },
        history: history.history,
        recentMoods: history.moods,
      }),
    [
      kind,
      behaviour,
      intensity,
      suicidalThoughts,
      needsMedical,
      toldSomeone,
      history,
    ],
  );

  const cleanReasons = reasons.map((r) => r.trim()).filter((r) => r !== '');

  async function save() {
    setSaving(true);
    try {
      const moment = await addHardMoment(db, {
        kind,
        behaviour,
        intensity,
        triggers,
        feelings,
        copingTried,
        toldSomeone,
        suicidalThoughts,
        needsMedicalAttention: needsMedical,
        preventionPlan: preventionPlan.trim(),
        reasons: cleanReasons,
        aftercare: aftercare.trim(),
        note: note.trim(),
        assessedLevel: assessment.level,
      });
      // The reasons carry over to the crisis screen and the reasons list, so
      // the next bad night starts with the person's own words already there.
      for (const reason of cleanReasons) {
        await addReason(db, reason, 'hard_moment', moment.id);
      }
      setStep('done');
    } catch (error) {
      console.warn('Failed to save hard moment', error);
      Alert.alert(
        'Could not save',
        'Something went wrong writing this to the device. Your answers are still on screen — try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------------

  if (step === 'kind') {
    return (
      <Screen>
        <Card>
          <Title>What happened?</Title>
          <Muted>
            However you answer, this stays on your phone. Nothing is sent
            anywhere and nobody is notified. Being honest here only ever helps
            you.
          </Muted>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Label>Was it an urge, or did it happen?</Label>
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: 'urge', label: 'I had the urge' },
              { value: 'incident', label: 'It happened' },
            ]}
          />
          <Muted>
            {kind === 'urge'
              ? 'You felt the pull and you did not act on it. That is worth recording — it is the part that usually goes unnoticed.'
              : 'Thank you for saying so. This is a record, not a confession, and there is nothing to be ashamed of on this screen.'}
          </Muted>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Label>What was it about?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {BEHAVIOURS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                tone="danger"
                selected={behaviour === option.value}
                onPress={() => setBehaviour(option.value)}
              />
            ))}
          </View>
        </View>

        <Button label="Next" onPress={() => setStep('context')} />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (step === 'context') {
    return (
      <Screen>
        <Heading>How strong was it?</Heading>
        <ScalePicker value={intensity} onChange={setIntensity} />
        <Muted>1 is a passing thought. 10 is the strongest it has ever been.</Muted>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Label>What set it off?</Label>
          <ChipGroup
            options={TRIGGERS}
            selected={triggers}
            tone="danger"
            onToggle={(value) =>
              setTriggers((current) =>
                current.includes(value)
                  ? current.filter((t) => t !== value)
                  : [...current, value],
              )
            }
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Label>What were you feeling?</Label>
          <ChipGroup
            options={EMOTIONS}
            selected={feelings}
            tone="danger"
            onToggle={(value) =>
              setFeelings((current) =>
                current.includes(value)
                  ? current.filter((f) => f !== value)
                  : [...current, value],
              )
            }
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Label>Did you try anything first?</Label>
          <Muted>No wrong answer. "Nothing" is a normal answer.</Muted>
          <ChipGroup
            options={crisisSkills().map((s) => s.name)}
            selected={copingTried.map(
              (id) => COPING_SKILLS.find((s) => s.id === id)?.name ?? id,
            )}
            onToggle={(name) => {
              const skill = COPING_SKILLS.find((s) => s.name === name);
              if (!skill) return;
              setCopingTried((current) =>
                current.includes(skill.id)
                  ? current.filter((id) => id !== skill.id)
                  : [...current, skill.id],
              );
            }}
          />
        </View>

        <Button label="Next" onPress={() => setStep('safety')} />
        <Button label="Back" variant="ghost" onPress={() => setStep('kind')} />
      </Screen>
    );
  }

  if (step === 'safety') {
    return (
      <Screen>
        <Card>
          <Heading>A few safety questions</Heading>
          <Muted>
            These decide whether this app should be pointing you towards a real
            person tonight. Answer them straight — there is no wrong answer and
            no consequence for saying yes.
          </Muted>
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Toggle
            label="I need medical attention"
            helper="A wound that will not stop bleeding, something you swallowed, anything you would take a friend to a doctor for."
            value={needsMedical}
            onChange={setNeedsMedical}
          />
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Label>Have you been having thoughts of suicide?</Label>
          <View style={{ gap: spacing.sm }}>
            {[
              { value: 'none' as const, label: 'No', helper: 'Not right now.' },
              {
                value: 'passive' as const,
                label: 'I wish I was not here',
                helper: 'Thoughts of not existing, of not waking up, of disappearing.',
              },
              {
                value: 'active' as const,
                label: 'I have thought about acting on it',
                helper: 'Thoughts about doing something, whether or not you have a plan.',
              },
            ].map((option) => {
              const selected = suicidalThoughts === option.value;
              return (
                <Card
                  key={option.value}
                  style={{
                    borderColor: selected ? colors.danger : colors.border,
                    borderWidth: selected ? 2 : 1,
                  }}
                >
                  <Toggle
                    label={option.label}
                    helper={option.helper}
                    value={selected}
                    onChange={() => setSuicidalThoughts(option.value)}
                  />
                </Card>
              );
            })}
          </View>
        </View>

        <Card>
          <Toggle
            label="Someone else knows about tonight"
            helper="A friend, family member, partner, therapist, or a crisis line you have already contacted."
            value={toldSomeone}
            onChange={setToldSomeone}
          />
        </Card>

        <Button
          label="Next"
          onPress={() =>
            setStep(assessment.recommendResources ? 'support' : 'prevention')
          }
        />
        <Button label="Back" variant="ghost" onPress={() => setStep('context')} />
      </Screen>
    );
  }

  if (step === 'support') {
    return <SupportStep assessment={assessment} onContinue={() => setStep('prevention')} />;
  }

  if (step === 'prevention') {
    const ready = preventionPlan.trim().length >= 10;
    return (
      <Screen>
        <Card>
          <Heading>What will you do differently next time?</Heading>
          <Muted>
            Not a promise to never feel this way again — a plan for the next time
            you do. The more specific it is, the more use it will be at 2am when
            you cannot think straight.
          </Muted>
        </Card>

        <Field
          label="My plan for next time"
          value={preventionPlan}
          onChangeText={setPreventionPlan}
          multiline
          minHeight={140}
          autoFocus
          placeholder="e.g. Text Sam before it gets bad, not after. Put the box in the loft. Get out of the flat and walk to the shop."
          helper={
            ready
              ? undefined
              : 'Write at least a sentence. This is the part future you will read.'
          }
        />

        <Card tone="soft">
          <Label>If you are stuck, finish one of these</Label>
          <Muted>• The first sign it is starting again will be…</Muted>
          <Muted>• The thing I will move out of reach is…</Muted>
          <Muted>• The person I will message, before it gets bad, is…</Muted>
          <Muted>• Instead of that, I will try…</Muted>
        </Card>

        <Button label="Next" onPress={() => setStep('reasons')} disabled={!ready} />
        <Button label="Back" variant="ghost" onPress={() => setStep('safety')} />
      </Screen>
    );
  }

  if (step === 'reasons') {
    const ready = cleanReasons.length >= 1;
    return (
      <Screen>
        <Card>
          <Heading>Give yourself at least one reason</Heading>
          <Muted>
            One reason not to do this again. It does not have to be noble or big
            — a pet, a person, a place you want to see, a thing you have not
            finished. Write the honest one, not the impressive one.
          </Muted>
        </Card>

        {reasons.map((reason, index) => (
          <Field
            key={index}
            label={index === 0 ? 'Reason' : `Reason ${index + 1}`}
            value={reason}
            autoFocus={index === 0}
            onChangeText={(value) =>
              setReasons((current) =>
                current.map((r, i) => (i === index ? value : r)),
              )
            }
            placeholder={
              index === 0 ? 'Because my dog waits by the door for me.' : 'One more…'
            }
          />
        ))}

        <Button
          label="Add another reason"
          variant="secondary"
          onPress={() => setReasons((current) => [...current, ''])}
        />

        <Card tone="accent">
          <Muted>
            These get saved to your Reasons list, and they show up on the help
            screen the next time you open it. Tonight-you is writing to
            future-you.
          </Muted>
        </Card>

        <Button label="Next" onPress={() => setStep('care')} disabled={!ready} />
        <Button label="Back" variant="ghost" onPress={() => setStep('prevention')} />
      </Screen>
    );
  }

  if (step === 'care') {
    return (
      <Screen>
        <Heading>Last part</Heading>
        <Field
          label="How will you look after yourself for the rest of today?"
          value={aftercare}
          onChangeText={setAftercare}
          multiline
          minHeight={90}
          placeholder="e.g. Shower, clean clothes, eat something, put a film on and go to bed early."
        />
        <Field
          label="Anything else you want to remember about tonight"
          value={note}
          onChangeText={setNote}
          multiline
          minHeight={90}
          placeholder="Optional."
        />
        {needsMedical ? (
          <Card tone="danger">
            <Heading style={{ color: colors.danger }}>Before you close this</Heading>
            <Body>
              You said this needs medical attention. Please deal with that first
              — it is not an overreaction, and you will not be in trouble.
            </Body>
          </Card>
        ) : null}
        <Button label="Save" onPress={save} loading={saving} />
        <Button label="Back" variant="ghost" onPress={() => setStep('reasons')} />
      </Screen>
    );
  }

  // step === 'done'
  const tone = riskColors(assessment.level, colors);
  return (
    <Screen>
      <Card style={{ backgroundColor: tone.bg, borderColor: tone.fg, gap: spacing.md }}>
        <Title style={{ color: tone.fg }}>Saved</Title>
        <Body>{assessment.message}</Body>
      </Card>

      {assessment.signals.length > 0 ? (
        <Card>
          <Label>What the app noticed</Label>
          {assessment.signals.map((signal, index) => (
            <Body key={index}>• {signal.label}</Body>
          ))}
          <Muted>
            This is a plain checklist, not a diagnosis or a prediction. Only you
            and the people who know you can judge what it means.
          </Muted>
        </Card>
      ) : null}

      <Card tone="accent">
        <Label>Your reason</Label>
        <Body style={{ fontStyle: 'italic' }}>“{cleanReasons[0]}”</Body>
      </Card>

      {assessment.recommendResources ? (
        <Button
          label="Talk to someone now"
          variant="danger"
          onPress={() => router.replace('/crisis')}
        />
      ) : null}
      <Button
        label="Pick something to do next"
        variant="secondary"
        onPress={() => router.replace('/(tabs)/coping')}
      />
      <Button label="Done" variant="ghost" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

/**
 * The step that appears only when the assessment says it should. It is
 * deliberately not skippable in one tap: the continue button says what it is
 * doing rather than pretending the screen was never shown.
 */
function SupportStep({
  assessment,
  onContinue,
}: {
  assessment: RiskAssessment;
  onContinue: () => void;
}) {
  const { colors } = useTheme();
  const tone = riskColors(assessment.level, colors);

  const loadRegion = useCallback(
    async (db: Parameters<typeof getSettings>[0]) => (await getSettings(db)).region,
    [],
  );
  const { data: regionCode } = useData(loadRegion, 'US');
  const region = regionByCode(regionCode);
  const top = region.resources.slice(0, 3);

  return (
    <Screen>
      <Card style={{ backgroundColor: tone.bg, borderColor: tone.fg, gap: spacing.md }}>
        <Title style={{ color: tone.fg }}>
          {assessment.urgeMedicalCare
            ? 'Please get looked at first'
            : 'This is worth telling someone'}
        </Title>
        <Body>{assessment.message}</Body>
      </Card>

      {assessment.signals.length > 0 ? (
        <Card>
          <Label>Why this came up</Label>
          {assessment.signals.map((signal, index) => (
            <Body key={index}>• {signal.label}</Body>
          ))}
        </Card>
      ) : null}

      {assessment.urgeMedicalCare ? (
        <Card tone="danger">
          <Heading style={{ color: colors.danger }}>Emergency services</Heading>
          <Muted>
            You will not be judged, and getting a wound treated is a normal thing
            to ask for.
          </Muted>
          <Button
            label={`Call ${region.emergency}`}
            variant="danger"
            onPress={() => dial(region.emergency)}
          />
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Label>Free, 24/7, confidential</Label>
        {top.map((resource) => (
          <Card key={resource.id}>
            <Heading>{resource.name}</Heading>
            {resource.note ? <Muted>{resource.note}</Muted> : null}
            <Button
              label={resource.display}
              variant={resource.method === 'call' ? 'primary' : 'secondary'}
              onPress={() => openResource(resource)}
            />
          </Card>
        ))}
      </View>

      <View
        style={{
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Muted>
          You can carry on filling this in without calling anyone. The offer
          stays open, and the help screen is one tap away from every screen in
          the app.
        </Muted>
        <Button
          label="I have read this — carry on"
          variant="secondary"
          onPress={onContinue}
        />
      </View>
    </Screen>
  );
}
