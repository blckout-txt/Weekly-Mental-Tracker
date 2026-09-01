import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { getSafetyPlan, getSettings, listReasons } from '@/db/repos';
import { crisisSkills } from '@/domain/copingCatalog';
import { CALL_FAQ, regionByCode, type CrisisResource } from '@/domain/crisisResources';
import { EMPTY_SAFETY_PLAN, type ReasonToStay, type SafetyPlan } from '@/domain/types';
import { useData } from '@/state/useData';
import {
  Body,
  Button,
  Card,
  Heading,
  Label,
  Muted,
  Screen,
  Title,
} from '@/ui/components/base';
import { fontSize, radius, spacing, useTheme } from '@/ui/theme';
import { dial, openResource } from '@/utils/contact';

type CrisisData = {
  region: string;
  plan: SafetyPlan;
  reasons: ReasonToStay[];
};

export default function CrisisScreen() {
  const { colors } = useTheme();

  const load = useCallback(async (db: Parameters<typeof getSettings>[0]) => {
    const [settings, plan, reasons] = await Promise.all([
      getSettings(db),
      getSafetyPlan(db),
      listReasons(db),
    ]);
    return { region: settings.region, plan, reasons };
  }, []);

  const { data } = useData<CrisisData>(load, {
    region: 'US',
    plan: EMPTY_SAFETY_PLAN,
    reasons: [],
  });

  const region = regionByCode(data.region);
  const people = data.plan.supportPeople.filter((p) => p.detail.trim() !== '');
  const reasons = data.plan.reasonsForLiving.concat(data.reasons.map((r) => r.text));

  return (
    <Screen>
      <Card tone="danger" style={{ gap: spacing.md }}>
        <Title style={{ color: colors.danger }}>You do not have to do this alone</Title>
        <Body>
          If you are in immediate danger, or you have already hurt yourself and
          need medical care, call {region.emergency} or go to your nearest
          emergency department.
        </Body>
        <Button
          label={`Call ${region.emergency}`}
          variant="danger"
          onPress={() => dial(region.emergency)}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Label>Free, 24/7, confidential</Label>
        {region.resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
        <Muted>
          Showing lines for {region.name}. Change this in Settings if you are
          somewhere else.
        </Muted>
      </View>

      {people.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Label>Your people</Label>
          {people.map((person, index) => (
            <Card key={`${person.name}-${index}`}>
              <Heading>{person.name}</Heading>
              <Muted>{person.detail}</Muted>
              <Button
                label="Call"
                variant="secondary"
                onPress={() => dial(person.detail)}
              />
            </Card>
          ))}
        </View>
      ) : null}

      {reasons.length > 0 ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <Label>In your own words</Label>
          {reasons.slice(0, 6).map((reason, index) => (
            <Body key={index} style={{ fontStyle: 'italic' }}>
              “{reason}”
            </Body>
          ))}
          <Muted>You wrote these when you could think clearly. They still count.</Muted>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Label>Get through the next ten minutes</Label>
        {crisisSkills()
          .slice(0, 6)
          .map((skill) => (
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
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Body style={{ fontWeight: '700' }}>{skill.name}</Body>
              <Muted>{skill.blurb}</Muted>
            </Pressable>
          ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button
          label="Open my safety plan"
          variant="secondary"
          onPress={() => router.push('/safety-plan')}
        />
        <Button
          label="Log what is happening"
          variant="secondary"
          onPress={() => router.push('/hard-moment')}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>If something is stopping you calling</Label>
        {CALL_FAQ.map((item) => (
          <FaqRow key={item.q} question={item.q} answer={item.a} />
        ))}
      </View>

      <Muted style={{ textAlign: 'center', marginTop: spacing.md }}>
        This app is not a crisis service and nobody is monitoring what you write
        in it. The lines above are staffed by trained humans.
      </Muted>
    </Screen>
  );
}

function ResourceCard({ resource }: { resource: CrisisResource }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <Heading style={{ flex: 1 }}>{resource.name}</Heading>
        <Muted>{resource.hours}</Muted>
      </View>
      {resource.audience ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.primarySoft,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
          }}
        >
          <Muted style={{ color: colors.primary, fontWeight: '700' }}>
            {resource.audience}
          </Muted>
        </View>
      ) : null}
      {resource.note ? <Muted>{resource.note}</Muted> : null}
      <Button
        label={resource.display}
        variant={resource.method === 'call' ? 'primary' : 'secondary'}
        onPress={() => openResource(resource)}
      />
    </Card>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((v) => !v)}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Body style={{ flex: 1, fontWeight: '600' }}>“{question}”</Body>
        <Body style={{ color: colors.textFaint, fontSize: fontSize.md }}>
          {open ? '−' : '+'}
        </Body>
      </View>
      {open ? <Muted>{answer}</Muted> : null}
    </Pressable>
  );
}
