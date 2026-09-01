import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { addReason, deleteReason, listReasons, setReasonPinned } from '@/db/repos';
import type { ReasonToStay } from '@/domain/types';
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
  Title,
} from '@/ui/components/base';
import { fontSize, radius, spacing, useTheme } from '@/ui/theme';
import { mediumDate, toDayKey } from '@/utils/date';

export default function ReasonsScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');

  const load = useCallback((database: SQLiteDatabase) => listReasons(database), []);
  const { data: reasons, reload } = useData<ReasonToStay[]>(load, []);

  async function add() {
    if (draft.trim() === '') return;
    await addReason(db, draft, 'manual');
    setDraft('');
    reload();
  }

  function confirmDelete(reason: ReasonToStay) {
    Alert.alert('Remove this reason?', `“${reason.text}”`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteReason(db, reason.id);
          reload();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Title>Reasons to stay</Title>
        <Muted>
          Everything you have written down when you had a reason to. These show
          up on the help screen, so the argument against a bad night is already
          made in your own words before you get there.
        </Muted>
      </View>

      <Card>
        <Label>Add one</Label>
        <Field
          value={draft}
          onChangeText={setDraft}
          placeholder="Something worth staying for. It can be small."
          multiline
          minHeight={70}
        />
        <Button label="Add" onPress={add} />
      </Card>

      {reasons.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="Reasons get added here whenever you log a hard moment, or you can write them straight in above."
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Label>
            {reasons.length} {reasons.length === 1 ? 'reason' : 'reasons'}
          </Label>
          {reasons.map((reason) => (
            <Pressable
              key={reason.id}
              accessibilityRole="button"
              accessibilityHint="Tap to pin, long press to remove"
              onPress={async () => {
                await setReasonPinned(db, reason.id, !reason.pinned);
                reload();
              }}
              onLongPress={() => confirmDelete(reason)}
              style={{
                backgroundColor: reason.pinned ? colors.accentSoft : colors.surface,
                borderColor: reason.pinned ? colors.accent : colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <Body style={{ fontSize: fontSize.md, fontStyle: 'italic' }}>
                “{reason.text}”
              </Body>
              <Row style={{ justifyContent: 'space-between' }}>
                <Muted>
                  {reason.source === 'hard_moment'
                    ? 'Written during a hard moment'
                    : 'Added by you'}
                  {' · '}
                  {mediumDate(toDayKey(reason.createdAt))}
                </Muted>
                {reason.pinned ? (
                  <Muted style={{ color: colors.accent, fontWeight: '700' }}>Pinned</Muted>
                ) : null}
              </Row>
            </Pressable>
          ))}
          <Muted style={{ textAlign: 'center' }}>
            Tap to pin one to the top. Long press to remove it.
          </Muted>
        </View>
      )}
    </Screen>
  );
}
