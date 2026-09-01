import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getSafetyPlan, saveSafetyPlan } from '@/db/repos';
import {
  EMPTY_SAFETY_PLAN,
  type SafetyPlan,
  type SupportContact,
} from '@/domain/types';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Label,
  Muted,
  Row,
  Screen,
  Title,
} from '@/ui/components/base';
import { radius, spacing, useTheme } from '@/ui/theme';
import { dial } from '@/utils/contact';
import { mediumDate, toDayKey } from '@/utils/date';

/**
 * A safety plan following the Stanley-Brown structure: written in advance,
 * ordered from what you can do alone through to who to call.
 */
export default function SafetyPlanScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const load = useCallback((database: SQLiteDatabase) => getSafetyPlan(database), []);
  const { data: stored } = useData<SafetyPlan>(load, EMPTY_SAFETY_PLAN);

  const [plan, setPlan] = useState<SafetyPlan>(EMPTY_SAFETY_PLAN);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlan(stored);
    setEditing(stored.updatedAt === null);
  }, [stored]);

  async function save() {
    setSaving(true);
    try {
      // Blank rows are kept while editing so fields do not jump around as you
      // type; they are dropped here, on the way to storage.
      const cleaned: SafetyPlan = {
        ...plan,
        warningSigns: tidy(plan.warningSigns),
        internalCoping: tidy(plan.internalCoping),
        distractions: tidy(plan.distractions),
        environmentSteps: tidy(plan.environmentSteps),
        reasonsForLiving: tidy(plan.reasonsForLiving),
        supportPeople: tidyContacts(plan.supportPeople),
        professionals: tidyContacts(plan.professionals),
      };
      const saved = await saveSafetyPlan(db, cleaned);
      setPlan(saved);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const isEmpty = stored.updatedAt === null;

  if (!editing) {
    return (
      <Screen>
        <View style={{ gap: spacing.xs }}>
          <Title>Your safety plan</Title>
          {stored.updatedAt ? (
            <Muted>Last updated {mediumDate(toDayKey(stored.updatedAt))}</Muted>
          ) : null}
        </View>

        <ReadSection title="Warning signs I am heading there" items={plan.warningSigns} />
        <ReadSection title="What I can do on my own" items={plan.internalCoping} />
        <ReadSection title="Places and people that distract me" items={plan.distractions} />

        {plan.supportPeople.length > 0 ? (
          <Card>
            <Label>People I can ask for help</Label>
            {plan.supportPeople.map((person, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => person.detail && dial(person.detail)}
                style={{
                  paddingVertical: spacing.sm,
                  borderBottomWidth: index === plan.supportPeople.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Body style={{ fontWeight: '600' }}>{person.name}</Body>
                <Muted>{person.detail}</Muted>
              </Pressable>
            ))}
          </Card>
        ) : null}

        {plan.professionals.length > 0 ? (
          <Card>
            <Label>Professionals and services</Label>
            {plan.professionals.map((person, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => person.detail && dial(person.detail)}
                style={{ paddingVertical: spacing.sm }}
              >
                <Body style={{ fontWeight: '600' }}>{person.name}</Body>
                <Muted>{person.detail}</Muted>
              </Pressable>
            ))}
          </Card>
        ) : null}

        <ReadSection
          title="Making my space safer"
          items={plan.environmentSteps}
          tone="warning"
        />
        <ReadSection
          title="Reasons I want to stay"
          items={plan.reasonsForLiving}
          tone="accent"
        />

        <Button label="Edit plan" variant="secondary" onPress={() => setEditing(true)} />
        <Button
          label="I need help right now"
          variant="danger"
          onPress={() => router.push('/crisis')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Title>{isEmpty ? 'Make a safety plan' : 'Edit your plan'}</Title>
        <Muted>
          Fill this in on a calm day. It is written for the version of you who
          cannot think straight, so keep it short, concrete and specific. Every
          box is optional — a half-finished plan still beats no plan.
        </Muted>
      </Card>

      <ListEditor
        title="Warning signs I am heading there"
        helper="Thoughts, moods, situations, or behaviours that come before a bad night."
        placeholder="e.g. Cancelling plans two days in a row"
        items={plan.warningSigns}
        onChange={(warningSigns) => setPlan((p) => ({ ...p, warningSigns }))}
      />

      <ListEditor
        title="What I can do on my own"
        helper="Things that have helped before, that need nobody else."
        placeholder="e.g. Cold shower, then put a podcast on"
        items={plan.internalCoping}
        onChange={(internalCoping) => setPlan((p) => ({ ...p, internalCoping }))}
      />

      <ListEditor
        title="Places and people that distract me"
        helper="Somewhere to go, or someone to be around, without having to explain anything."
        placeholder="e.g. The 24h cafe on the corner"
        items={plan.distractions}
        onChange={(distractions) => setPlan((p) => ({ ...p, distractions }))}
      />

      <ContactEditor
        title="People I can ask for help"
        helper="The ones you would actually message at 1am."
        items={plan.supportPeople}
        onChange={(supportPeople) => setPlan((p) => ({ ...p, supportPeople }))}
      />

      <ContactEditor
        title="Professionals and services"
        helper="Therapist, GP, crisis team, care coordinator."
        items={plan.professionals}
        onChange={(professionals) => setPlan((p) => ({ ...p, professionals }))}
      />

      <ListEditor
        title="Making my space safer"
        helper="What you will move, lock away, or give to someone else to hold."
        placeholder="e.g. Ask Jo to keep the spare key to the drawer"
        items={plan.environmentSteps}
        onChange={(environmentSteps) => setPlan((p) => ({ ...p, environmentSteps }))}
      />

      <ListEditor
        title="Reasons I want to stay"
        helper="The honest ones, not the impressive ones."
        placeholder="e.g. My sister's wedding in June"
        items={plan.reasonsForLiving}
        onChange={(reasonsForLiving) => setPlan((p) => ({ ...p, reasonsForLiving }))}
      />

      <Button label="Save plan" onPress={save} loading={saving} />
      {!isEmpty ? (
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => {
            setPlan(stored);
            setEditing(false);
          }}
        />
      ) : null}
    </Screen>
  );
}

function ReadSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: 'accent' | 'warning';
}) {
  if (items.length === 0) return null;
  return (
    <Card tone={tone}>
      <Label>{title}</Label>
      {items.map((item, index) => (
        <Body key={index}>• {item}</Body>
      ))}
    </Card>
  );
}

function ListEditor({
  title,
  helper,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  helper: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const rows = items.length > 0 ? items : [''];

  return (
    <Card style={{ gap: spacing.md }}>
      <View>
        <Heading>{title}</Heading>
        <Muted>{helper}</Muted>
      </View>
      {rows.map((item, index) => (
        <Field
          key={index}
          value={item}
          placeholder={index === 0 ? placeholder : 'One more…'}
          onChangeText={(value) =>
            onChange(rows.map((row, i) => (i === index ? value : row)))
          }
        />
      ))}
      <Button
        label="Add another"
        variant="secondary"
        onPress={() => onChange([...rows, ''])}
      />
    </Card>
  );
}

function ContactEditor({
  title,
  helper,
  items,
  onChange,
}: {
  title: string;
  helper: string;
  items: SupportContact[];
  onChange: (items: SupportContact[]) => void;
}) {
  const rows = items.length > 0 ? items : [{ name: '', detail: '' }];

  function update(index: number, patch: Partial<SupportContact>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <View>
        <Heading>{title}</Heading>
        <Muted>{helper}</Muted>
      </View>
      {rows.map((contact, index) => (
        <View
          key={index}
          style={{ gap: spacing.sm, borderRadius: radius.md }}
        >
          <Row gap={spacing.sm}>
            <View style={{ flex: 1 }}>
              <Field
                value={contact.name}
                placeholder="Name"
                onChangeText={(name) => update(index, { name })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                value={contact.detail}
                placeholder="Phone number"
                keyboardType="default"
                onChangeText={(detail) => update(index, { detail })}
              />
            </View>
          </Row>
        </View>
      ))}
      <Button
        label="Add another"
        variant="secondary"
        onPress={() => onChange([...rows, { name: '', detail: '' }])}
      />
    </Card>
  );
}

function tidy(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item) => item !== '');
}

function tidyContacts(items: SupportContact[]): SupportContact[] {
  return items
    .map((item) => ({ name: item.name.trim(), detail: item.detail.trim() }))
    .filter((item) => item.name !== '' || item.detail !== '');
}
