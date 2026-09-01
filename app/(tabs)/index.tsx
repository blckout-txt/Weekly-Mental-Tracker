import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getSettings,
  listCopingLogs,
  listHardMoments,
  listJournalEntries,
  listMoodEntries,
  listReasons,
} from '@/db/repos';
import { COPING_SKILLS } from '@/domain/copingCatalog';
import { assessTrend } from '@/domain/riskAssessment';
import { currentStreak, daysSince } from '@/domain/streaks';
import { DEFAULT_SETTINGS, type AppSettings } from '@/domain/types';
import type { CopingLog, HardMoment, JournalEntry, MoodEntry, ReasonToStay } from '@/domain/types';
import { randomPrompt } from '@/domain/vocab';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  Heading,
  Label,
  Muted,
  Row,
  Screen,
  Title,
} from '@/ui/components/base';
import { HelpBanner } from '@/ui/components/HelpButton';
import { MoodDots } from '@/ui/components/MoodChart';
import { fontSize, moodColor, radius, riskColors, spacing, useTheme } from '@/ui/theme';
import { todayKey } from '@/utils/date';

type HomeData = {
  moods: MoodEntry[];
  journals: JournalEntry[];
  coping: CopingLog[];
  hardMoments: HardMoment[];
  reasons: ReasonToStay[];
  settings: AppSettings;
};

const EMPTY: HomeData = {
  moods: [],
  journals: [],
  coping: [],
  hardMoments: [],
  reasons: [],
  settings: DEFAULT_SETTINGS,
};

export default function TodayScreen() {
  const { colors, dark } = useTheme();

  const load = useCallback(
    async (db: SQLiteDatabase): Promise<HomeData> => ({
      moods: await listMoodEntries(db, 60),
      journals: await listJournalEntries(db, 5),
      coping: await listCopingLogs(db, 30),
      hardMoments: await listHardMoments(db, 60),
      reasons: await listReasons(db),
      settings: await getSettings(db),
    }),
    [],
  );

  const { data } = useData(load, EMPTY);
  const today = todayKey();

  const checkedInToday = data.moods.some((m) => m.day === today);
  const streak = currentStreak(data.moods.map((m) => m.day), today);
  const latest = data.moods[0];
  const incidentFree = daysSince(
    data.hardMoments.filter((h) => h.kind === 'incident').map((h) => h.day),
    today,
  );
  const trend = assessTrend(data.hardMoments, data.moods, today);
  const tone = riskColors(trend.level, colors);

  // A reason picked by the day, so it changes without being random on every
  // re-render.
  const reason =
    data.reasons.length > 0
      ? data.reasons[
          Math.abs(hashString(today)) % data.reasons.length
        ]
      : null;

  const prompt = randomPrompt();
  const suggestion = suggestSkill(data.coping);

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Title>
          {data.settings.displayName
            ? `${greeting()}, ${data.settings.displayName}`
            : greeting()}
        </Title>
        <Muted>
          {checkedInToday
            ? 'You have checked in today.'
            : 'No check-in yet today. It takes about twenty seconds.'}
        </Muted>
      </View>

      {checkedInToday && latest ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Label>Today</Label>
              <Heading style={{ color: moodColor(latest.mood, dark) }}>
                {latest.mood}/10
              </Heading>
            </View>
            <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
              <Muted>Last 7 check-ins</Muted>
              <MoodDots moods={data.moods.slice(0, 7).map((m) => m.mood).reverse()} />
            </View>
          </Row>
          {latest.emotions.length > 0 ? (
            <Muted>{latest.emotions.join(' · ')}</Muted>
          ) : null}
          <Button
            label="Check in again"
            variant="secondary"
            onPress={() => router.push('/check-in')}
          />
        </Card>
      ) : (
        <Button label="Check in now" onPress={() => router.push('/check-in')} />
      )}

      <Row gap={spacing.sm}>
        <Stat label="Check-in streak" value={streak === 0 ? '—' : `${streak}d`} />
        <Stat
          label="Since a hard day"
          value={incidentFree === null ? '—' : `${incidentFree}d`}
        />
        <Stat label="Skills used" value={`${data.coping.length}`} />
      </Row>

      {trend.recommendResources ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/crisis')}
          style={{
            backgroundColor: tone.bg,
            borderColor: tone.fg,
            borderWidth: 1,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.xs,
          }}
        >
          <Heading style={{ color: tone.fg }}>The last couple of weeks look heavy</Heading>
          <Muted>{trend.message}</Muted>
        </Pressable>
      ) : null}

      {reason ? (
        <Card tone="accent">
          <Label>One of your reasons</Label>
          <Body style={{ fontStyle: 'italic', fontSize: fontSize.md }}>
            “{reason.text}”
          </Body>
          <Pressable onPress={() => router.push('/reasons')}>
            <Muted style={{ color: colors.accent, fontWeight: '700' }}>
              See all of them →
            </Muted>
          </Pressable>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Label>Quick actions</Label>
        <Action
          title="Write something"
          subtitle={prompt.text}
          onPress={() => router.push(`/journal/new?prompt=${prompt.id}`)}
        />
        {suggestion ? (
          <Action
            title={suggestion.name}
            subtitle={suggestion.blurb}
            onPress={() => router.push(`/coping/${suggestion.id}`)}
          />
        ) : null}
        {data.settings.trackHardMoments ? (
          <Action
            title="Log a hard moment"
            subtitle="An urge you rode out, or something that happened. Both count."
            onPress={() => router.push('/hard-moment')}
          />
        ) : null}
        <Action
          title="Safety plan"
          subtitle="Written while calm, read when not."
          onPress={() => router.push('/safety-plan')}
        />
      </View>

      <HelpBanner />

      <Pressable onPress={() => router.push('/settings')} style={{ paddingVertical: spacing.sm }}>
        <Muted style={{ textAlign: 'center' }}>
          Everything here stays on this device · Settings
        </Muted>
      </Pressable>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: 2,
      }}
    >
      <Heading>{value}</Heading>
      <Muted numberOfLines={2}>{label}</Muted>
    </View>
  );
}

function Action({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: 2,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Body style={{ fontWeight: '700' }}>{title}</Body>
      <Muted>{subtitle}</Muted>
    </Pressable>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

/** Stable per-string number, so "reason of the day" does not flicker. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Suggest something the person has not reached for recently. */
function suggestSkill(recent: CopingLog[]) {
  const usedIds = new Set(recent.slice(0, 8).map((log) => log.skillId));
  const unused = COPING_SKILLS.filter((skill) => !usedIds.has(skill.id));
  const pool = unused.length > 0 ? unused : COPING_SKILLS;
  return pool[Math.abs(hashString(todayKey())) % pool.length];
}
