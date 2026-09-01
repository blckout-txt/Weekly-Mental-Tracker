import { View } from 'react-native';

import type { MoodPoint } from '@/domain/weeklySummary';
import { Muted } from '@/ui/components/base';
import { moodColor, radius, spacing, useTheme } from '@/ui/theme';
import { weekdayShort } from '@/utils/date';

/**
 * A seven-bar week chart drawn with plain views.
 *
 * Days without a check-in show as a faint outline rather than a zero, so a
 * missed day never looks like the worst possible mood.
 */
export function MoodChart({
  points,
  height = 120,
}: {
  points: MoodPoint[];
  height?: number;
}) {
  const { colors, dark } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height,
          gap: spacing.xs,
        }}
      >
        {points.map((point) => {
          const mood = point.mood;
          const filled = mood !== null;
          const fraction = filled ? Math.max(0.08, mood / 10) : 1;
          return (
            <View
              key={point.day}
              accessible
              accessibilityLabel={
                filled
                  ? `${weekdayShort(point.day)}: ${mood} out of 10`
                  : `${weekdayShort(point.day)}: no check-in`
              }
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  height: `${fraction * 100}%`,
                  borderRadius: radius.sm,
                  backgroundColor: filled ? moodColor(mood, dark) : 'transparent',
                  borderWidth: filled ? 0 : 1,
                  borderStyle: filled ? 'solid' : 'dashed',
                  borderColor: colors.border,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {points.map((point) => (
          <Muted key={point.day} style={{ flex: 1, textAlign: 'center' }}>
            {weekdayShort(point.day).slice(0, 1)}
          </Muted>
        ))}
      </View>
    </View>
  );
}

/** Compact colour-dot strip for recent history lists. */
export function MoodDots({ moods }: { moods: number[] }) {
  const { dark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {moods.map((mood, index) => (
        <View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: moodColor(mood, dark),
          }}
        />
      ))}
    </View>
  );
}
