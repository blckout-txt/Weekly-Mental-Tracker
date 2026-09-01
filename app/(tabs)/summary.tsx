import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  listCopingLogsBetween,
  listHardMomentsBetween,
  listJournalEntries,
  listMoodEntriesBetween,
} from '@/db/repos';
import { buildWeeklySummary, type WeeklySummary } from '@/domain/weeklySummary';
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
  Title,
} from '@/ui/components/base';
import { MoodChart } from '@/ui/components/MoodChart';
import { fontSize, radius, spacing, useTheme } from '@/ui/theme';
import { addDays, endOfWeek, startOfWeek, todayKey } from '@/utils/date';

export default function SummaryScreen() {
  const { colors } = useTheme();
  // 0 = this week, 1 = last week, and so on.
  const [weeksBack, setWeeksBack] = useState(0);

  const anchor = addDays(todayKey(), -7 * weeksBack);

  const load = useCallback(
    async (db: SQLiteDatabase): Promise<WeeklySummary> => {
      const start = startOfWeek(anchor);
      const end = endOfWeek(anchor);
      const prevStart = addDays(start, -7);
      const prevEnd = addDays(start, -1);

      const [moods, coping, hardMoments, journals, prevMoods] = await Promise.all([
        listMoodEntriesBetween(db, start, end),
        listCopingLogsBetween(db, start, end),
        listHardMomentsBetween(db, start, end),
        listJournalEntries(db, 1000),
        listMoodEntriesBetween(db, prevStart, prevEnd),
      ]);

      return buildWeeklySummary(
        anchor,
        { moods, journals, coping, hardMoments },
        { moods: prevMoods, journals: [], coping: [], hardMoments: [] },
        weeksBack === 0 ? todayKey() : undefined,
      );
    },
    [anchor, weeksBack],
  );

  const { data: summary, loading } = useData<WeeklySummary | null>(load, null);

  if (loading && !summary) {
    return (
      <Screen>
        <Muted>Working it out…</Muted>
      </Screen>
    );
  }

  if (!summary) return null;

  const nothingRecorded =
    summary.checkInDays === 0 &&
    summary.journalCount === 0 &&
    summary.copingCount === 0 &&
    summary.urges === 0 &&
    summary.incidents === 0;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Label>{weeksBack === 0 ? 'This week' : `${weeksBack} weeks ago`}</Label>
          <Title>{summary.label}</Title>
        </View>
      </Row>

      <Row gap={spacing.sm}>
        <Button
          label="← Earlier"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={() => setWeeksBack((w) => w + 1)}
        />
        <Button
          label="Later →"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          disabled={weeksBack === 0}
          onPress={() => setWeeksBack((w) => Math.max(0, w - 1))}
        />
      </Row>

      {nothingRecorded ? (
        <EmptyState
          title="Nothing recorded this week"
          message="A blank week is not a failed week. Whenever you are ready, one check-in is enough to start it off."
          action={{ label: 'Check in', onPress: () => router.push('/check-in') }}
        />
      ) : (
        <>
          <Card>
            <Label>Mood</Label>
            <MoodChart points={summary.moodByDay} />
            <Row gap={spacing.lg} style={{ marginTop: spacing.sm, flexWrap: 'wrap' }}>
              <Metric
                label="Average"
                value={summary.moodAvg === null ? '—' : `${summary.moodAvg}`}
                sub={
                  summary.moodDelta === null
                    ? undefined
                    : `${summary.moodDelta > 0 ? '+' : ''}${summary.moodDelta} vs last week`
                }
              />
              <Metric
                label="Range"
                value={
                  summary.moodLow === null
                    ? '—'
                    : `${summary.moodLow}–${summary.moodHigh}`
                }
              />
              <Metric
                label="Check-ins"
                value={`${summary.checkInDays}/${summary.daysElapsed}`}
                sub="days"
              />
              <Metric
                label="Sleep"
                value={summary.sleepAvg === null ? '—' : `${summary.sleepAvg}h`}
                sub="average"
              />
            </Row>
          </Card>

          {summary.insights.length > 0 ? (
            <Card tone="soft">
              <Label>What stood out</Label>
              {summary.insights.map((insight, index) => (
                <Body key={index} style={{ marginBottom: spacing.xs }}>
                  {insight}
                </Body>
              ))}
            </Card>
          ) : null}

          {summary.topEmotions.length > 0 ? (
            <Card>
              <Label>How it felt</Label>
              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                {summary.topEmotions.map((item) => (
                  <View key={item.emotion} style={{ gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Body>{item.emotion}</Body>
                      <Muted>
                        {item.count} {item.count === 1 ? 'day' : 'days'}
                      </Muted>
                    </Row>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.surfaceAlt,
                        borderRadius: radius.pill,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${(item.count / summary.topEmotions[0].count) * 100}%`,
                          height: '100%',
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {summary.skills.length > 0 ? (
            <Card>
              <Label>Coping skills</Label>
              <Muted>
                {summary.copingCount} {summary.copingCount === 1 ? 'use' : 'uses'} across{' '}
                {summary.skills.length}{' '}
                {summary.skills.length === 1 ? 'skill' : 'different skills'}
              </Muted>
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                {summary.skills.slice(0, 5).map((skill) => (
                  <Row key={skill.skillId} style={{ justifyContent: 'space-between' }}>
                    <Body style={{ flex: 1 }}>{skill.skillName}</Body>
                    <Muted>
                      ×{skill.uses}
                      {skill.avgHelpfulness !== null
                        ? ` · ${skill.avgHelpfulness}/5`
                        : ''}
                    </Muted>
                  </Row>
                ))}
              </View>
            </Card>
          ) : null}

          {summary.urges + summary.incidents > 0 ? (
            <Card tone={summary.incidents > 0 ? 'warning' : 'accent'}>
              <Label>The hard parts</Label>
              <Row gap={spacing.xl}>
                <Metric label="Urges ridden out" value={`${summary.urgesRidden}`} />
                <Metric label="Incidents" value={`${summary.incidents}`} />
                <Metric
                  label="Days without one"
                  value={`${summary.safeDays}/${summary.daysElapsed}`}
                />
              </Row>
              <Muted>
                Recording these is not the same as failing at them. The record is
                what makes the pattern visible — to you, and to anyone you decide
                to show it to.
              </Muted>
            </Card>
          ) : null}

          <Card>
            <Label>Journal</Label>
            <Row gap={spacing.xl}>
              <Metric label="Entries" value={`${summary.journalCount}`} />
              <Metric label="Words" value={`${summary.journalWords}`} />
            </Row>
          </Card>

          <Card tone="soft">
            <Muted>
              These are counts of what you recorded, not a score and not an
              assessment of how you are doing. A week with fewer entries is a
              week with fewer entries, nothing more.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={{ gap: 2, minWidth: 72 }}>
      <Muted>{label}</Muted>
      <Heading style={{ fontSize: fontSize.lg }}>{value}</Heading>
      {sub ? <Muted>{sub}</Muted> : null}
    </View>
  );
}
