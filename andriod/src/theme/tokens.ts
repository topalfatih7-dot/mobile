/**
 * Design tokens — docs/mobile/02-design-system.md
 * UI kit henüz yok; yalnızca hex / spacing.
 */

export const colors = {
  brand: {
    50: '#f0f7fb',
    100: '#dceef7',
    200: '#b8dcef',
    300: '#7ec0e2',
    400: '#4aa3d4',
    500: '#2d8fc4',
    600: '#2478a8',
    700: '#1f6289',
    800: '#1d526f',
    900: '#1a455c',
  },
  sage: {
    50: '#f2f9f5',
    100: '#e0f0e6',
    200: '#bfe0cc',
    300: '#8fc9a8',
    400: '#5fad7f',
    500: '#449664',
    600: '#357a50',
    700: '#2d6242',
  },
  warm: {
    50: '#fff9f5',
    100: '#ffede3',
    200: '#ffd4bc',
    400: '#f4a574',
    500: '#e8894f',
  },
  cream: {
    50: '#fafbfc',
    100: '#f3f6f8',
    200: '#e4eaef',
    300: '#cdd6de',
    800: '#3a4550',
    900: '#1a2332',
  },
  gold: { 400: '#d4a853', 500: '#c4923a' },
  mint: { 50: '#ecfdf5', 400: '#34d399' },
  /** Semantik hata / tehlike — mevcut UI hex’lerinin tek kaynak birleşimi */
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#dc2626',
    600: '#c2410c',
    700: '#b91c1c',
    800: '#991b1b',
  },
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
