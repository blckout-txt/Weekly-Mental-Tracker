import { useColorScheme } from 'react-native';

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
};

const light: Palette = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF1F8',
  text: '#151A22',
  textMuted: '#586376',
  textFaint: '#8A94A6',
  border: '#DFE5EF',
  primary: '#4A6CB8',
  primaryText: '#FFFFFF',
  primarySoft: '#E6ECFA',
  accent: '#3F8C74',
  accentSoft: '#E1F1EB',
  warning: '#B0722C',
  warningSoft: '#FBEEDD',
  danger: '#B34A4A',
  dangerSoft: '#FBE9E9',
  overlay: 'rgba(15, 20, 30, 0.45)',
};

const dark: Palette = {
  bg: '#0F1218',
  surface: '#171C25',
  surfaceAlt: '#1F2632',
  text: '#EAEEF5',
  textMuted: '#9BA6B8',
  textFaint: '#6E7A8D',
  border: '#2A323F',
  primary: '#7D9BE0',
  primaryText: '#101520',
  primarySoft: '#1D2740',
  accent: '#6FBFA1',
  accentSoft: '#16302A',
  warning: '#D9A05C',
  warningSoft: '#33260F',
  danger: '#E28A8A',
  dangerSoft: '#3A1F1F',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;

export type Theme = {
  colors: Palette;
  dark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? dark : light, dark: isDark };
}

/**
 * Colour for a 1-10 mood score, running from a muted red through amber to
 * green. Deliberately desaturated: a bad day should not be shouted at you.
 */
export function moodColor(mood: number, isDark: boolean): string {
  const scale = isDark
    ? ['#C2686B', '#C2686B', '#C97F63', '#CE9663', '#CBAA69', '#B8B473', '#96B37C', '#7BAE85', '#68A98D', '#5CA394']
    : ['#B85C60', '#B85C60', '#BF7454', '#C58C55', '#C2A05C', '#AEAA66', '#8CA971', '#71A47B', '#5E9F84', '#52998B'];
  const index = Math.min(9, Math.max(0, Math.round(mood) - 1));
  return scale[index];
}

/** Background tint for a risk level. */
export function riskColors(
  level: 'steady' | 'elevated' | 'urgent',
  colors: Palette,
): { bg: string; fg: string } {
  switch (level) {
    case 'urgent':
      return { bg: colors.dangerSoft, fg: colors.danger };
    case 'elevated':
      return { bg: colors.warningSoft, fg: colors.warning };
    default:
      return { bg: colors.accentSoft, fg: colors.accent };
  }
}
