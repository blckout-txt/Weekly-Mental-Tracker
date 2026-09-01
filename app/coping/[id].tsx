import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { logCopingSkill } from '@/db/repos';
import { CATEGORY_LABELS, skillById } from '@/domain/copingCatalog';
import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Label,
  Muted,
  Row,
  ScalePicker,
  Screen,
  Title,
} from '@/ui/components/base';
import {
  BreathingTool,
  DelayTimer,
  GroundingTool,
} from '@/ui/components/tools';
import { radius, spacing, useTheme } from '@/ui/theme';

export default function CopingSkillScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const skill = skillById(id);

  const [logging, setLogging] = useState(false);
  const [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: skill?.name ?? 'Coping skill' });
  }, [navigation, skill]);

  if (!skill) {
    return (
      <Screen>
        <Card>
          <Heading>Skill not found</Heading>
          <Button label="Back to skills" onPress={() => router.replace('/(tabs)/coping')} />
        </Card>
      </Screen>
    );
  }

  async function save() {
    if (!skill) return;
    setSaving(true);
    try {
      await logCopingSkill(db, {
        skillId: skill.id,
        skillName: skill.name,
        minutes: skill.minutes,
        helpfulness,
        note: note.trim(),
      });
      router.back();
    } catch (error) {
      console.warn('Failed to log skill', error);
      Alert.alert('Could not save', 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Label>
          {CATEGORY_LABELS[skill.category]} · about {skill.minutes} minutes
        </Label>
        <Title>{skill.name}</Title>
        <Muted>{skill.blurb}</Muted>
      </View>

      {skill.tool === 'breathing' ? (
        <BreathingTool patternId={skill.id === 'breathe_478' ? '478' : skill.id === 'breathe_paced' ? 'paced' : 'box'} />
      ) : null}
      {skill.tool === 'grounding54321' ? <GroundingTool /> : null}
      {skill.tool === 'timer' ? <DelayTimer minutes={15} /> : null}

      <Card>
        <Label>How to do it</Label>
        {skill.steps.map((step, index) => (
          <Row key={index} gap={spacing.md} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <Muted style={{ color: colors.primary, fontWeight: '800' }}>
                {index + 1}
              </Muted>
            </View>
            <Body style={{ flex: 1 }}>{step}</Body>
          </Row>
        ))}
      </Card>

      {!logging ? (
        <Button label="I did this" variant="accent" onPress={() => setLogging(true)} />
      ) : (
        <Card style={{ gap: spacing.md, borderColor: colors.accent }}>
          <Heading>Did it help?</Heading>
          <Muted>
            Be honest — "not really" is useful information. Over a few weeks this
            is what tells you which skills actually work for you rather than
            which ones sound like they should.
          </Muted>
          <ScalePicker min={1} max={5} value={helpfulness} onChange={setHelpfulness} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Did nothing</Muted>
            <Muted>Really helped</Muted>
          </Row>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder="Anything worth remembering about this time (optional)"
            multiline
            minHeight={70}
          />
          <Button label="Save" onPress={save} loading={saving} />
          <Button label="Cancel" variant="ghost" onPress={() => setLogging(false)} />
        </Card>
      )}

      <View
        style={{
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        <Muted>
          If this one is not landing, that is normal — go back and try a
          different one rather than concluding nothing works.
        </Muted>
      </View>
    </Screen>
  );
}
