import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { fontSize, radius, spacing, useTheme, type Palette } from '@/ui/theme';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

type TextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Title({ children, style }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Heading({ children, style }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontSize: fontSize.base, color: colors.text, lineHeight: 22 }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 }, style]}
    >
      {children}
    </Text>
  );
}

export function Label({ children, style }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: fontSize.xs,
          fontWeight: '700',
          letterSpacing: 0.7,
          textTransform: 'uppercase',
          color: colors.textFaint,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg }, contentStyle]}>{children}</View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  tone,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'soft' | 'danger' | 'accent' | 'warning';
}) {
  const { colors } = useTheme();
  const backgrounds: Record<string, string> = {
    default: colors.surface,
    soft: colors.surfaceAlt,
    danger: colors.dangerSoft,
    accent: colors.accentSoft,
    warning: colors.warningSoft,
  };
  return (
    <View
      style={[
        {
          backgroundColor: backgrounds[tone ?? 'default'],
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
  );
}

export function Row({
  children,
  style,
  gap = spacing.sm,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}) {
  const { colors } = useTheme();
  const look = buttonLook(variant, colors);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: look.bg,
          borderColor: look.border,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <Text style={{ color: look.fg, fontWeight: '700', fontSize: fontSize.base }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function buttonLook(variant: ButtonVariant, colors: Palette) {
  switch (variant) {
    case 'secondary':
      return { bg: colors.surface, fg: colors.text, border: colors.border };
    case 'ghost':
      return { bg: 'transparent', fg: colors.primary, border: 'transparent' };
    case 'danger':
      return { bg: colors.danger, fg: '#FFFFFF', border: colors.danger };
    case 'accent':
      return { bg: colors.accent, fg: '#FFFFFF', border: colors.accent };
    default:
      return { bg: colors.primary, fg: colors.primaryText, border: colors.primary };
  }
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
  helper,
  autoFocus,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
  helper?: string;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: fontSize.base,
          color: colors.text,
          minHeight: multiline ? (minHeight ?? 120) : undefined,
          lineHeight: 21,
        }}
      />
      {helper ? <Muted>{helper}</Muted> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'primary',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'primary' | 'danger' | 'accent';
}) {
  const { colors } = useTheme();
  const active = {
    primary: { bg: colors.primarySoft, border: colors.primary, fg: colors.primary },
    danger: { bg: colors.dangerSoft, border: colors.danger, fg: colors.danger },
    accent: { bg: colors.accentSoft, border: colors.accent, fg: colors.accent },
  }[tone];

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? active.bg : colors.surface,
        borderColor: selected ? active.border : colors.border,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingVertical: spacing.sm - 1,
        paddingHorizontal: spacing.md,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: selected ? active.fg : colors.textMuted,
          fontWeight: selected ? '700' : '500',
          fontSize: fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup({
  options,
  selected,
  onToggle,
  tone,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  tone?: 'primary' | 'danger' | 'accent';
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          tone={tone}
          selected={selected.includes(option)}
          onPress={() => onToggle(option)}
        />
      ))}
    </View>
  );
}

/** A horizontal 1..n picker used for mood, energy, anxiety and intensity. */
export function ScalePicker({
  min = 1,
  max = 10,
  value,
  onChange,
  colorFor,
}: {
  min?: number;
  max?: number;
  value: number | null;
  onChange: (v: number) => void;
  colorFor?: (v: number) => string;
}) {
  const { colors } = useTheme();
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
      {steps.map((step) => {
        const selected = value === step;
        const tint = colorFor ? colorFor(step) : colors.primary;
        return (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={`${step} out of ${max}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(step)}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 30,
              aspectRatio: 1,
              maxHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? tint : colors.border,
              backgroundColor: selected ? tint : colors.surface,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: selected ? '#FFFFFF' : colors.textMuted,
                fontWeight: '700',
                fontSize: fontSize.sm,
              }}
            >
              {step}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.md,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm + 2,
              borderRadius: radius.sm,
              alignItems: 'center',
              backgroundColor: selected ? colors.surface : 'transparent',
            }}
          >
            <Text
              style={{
                color: selected ? colors.text : colors.textMuted,
                fontWeight: selected ? '700' : '500',
                fontSize: fontSize.sm,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radius.sm - 2,
          borderWidth: 2,
          borderColor: value ? colors.primary : colors.border,
          backgroundColor: value ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? (
          <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 14 }}>
            ✓
          </Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {helper ? <Muted>{helper}</Muted> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Card tone="soft" style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <Heading style={{ textAlign: 'center' }}>{title}</Heading>
      <Muted style={{ textAlign: 'center' }}>{message}</Muted>
      {action ? (
        <Button label={action.label} onPress={action.onPress} fullWidth={false} />
      ) : null}
    </Card>
  );
}
