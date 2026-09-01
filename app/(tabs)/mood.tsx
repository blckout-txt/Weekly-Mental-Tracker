import { useCallback } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';

import { deleteMoodEntry, listMoodEntries } from '@/db/repos';
import { buildWeeklySummary } from '@/domain/weeklySummary';
import type { MoodEntry } from '@/domain/types';
import { ANXIETY_LABELS, ENERGY_LABELS, MOOD_LABELS } from '@/domain/vocab';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  EmptyState,
  Heading,
  Label,
  Muted,
  Row,
  Screen,
} from '@/ui/components/base';
import { MoodChart } from '@/ui/components/MoodChart';
import { fontSize, moodColor, radius, spacing, useTheme } from '@/ui/theme';
import { clockTime, relativeDay, todayKey } from '@/utils/date';

export default function MoodScreen() {
  const db = useSQLiteContext();
  const { colors, dark } = useTheme();

  const load = useCallback(
    (database: SQLiteDatabase) => listMoodEntries(database, 200),
    [],
  );
  const { data: entries, reload } = useData<MoodEntry[]>(load, []);

  const today = todayKey();
  const week = buildWeeklySummary(
    today,
    { moods: entries, journals: [], coping: [], hardMoments: [] },
    undefined,
    today,
  );

  function confirmDelete(entry: MoodEntry) {
    Alert.alert(
      'Delete this check-in?',
      'It will be removed from your history and your weekly summary.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMoodEntry(db, entry.id);
            reload();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Button label="Check in now" onPress={() => router.push('/check-in')} />

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing tracked yet"
          message="Check in once a day for a week and the patterns start showing up on their own — especially around sleep."
        />
      ) : (
        <>
          <Card>
            <Label>This week</Label>
            <MoodChart points={week.moodByDay} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Muted>
                {week.moodAvg === null
                  ? 'No check-ins yet this week'
                  : `Average ${week.moodAvg}/10`}
              </Muted>
              <Muted>
                {week.checkInDays} of {week.daysElapsed} days
              </Muted>
            </Row>
          </Card>

          <Label>History</Label>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onLongPress={() => confirmDelete(entry)}
              accessibilityRole="button"
              accessibilityHint="Long press to delete"
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={spacing.sm}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.sm,
                      backgroundColor: moodColor(entry.mood, dark),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Body style={{ color: '#FFFFFF', fontWeight: '800' }}>
                      {entry.mood}
                    </Body>
                  </View>
                  <View>
                    <Body style={{ fontWeight: '600' }}>{MOOD_LABELS[entry.mood]}</Body>
                    <Muted>
                      {relativeDay(entry.day, today)} · {clockTime(entry.createdAt)}
                    </Muted>
                  </View>
                </Row>
              </Row>

              <Row gap={spacing.md} style={{ flexWrap: 'wrap' }}>
                <Muted>Energy: {ENERGY_LABELS[entry.energy]}</Muted>
                <Muted>Anxiety: {ANXIETY_LABELS[entry.anxiety]}</Muted>
                {entry.sleepHours !== null ? (
                  <Muted>Slept: {entry.sleepHours}h</Muted>
                ) : null}
              </Row>

              {entry.emotions.length > 0 ? (
                <Muted style={{ fontSize: fontSize.xs }}>
                  {entry.emotions.join(' · ')}
                </Muted>
              ) : null}
              {entry.note ? <Body>{entry.note}</Body> : null}
            </Pressable>
          ))}
          <Muted style={{ textAlign: 'center' }}>Long press an entry to delete it.</Muted>
        </>
      )}
    </Screen>
  );
}
