import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import { favouriteSkills, listCopingLogs } from '@/db/repos';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  COPING_SKILLS,
  crisisSkills,
  type CopingCategory,
  type CopingSkill,
} from '@/domain/copingCatalog';
import { useData } from '@/state/useData';
import {
  Body,
  Card,
  Chip,
  Label,
  Muted,
  Row,
  Screen,
  Title,
} from '@/ui/components/base';
import { radius, spacing, useTheme } from '@/ui/theme';

type Filter = 'all' | 'crisis' | 'yours' | CopingCategory;

export default function CopingScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(
    async (db: SQLiteDatabase) => ({
      favourites: await favouriteSkills(db, 6),
      recent: await listCopingLogs(db, 10),
    }),
    [],
  );
  const { data } = useData(load, {
    favourites: [] as Awaited<ReturnType<typeof favouriteSkills>>,
    recent: [] as Awaited<ReturnType<typeof listCopingLogs>>,
  });

  const skills = filterSkills(filter, data.favourites.map((f) => f.skillId));

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Title>Coping skills</Title>
        <Muted>
          Nothing here works every time, and nothing here is supposed to fix how
          you feel. They are ways to get through the next twenty minutes.
        </Muted>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip
          label="All"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <Chip
          label="Right now"
          tone="danger"
          selected={filter === 'crisis'}
          onPress={() => setFilter('crisis')}
        />
        {data.favourites.length > 0 ? (
          <Chip
            label="Works for you"
            tone="accent"
            selected={filter === 'yours'}
            onPress={() => setFilter('yours')}
          />
        ) : null}
        {CATEGORY_ORDER.map((category) => (
          <Chip
            key={category}
            label={CATEGORY_LABELS[category]}
            selected={filter === category}
            onPress={() => setFilter(category)}
          />
        ))}
      </View>

      {filter === 'yours' && data.favourites.length > 0 ? (
        <Card tone="accent">
          <Label>Based on how you rated them</Label>
          <Muted>
            These are the ones you said actually helped. When you cannot decide,
            start at the top.
          </Muted>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        {skills.map((skill) => {
          const stat = data.favourites.find((f) => f.skillId === skill.id);
          return (
            <Pressable
              key={skill.id}
              accessibilityRole="button"
              onPress={() => router.push(`/coping/${skill.id}`)}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Body style={{ fontWeight: '700', flex: 1 }}>{skill.name}</Body>
                <Muted>{skill.minutes} min</Muted>
              </Row>
              <Muted>{skill.blurb}</Muted>
              <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
                <Tag text={CATEGORY_LABELS[skill.category]} />
                {skill.forCrisis ? <Tag text="Works in a crisis" tone="danger" /> : null}
                {skill.tool ? <Tag text="Guided" tone="accent" /> : null}
                {stat && stat.avg !== null ? (
                  <Tag text={`You: ${stat.avg.toFixed(1)}/5`} tone="accent" />
                ) : null}
              </Row>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function Tag({ text, tone }: { text: string; tone?: 'danger' | 'accent' }) {
  const { colors } = useTheme();
  const look =
    tone === 'danger'
      ? { bg: colors.dangerSoft, fg: colors.danger }
      : tone === 'accent'
        ? { bg: colors.accentSoft, fg: colors.accent }
        : { bg: colors.surfaceAlt, fg: colors.textMuted };
  return (
    <View
      style={{
        backgroundColor: look.bg,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
      }}
    >
      <Muted style={{ color: look.fg, fontWeight: '600' }}>{text}</Muted>
    </View>
  );
}

function filterSkills(filter: Filter, favouriteIds: string[]): CopingSkill[] {
  if (filter === 'all') return COPING_SKILLS;
  if (filter === 'crisis') return crisisSkills();
  if (filter === 'yours') {
    // Preserve the ranking that came back from the database.
    return favouriteIds
      .map((id) => COPING_SKILLS.find((s) => s.id === id))
      .filter((s): s is CopingSkill => s !== undefined);
  }
  return COPING_SKILLS.filter((skill) => skill.category === filter);
}
