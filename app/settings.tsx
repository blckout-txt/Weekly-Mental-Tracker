import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { exportToFile, importFromFile } from '@/db/backup';
import { countEverything, deleteEverything, getSettings, saveSettings } from '@/db/repos';
import { REGIONS } from '@/domain/crisisResources';
import { DEFAULT_SETTINGS, type AppSettings } from '@/domain/types';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  Chip,
  Field,
  Heading,
  Label,
  Muted,
  Row,
  Screen,
  Title,
  Toggle,
} from '@/ui/components/base';
import { spacing, useTheme } from '@/ui/theme';

type SettingsData = {
  settings: AppSettings;
  counts: Awaited<ReturnType<typeof countEverything>>;
};

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (database: SQLiteDatabase): Promise<SettingsData> => ({
      settings: await getSettings(database),
      counts: await countEverything(database),
    }),
    [],
  );
  const { data, reload } = useData<SettingsData>(load, {
    settings: DEFAULT_SETTINGS,
    counts: { moods: 0, journals: 0, coping: 0, hardMoments: 0, reasons: 0 },
  });

  const [name, setName] = useState('');
  useEffect(() => setName(data.settings.displayName), [data.settings.displayName]);

  async function patch(update: Partial<AppSettings>) {
    await saveSettings(db, update);
    reload();
  }

  async function doExport() {
    setBusy(true);
    try {
      await exportToFile(db);
    } catch (error) {
      console.warn('Export failed', error);
      Alert.alert('Export failed', 'Could not write the backup file.');
    } finally {
      setBusy(false);
    }
  }

  function doImport() {
    Alert.alert(
      'Restore from a backup?',
      'This replaces everything currently in the app with the contents of the file you pick. Export first if you want to keep what is here.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file',
          onPress: async () => {
            setBusy(true);
            try {
              const result = await importFromFile(db);
              if (result) {
                reload();
                Alert.alert(
                  'Restored',
                  `${result.imported.moods} check-ins, ${result.imported.journals} journal entries, ` +
                    `${result.imported.coping} skill logs, ${result.imported.hardMoments} hard moments.`,
                );
              }
            } catch (error) {
              console.warn('Import failed', error);
              Alert.alert(
                'Could not restore',
                error instanceof Error ? error.message : 'That file could not be read.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function doDelete() {
    Alert.alert(
      'Delete everything?',
      'Every check-in, journal entry, hard moment, reason and your safety plan will be permanently erased from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete it all',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you sure?', 'There is no way to get this back.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, delete everything',
                style: 'destructive',
                onPress: async () => {
                  await deleteEverything(db);
                  reload();
                  router.replace('/(tabs)');
                },
              },
            ]),
        },
      ],
    );
  }

  const total =
    data.counts.moods +
    data.counts.journals +
    data.counts.coping +
    data.counts.hardMoments +
    data.counts.reasons;

  return (
    <Screen>
      <Card>
        <Title>Your data stays here</Title>
        <Body>
          This app has no account, no server and no internet permission it needs
          to work. Everything you write is stored in a database inside the app's
          private storage on this device.
        </Body>
        <Muted>
          Nobody at the other end can read it, because there is no other end.
          The one exception is a backup file you export and share yourself.
        </Muted>
      </Card>

      <Card>
        <Label>What is stored right now</Label>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Mood check-ins</Muted>
          <Body>{data.counts.moods}</Body>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Journal entries</Muted>
          <Body>{data.counts.journals}</Body>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Coping skill logs</Muted>
          <Body>{data.counts.coping}</Body>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Hard moments</Muted>
          <Body>{data.counts.hardMoments}</Body>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Reasons to stay</Muted>
          <Body>{data.counts.reasons}</Body>
        </Row>
      </Card>

      <Card>
        <Label>Name</Label>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="What should the app call you? (optional)"
        />
        <Button
          label="Save name"
          variant="secondary"
          onPress={() => patch({ displayName: name.trim() })}
        />
      </Card>

      <Card>
        <Label>Where you are</Label>
        <Muted>Decides which crisis lines the help screen shows first.</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {REGIONS.map((region) => (
            <Chip
              key={region.code}
              label={region.name}
              selected={data.settings.region === region.code}
              onPress={() => patch({ region: region.code })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Label>Tracking</Label>
        <Toggle
          label="Track hard moments"
          helper="Urges, self-harm and the safety questions that go with them. Turn this off if it is not what you need the app for."
          value={data.settings.trackHardMoments}
          onChange={(trackHardMoments) => patch({ trackHardMoments })}
        />
      </Card>

      <Card>
        <Label>Backup</Label>
        <Muted>
          A backup is a plain JSON file. Anyone who opens it can read everything
          in it, so put it somewhere you trust.
        </Muted>
        <Button
          label="Export a backup"
          variant="secondary"
          onPress={doExport}
          loading={busy}
        />
        <Button
          label="Restore from a backup"
          variant="secondary"
          onPress={doImport}
          loading={busy}
        />
      </Card>

      <Card tone="danger">
        <Heading style={{ color: colors.danger }}>Delete everything</Heading>
        <Muted>
          {total === 0
            ? 'There is nothing stored yet.'
            : `${total} records will be permanently erased from this device.`}
        </Muted>
        <Button label="Delete all my data" variant="danger" onPress={doDelete} />
      </Card>

      <Card tone="soft">
        <Label>What this app is not</Label>
        <Muted>
          It is not a medical device, a therapist, or a monitoring service.
          Nothing you write here is seen by a human, and nobody is alerted if
          you are struggling. The risk checks are simple rules, not a clinical
          assessment — they exist to prompt you towards real people, not to
          replace them.
        </Muted>
        <Button
          label="Crisis lines and help"
          variant="secondary"
          onPress={() => router.push('/crisis')}
        />
      </Card>
    </Screen>
  );
}
