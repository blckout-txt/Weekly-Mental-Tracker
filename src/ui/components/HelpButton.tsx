import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { fontSize, radius, spacing, useTheme } from '@/ui/theme';

/**
 * The one control that is on every single screen.
 *
 * Somebody in a bad moment should never have to navigate, remember where
 * something lives, or scroll to find help. It sits in the header, it always
 * looks the same, and it is one tap from anywhere in the app.
 */
export function HelpButton() {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={() => router.push('/crisis')}
      hitSlop={8}
      style={({ pressed }) => ({
        backgroundColor: colors.danger,
        borderRadius: radius.pill,
        paddingVertical: spacing.sm - 2,
        paddingHorizontal: spacing.md,
        marginRight: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: fontSize.sm }}>
        Help now
      </Text>
    </Pressable>
  );
}

/** Full-width version for the bottom of the home screen. */
export function HelpBanner() {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={() => router.push('/crisis')}
      style={({ pressed }) => ({
        backgroundColor: colors.dangerSoft,
        borderColor: colors.danger,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.lg,
        opacity: pressed ? 0.85 : 1,
        gap: spacing.xs,
      })}
    >
      <Text style={{ color: colors.danger, fontWeight: '800', fontSize: fontSize.md }}>
        Struggling right now?
      </Text>
      <View>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 19 }}>
          Crisis lines, your safety plan, and the skills that work fastest — all
          in one place. You do not have to be in danger to open this.
        </Text>
      </View>
    </Pressable>
  );
}
