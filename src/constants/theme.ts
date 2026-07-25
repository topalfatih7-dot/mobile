/**
 * Welcome / legacy carousel tokens (önceki açılış ekranı).
 * Panel UI için birincil kaynak: src/theme + docs/mobile/02-design-system.md
 */
import { fonts as appFonts, spacing as appSpacing, radius as appRadius } from '@/theme';

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
  },
  coral: {
    50: '#FFF5F4',
    100: '#FFE3E0',
    300: '#F9A09A',
    400: '#F07167',
    500: '#E04E44',
  },
} as const;

export const colors = {
  ...palette,
  white: '#FFFFFF',
  black: '#0F172A',
} as const;

export const gradients = {
  primary: ['#0F766E', '#14B8A6'] as const,
  champagne: ['#C4A574', '#D4B88A'] as const,
  energy: ['#F07167', '#F4A261'] as const,
} as const;

export type Gradient = readonly [string, string, ...string[]];

/** Eski font adları → yüklü Inter / Plus Jakarta */
export const fonts = {
  regular: appFonts.sans,
  medium: appFonts.sansMedium,
  semibold: appFonts.sansSemi,
  bold: appFonts.sansBold,
  display: appFonts.display,
  displayBold: appFonts.displayBold,
  displayExtra: appFonts.displayExtra,
} as const;

export const spacing = appSpacing;
export const radius = appRadius;

export function glow(color: string, opacity = 0.35) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  };
}
