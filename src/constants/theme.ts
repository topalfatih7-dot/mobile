/**
 * Yeni Form — mobil tema sistemi.
 * Marka çekirdeği web `index.css` @theme renklerinden gelir (mavi → yeşil),
 * üzerine mobil-native, modern ve canlı kategori aksanları eklenir.
 */

/** Ham renk skalaları */
export const palette = {
  /** Marka mavisi (logo sol-üst) */
  brand: {
    50: '#eef7fc',
    100: '#d6ecf8',
    200: '#aedaf0',
    300: '#7bc1e4',
    400: '#46a4d6',
    500: '#2d8fc4',
    600: '#2478a8',
    700: '#1f6289',
    800: '#1d526f',
    900: '#163e57',
  },
  /** Marka yeşili (logo sağ-alt) */
  sage: {
    50: '#eef9f2',
    100: '#d6f0de',
    200: '#aee0bd',
    300: '#7ccb96',
    400: '#5fad7f',
    500: '#449664',
    600: '#357a50',
    700: '#2a6140',
    800: '#234e35',
    900: '#1c402c',
  },
  /** Enerji / antrenman */
  coral: {
    50: '#fff1ed',
    100: '#ffe0d6',
    300: '#ff9f86',
    400: '#ff7e5f',
    500: '#fb5b45',
    600: '#e63f31',
  },
  /** Beslenme / başarı */
  amber: {
    50: '#fff8eb',
    100: '#fdedc8',
    300: '#fbcc55',
    400: '#f7b32b',
    500: '#ef9a07',
    600: '#cf7d04',
  },
  /** Zihin / motivasyon */
  violet: {
    50: '#f3f1fe',
    100: '#e6e2fd',
    300: '#b8aef8',
    400: '#9a8cf2',
    500: '#7c6cf0',
    600: '#6450dd',
  },
  /** Su / toparlanma */
  teal: {
    50: '#e9fbf9',
    100: '#c9f5f0',
    300: '#6fe2d6',
    400: '#2dd4bf',
    500: '#11b6a6',
    600: '#0c9183',
  },
  /** Nötr / metin / yüzey */
  ink: {
    50: '#f6f9fc',
    100: '#eef3f8',
    200: '#e0e8f0',
    300: '#c6d2de',
    400: '#94a6b8',
    500: '#6b7d90',
    600: '#4d5f72',
    700: '#374859',
    800: '#243343',
    900: '#13202e',
  },
} as const;

export const colors = {
  ...palette,
  white: '#ffffff',
  black: '#0b1620',
  /** Uygulama arka planı — hafif mavi-yeşile çalan açık ton */
  background: '#f2f7fb',
  surface: '#ffffff',
  surfaceAlt: '#f6fafd',
  border: 'rgba(22, 62, 87, 0.08)',
  borderStrong: 'rgba(22, 62, 87, 0.14)',
  overlay: 'rgba(11, 22, 32, 0.45)',
  text: {
    primary: palette.ink[900],
    secondary: palette.ink[600],
    muted: palette.ink[400],
    inverse: '#ffffff',
    onBrand: 'rgba(255,255,255,0.92)',
  },
  success: '#1fa463',
  warning: '#f7b32b',
  danger: '#ef4444',
  info: palette.brand[500],
} as const;

/** LinearGradient için hazır renk dizileri (en az 2 stop, tuple olarak). */
export const gradients = {
  /** Ana marka geçişi — mavi → teal → yeşil (logo) */
  brand: ['#2d8fc4', '#2aa79a', '#449664'],
  /** Daha canlı marka varyantı (hero arka plan) */
  brandVivid: ['#1f8ac4', '#16b6a6', '#34c77b'],
  /** Açık marka yüzeyi */
  brandSoft: ['#eef7fc', '#eef9f2'],
  ocean: ['#1f8ac4', '#22c1c3'],
  coral: ['#ff8a5b', '#fb5b6d'],
  sunset: ['#ffb020', '#ff6a3d'],
  violet: ['#8b7cf0', '#a855f7'],
  amber: ['#ffc24b', '#f7900b'],
  teal: ['#11c2b0', '#2dd4bf'],
  forest: ['#3fce86', '#1f9a59'],
  rose: ['#ff7eb3', '#f43f5e'],
  /** Kart parlaması */
  card: ['#ffffff', '#f3f9fd'],
  /** Koyu cam yüzey */
  glass: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)'],
} as const;

export type GradientName = keyof typeof gradients;
export type Gradient = readonly [string, string, ...string[]];

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'PlusJakartaSans_700Bold',
  displaySemibold: 'PlusJakartaSans_600SemiBold',
  displayExtra: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Tipografi ölçeği (fontSize / lineHeight) */
export const type = {
  hero: { fontFamily: fonts.displayExtra, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fonts.displaySemibold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
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
  lg: 22,
  xl: 28,
  xxl: 36,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#10314a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#10314a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0b2236',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;

/** Renkli buton/kart parlaması için yardımcı gölge. */
export function glow(color: string, opacity = 0.34) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: opacity,
    shadowRadius: 22,
    elevation: 10,
  };
}
