import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Label,
  Muted,
  Row,
  Title,
} from '@/ui/components/base';
import { fontSize, radius, spacing, useTheme } from '@/ui/theme';

// ---------------------------------------------------------------------------
// Breathing pacer
// ---------------------------------------------------------------------------

type Phase = { name: string; seconds: number };

export type BreathingPattern = {
  id: string;
  label: string;
  phases: Phase[];
};

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    label: 'Box 4-4-4-4',
    phases: [
      { name: 'Breathe in', seconds: 4 },
      { name: 'Hold', seconds: 4 },
      { name: 'Breathe out', seconds: 4 },
      { name: 'Hold', seconds: 4 },
    ],
  },
  {
    id: '478',
    label: '4-7-8',
    phases: [
      { name: 'Breathe in', seconds: 4 },
      { name: 'Hold', seconds: 7 },
      { name: 'Breathe out', seconds: 8 },
    ],
  },
  {
    id: 'paced',
    label: 'Paced 4-6',
    phases: [
      { name: 'Breathe in', seconds: 4 },
      { name: 'Breathe out', seconds: 6 },
    ],
  },
];

/**
 * A circle that grows on the in-breath and shrinks on the out-breath, with the
 * remaining seconds in the middle. Following a shape is easier than counting
 * when you are already panicking.
 */
export function BreathingTool({ patternId }: { patternId?: string }) {
  const { colors } = useTheme();
  const [pattern, setPattern] = useState<BreathingPattern>(
    BREATHING_PATTERNS.find((p) => p.id === patternId) ?? BREATHING_PATTERNS[0],
  );
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(pattern.phases[0].seconds);
  const [cycles, setCycles] = useState(0);

  const scale = useRef(new Animated.Value(0.55)).current;

  // Reset whenever the pattern changes or the person stops.
  useEffect(() => {
    setPhaseIndex(0);
    setRemaining(pattern.phases[0].seconds);
    setCycles(0);
  }, [pattern]);

  // One interval per phase, driven off wall-clock time so it stays accurate
  // even if the device throttles timers in the background.
  useEffect(() => {
    if (!running) return;
    const phase = pattern.phases[phaseIndex];
    setRemaining(phase.seconds);
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = phase.seconds - elapsed;
      if (left > 0) {
        setRemaining(left);
        return;
      }
      const next = (phaseIndex + 1) % pattern.phases.length;
      setPhaseIndex(next);
      if (next === 0) setCycles((c) => c + 1);
    }, 250);

    return () => clearInterval(timer);
  }, [running, phaseIndex, pattern]);

  // Grow on the in-breath, shrink on the out-breath, hold still on a hold.
  useEffect(() => {
    if (!running) return;
    const phase = pattern.phases[phaseIndex];
    const target =
      phase.name === 'Breathe in' ? 1 : phase.name === 'Breathe out' ? 0.55 : undefined;
    if (target === undefined) return;

    const animation = Animated.timing(scale, {
      toValue: target,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [phaseIndex, running, pattern, scale]);

  const phase = pattern.phases[phaseIndex];

  return (
    <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
      <Row gap={spacing.sm} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {BREATHING_PATTERNS.map((option) => (
          <Button
            key={option.id}
            label={option.label}
            fullWidth={false}
            variant={option.id === pattern.id ? 'primary' : 'secondary'}
            onPress={() => {
              setRunning(false);
              setPattern(option);
            }}
          />
        ))}
      </Row>

      <View style={{ height: 220, width: 220, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: colors.primarySoft,
            borderWidth: 2,
            borderColor: colors.primary,
            transform: [{ scale }],
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <Title style={{ color: colors.primary }}>{running ? phase.name : 'Ready'}</Title>
          <Title style={{ fontSize: 48, color: colors.text }}>
            {running ? remaining : pattern.phases[0].seconds}
          </Title>
        </View>
      </View>

      <Muted>{cycles} full {cycles === 1 ? 'round' : 'rounds'}</Muted>

      <Button
        label={running ? 'Stop' : 'Start'}
        variant={running ? 'secondary' : 'primary'}
        onPress={() => setRunning((value) => !value)}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 5-4-3-2-1 grounding
// ---------------------------------------------------------------------------

const SENSES = [
  { count: 5, sense: 'see', instruction: 'Look around and name 5 things you can see.' },
  { count: 4, sense: 'feel', instruction: 'Name 4 things you can feel touching you.' },
  { count: 3, sense: 'hear', instruction: 'Name 3 things you can hear.' },
  { count: 2, sense: 'smell', instruction: 'Name 2 things you can smell.' },
  { count: 1, sense: 'taste', instruction: 'Name 1 thing you can taste.' },
];

/** Walks through the senses one at a time so there is only ever one thing to do. */
export function GroundingTool() {
  const { colors } = useTheme();
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(
    SENSES.map((s) => Array(s.count).fill('')),
  );

  if (stage >= SENSES.length) {
    return (
      <Card tone="accent" style={{ gap: spacing.md }}>
        <Heading>You are here</Heading>
        <Body>
          That is the whole exercise. Your attention is back in the room, at
          least a little. If it helped, do it again more slowly.
        </Body>
        <Button
          label="Start again"
          variant="secondary"
          onPress={() => {
            setStage(0);
            setAnswers(SENSES.map((s) => Array(s.count).fill('')));
          }}
        />
      </Card>
    );
  }

  const current = SENSES[stage];
  const filled = answers[stage].filter((a) => a.trim() !== '').length;

  return (
    <Card style={{ gap: spacing.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>Step {stage + 1} of {SENSES.length}</Label>
        <Muted>
          {filled}/{current.count}
        </Muted>
      </Row>

      <View
        style={{
          height: 4,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.pill,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${(stage / SENSES.length) * 100}%`,
            height: '100%',
            backgroundColor: colors.primary,
          }}
        />
      </View>

      <Title style={{ fontSize: fontSize.lg }}>{current.instruction}</Title>

      {answers[stage].map((answer, index) => (
        <Field
          key={index}
          value={answer}
          autoFocus={index === 0}
          placeholder={`Something you can ${current.sense}…`}
          onChangeText={(value) =>
            setAnswers((current2) =>
              current2.map((row, rowIndex) =>
                rowIndex === stage
                  ? row.map((item, i) => (i === index ? value : item))
                  : row,
              ),
            )
          }
        />
      ))}

      <Button
        label={stage === SENSES.length - 1 ? 'Finish' : 'Next'}
        onPress={() => setStage((s) => s + 1)}
      />
      <Muted>
        You can move on without filling all of them in. Naming them out loud
        works better than typing, if you are somewhere you can.
      </Muted>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Wait-it-out timer
// ---------------------------------------------------------------------------

/**
 * A countdown for "not now, just not in the next fifteen minutes". It counts
 * up the completed rounds so postponing again feels like progress rather than
 * failure.
 */
export function DelayTimer({ minutes = 15 }: { minutes?: number }) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((seconds) => {
        if (seconds <= 1) {
          setRunning(false);
          setRounds((r) => r + 1);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const done = remaining === 0;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <Title style={{ fontSize: 56, color: done ? colors.accent : colors.text }}>
        {mm}:{ss < 10 ? `0${ss}` : ss}
      </Title>

      {done ? (
        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Heading style={{ color: colors.accent }}>You made it</Heading>
          <Muted style={{ textAlign: 'center' }}>
            That is {rounds * minutes} minutes you did not act on it. How is the
            urge now compared to when you started? If it dropped at all, another
            fifteen will drop it further.
          </Muted>
        </View>
      ) : (
        <Muted style={{ textAlign: 'center' }}>
          You are not deciding never. You are deciding not in the next{' '}
          {minutes} minutes.
        </Muted>
      )}

      <Button
        label={done ? 'Another 15 minutes' : running ? 'Pause' : 'Start'}
        onPress={() => {
          if (done) {
            setRemaining(minutes * 60);
            setRunning(true);
          } else {
            setRunning((value) => !value);
          }
        }}
      />
      {rounds > 0 ? <Muted>{rounds} rounds so far</Muted> : null}
    </Card>
  );
}
