import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { addMoodEntry } from '@/db/repos';
import {
  ANXIETY_LABELS,
  EMOTIONS,
  ENERGY_LABELS,
  MOOD_LABELS,
} from '@/domain/vocab';
import {
  Body,
  Button,
  Card,
  ChipGroup,
  Field,
  Heading,
  Label,
  Muted,
  ScalePicker,
  Screen,
  Title,
} from '@/ui/components/base';
import { moodColor, spacing, useTheme } from '@/ui/theme';

export default function CheckInScreen() {
  const db = useSQLiteContext();
  const { dark } = useTheme();

  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [sleep, setSleep] = useState('');
  const [emotions, setEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const parsedSleep = sleep.trim() === '' ? null : Number(sleep.replace(',', '.'));
      await addMoodEntry(db, {
        mood,
        energy,
        anxiety,
        sleepHours:
          parsedSleep === null || Number.isNaN(parsedSleep) || parsedSleep < 0
            ? null
            : Math.min(24, parsedSleep),
        emotions,
        note: note.trim(),
      });
      router.back();
    } catch (error) {
      console.warn('Failed to save check-in', error);
      Alert.alert('Could not save', 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Title>How is it going?</Title>
        <Muted>
          There is no right answer and no streak to protect. A 3 is as useful a
          data point as a 9.
        </Muted>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Label>Mood</Label>
        <ScalePicker
          value={mood}
          onChange={setMood}
          colorFor={(value) => moodColor(value, dark)}
        />
        <Body style={{ fontWeight: '600', color: moodColor(mood, dark) }}>
          {MOOD_LABELS[mood]}
        </Body>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>Energy</Label>
        <ScalePicker min={1} max={5} value={energy} onChange={setEnergy} />
        <Muted>{ENERGY_LABELS[energy]}</Muted>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>Anxiety</Label>
        <ScalePicker min={1} max={5} value={anxiety} onChange={setAnxiety} />
        <Muted>{ANXIETY_LABELS[anxiety]}</Muted>
      </View>

      <Field
        label="Hours slept last night"
        value={sleep}
        onChangeText={setSleep}
        keyboardType="decimal-pad"
        placeholder="e.g. 6.5"
        helper="Optional, but it is the single strongest pattern most people find."
      />

      <View style={{ gap: spacing.sm }}>
        <Label>What has today felt like?</Label>
        <ChipGroup
          options={EMOTIONS}
          selected={emotions}
          onToggle={(value) =>
            setEmotions((current) =>
              current.includes(value)
                ? current.filter((e) => e !== value)
                : [...current, value],
            )
          }
        />
      </View>

      <Field
        label="Anything worth remembering"
        value={note}
        onChangeText={setNote}
        multiline
        minHeight={90}
        placeholder="Optional. One line is plenty."
      />

      <Button label="Save check-in" onPress={save} loading={saving} />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
