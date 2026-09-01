import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from '@/db/repos';
import { JOURNAL_PROMPTS } from '@/domain/vocab';
import {
  Body,
  Button,
  Card,
  Field,
  Label,
  Muted,
  Screen,
} from '@/ui/components/base';
import { spacing } from '@/ui/theme';
import { mediumDate, todayKey } from '@/utils/date';

export default function JournalEntryScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string; prompt?: string }>();
  const isNew = params.id === 'new';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [promptId, setPromptId] = useState<string | null>(params.prompt ?? null);
  const [day, setDay] = useState(todayKey());
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isNew ? 'New entry' : 'Journal entry' });
  }, [navigation, isNew]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getJournalEntry(db, params.id)
      .then((entry) => {
        if (cancelled || !entry) return;
        setTitle(entry.title);
        setBody(entry.body);
        setPromptId(entry.promptId);
        setDay(entry.day);
      })
      .catch((error) => console.warn('Failed to load entry', error))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [db, params.id, isNew]);

  const prompt = promptId
    ? JOURNAL_PROMPTS.find((p) => p.id === promptId)
    : undefined;

  const save = useCallback(async () => {
    if (body.trim() === '' && title.trim() === '') {
      router.back();
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createJournalEntry(db, { title, body, promptId, tags: [] });
      } else {
        await updateJournalEntry(db, params.id, { title, body, tags: [] });
      }
      router.back();
    } catch (error) {
      console.warn('Failed to save entry', error);
      Alert.alert('Could not save', 'Something went wrong. Your text is still here.');
    } finally {
      setSaving(false);
    }
  }, [db, isNew, params.id, title, body, promptId]);

  function confirmDelete() {
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteJournalEntry(db, params.id);
          router.back();
        },
      },
    ]);
  }

  if (!loaded) {
    return (
      <Screen>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <Muted>{mediumDate(day)}</Muted>

      {prompt ? (
        <Card tone="soft">
          <Label>Prompt</Label>
          <Body style={{ fontStyle: 'italic' }}>{prompt.text}</Body>
        </Card>
      ) : null}

      <Field
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Optional"
      />

      <Field
        label="Entry"
        value={body}
        onChangeText={setBody}
        multiline
        minHeight={280}
        autoFocus={isNew}
        placeholder="However it comes out. Spelling does not matter, and nobody else is going to read it."
      />

      <Button label="Save" onPress={save} loading={saving} />
      {!isNew ? (
        <Button
          label="Delete entry"
          variant="ghost"
          onPress={confirmDelete}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </Screen>
  );
}
