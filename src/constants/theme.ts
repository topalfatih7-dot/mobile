/**
 * Yeni Form Mobile — Lumina design system tokens.
 * @see docs/DESIGN_SYSTEM.md
 */

export const palette = {
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#14B8A6',
    500: '#0D9488',
    600: '#0F766E',
    700: '#115E59',
    800: '#134E4A',
    900: '#042F2E',
  },
  champagne: {
    50: '#FAF6F0',
    100: '#F0E6D6',
    200: '#E2CFAE',
    300: '#D4B88A',
    400: '#C4A574',
    500: '#B08D5A',
    600: '#8F7045',
    700: '#6B5434',
    800: '#4A3A24',
    900: '#2E2416',
  },
  coral: {
    50: '#FFF5F4',
    100: '#FFE3E0',
    200: '#FFC5BF',
    300: '#F9A09A',
    400: '#F07167',
    500: '#E04E44',
    600: '#C2362E',
    700: '#9B2B24',
    800: '#72201B',
    900: '#4A1512',
  },
  ink: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  /** @deprecated alias → teal (Lumina primary) */
  brand: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#14B8A6',
    500: '#0D9488',
    600: '#0F766E',
    700: '#115E59',
    800: '#134E4A',
    900: '#042F2E',
  },
  /** @deprecated soft accent → champagne */
  sage: {
    50: '#FAF6F0',
    100: '#F0E6D6',
    200: '#E2CFAE',
    300: '#D4B88A',
    400: '#C4A574',
    500: '#B08D5A',
    600: '#8F7045',
    700: '#6B5434',
    800: '#4A3A24',
    900: '#2E2416',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#D97706',
    600: '#B45309',
  },
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
  },
} as const;

export const colors = {
  ...palette,
  white: '#FFFFFF',
  black: '#0F172A',
  canvas: '#F4F7FA',
  background: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EEF3',
  surfaceMuted: '#E8EEF3',
  border: '#D8E2EA',
  borderStrong: '#B8C9D6',
  overlay: 'rgba(15, 23, 42, 0.45)',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
    onBrand: 'rgba(255,255,255,0.92)',
  },
  success: '#0D9488',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0F766E',
  champagne: '#C4A574',
} as const;

export const gradients = {
  primary: ['#0F766E', '#14B8A6'],
  brand: ['#0F766E', '#14B8A6'],
  brandVivid: ['#0F766E', '#2DD4BF'],
  brandSoft: ['#F0FDFA', '#FAF6F0'],
  aurora: ['#CCFBF1', '#F4F7FA', '#F0E6D6'],
  auroraDeep: ['#0F766E', '#134E4A', '#0F172A'],
  ocean: ['#0F766E', '#14B8A6'],
  coral: ['#F07167', '#F9A09A'],
  energy: ['#F07167', '#F4A261'],
  sunset: ['#C4A574', '#F07167'],
  champagne: ['#C4A574', '#D4B88A'],
  teal: ['#0D9488', '#14B8A6'],
  forest: ['#0F766E', '#0D9488'],
  amber: ['#D97706', '#FBBF24'],
  violet: ['#0F766E', '#14B8A6'],
  rose: ['#F07167', '#E04E44'],
  card: ['#FFFFFF', '#F4F7FA'],
  glass: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)'],
} as const;

export type GradientName = keyof typeof gradients;
export type Gradient = readonly [string, string, ...string[]];

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  display: 'Outfit_700Bold',
  displaySemibold: 'Outfit_600SemiBold',
  displayExtra: 'Outfit_800ExtraBold',
} as const;

export const type = {
  hero: { fontFamily: fonts.displayExtra, fontSize: 34, lineHeight: 40 },
  display: { fontFamily: fonts.displayExtra, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  headline: { fontFamily: fonts.displaySemibold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.displaySemibold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 36,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;

export function glow(color: string, opacity = 0.28) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: opacity,
    shadowRadius: 18,
    elevation: 8,
  };
}
