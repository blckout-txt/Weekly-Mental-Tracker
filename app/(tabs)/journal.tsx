import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import { listJournalEntries } from '@/db/repos';
import type { JournalEntry } from '@/domain/types';
import { JOURNAL_PROMPTS, randomPrompt } from '@/domain/vocab';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  EmptyState,
  Field,
  Label,
  Muted,
  Row,
  Screen,
} from '@/ui/components/base';
import { radius, spacing, useTheme } from '@/ui/theme';
import { clockTime, relativeDay, todayKey } from '@/utils/date';

export default function JournalScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState(() => randomPrompt());

  const load = useCallback(
    (db: SQLiteDatabase) => listJournalEntries(db, 300),
    [],
  );
  const { data: entries } = useData<JournalEntry[]>(load, []);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(needle) ||
          entry.body.toLowerCase().includes(needle),
      )
    : entries;

  const today = todayKey();

  return (
    <Screen>
      <Button label="New entry" onPress={() => router.push('/journal/new')} />

      <Card tone="soft">
        <Label>Prompt</Label>
        <Body>{prompt.text}</Body>
        <Row gap={spacing.sm}>
          <Button
            label="Write about this"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => router.push(`/journal/new?prompt=${prompt.id}`)}
          />
          <Button
            label="Another"
            variant="secondary"
            fullWidth={false}
            onPress={() => setPrompt(randomPrompt(prompt.id))}
          />
        </Row>
      </Card>

      {entries.length > 3 ? (
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Search your entries"
        />
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing written yet"
          message="Writing things down works even when nobody reads it. Especially when nobody reads it."
          action={{ label: 'Start writing', onPress: () => router.push('/journal/new') }}
        />
      ) : visible.length === 0 ? (
        <Muted style={{ textAlign: 'center' }}>Nothing matches “{query}”.</Muted>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Label>{needle ? `${visible.length} found` : 'Entries'}</Label>
          {visible.map((entry) => {
            const promptText = entry.promptId
              ? JOURNAL_PROMPTS.find((p) => p.id === entry.promptId)?.text
              : null;
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                onPress={() => router.push(`/journal/${entry.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                  gap: spacing.xs,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {entry.title.trim() || firstLine(entry.body) || 'Untitled'}
                  </Body>
                  <Muted>{relativeDay(entry.day, today)}</Muted>
                </Row>
                {promptText ? (
                  <Muted style={{ fontStyle: 'italic' }} numberOfLines={1}>
                    {promptText}
                  </Muted>
                ) : null}
                <Muted numberOfLines={2}>{entry.body.trim() || 'Empty entry'}</Muted>
                <Muted>{clockTime(entry.createdAt)}</Muted>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function firstLine(body: string): string {
  return body.trim().split('\n')[0]?.slice(0, 60) ?? '';
}
