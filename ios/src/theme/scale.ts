/**
 * Telefon pencere ölçeği — docs/mobile/02-design-system.md
 * 1.0 = 390×844 (iPhone 14 / 16e).
 *
 * iOS logical width (portrait):
 * SE 3 = 375 · 16 / 16e = 390–393 · 16 Pro = 402 · Plus = 430 · Pro Max = 440
 */

export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;
export const SCALE_MIN = 0.88;
export const SCALE_MAX = 1.12;
/** 1 = iOS Dynamic Type / Android fontScale yok. Tasarım punto sabit. */
export const MAX_FONT_SIZE_MULTIPLIER = 1;

export type PhoneBucket = 'compact' | 'regular' | 'large' | 'xl';

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function phoneBucket(width: number): PhoneBucket {
  if (width <= 360) return 'compact';
  if (width < 412) return 'regular';
  if (width < 448) return 'large';
  return 'xl';
}

export function horizontalScale(width: number) {
  return clamp(width / BASE_WIDTH, SCALE_MIN, SCALE_MAX);
}

export function verticalScaleFactor(height: number) {
  return clamp(height / BASE_HEIGHT, SCALE_MIN, SCALE_MAX);
}

/** Yazı / ikon — ılımlı */
export function ms(size: number, scale: number, factor = 0.5) {
  return Math.round((size + (size * scale - size) * factor) * 10) / 10;
}

/** Spacing — biraz daha agresif */
export function ss(size: number, scale: number, factor = 0.65) {
  return Math.round((size + (size * scale - size) * factor) * 10) / 10;
}

export function vs(size: number, vScale: number, factor = 0.5) {
  return Math.round((size + (size * vScale - size) * factor) * 10) / 10;
}

export type ScaledTheme = {
  width: number;
  height: number;
  scale: number;
  vScale: number;
  bucket: PhoneBucket;
  isCompact: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  type: {
    xs: number;
    sm: number;
    body: number;
    md: number;
    lg: number;
    xl: number;
    title: number;
    display: number;
  };
  icon: { sm: number; md: number; lg: number };
  hit: number;
  buttonMd: number;
  buttonLg: number;
  field: number;
  drawerWidth: number;
  ms: (n: number, factor?: number) => number;
  ss: (n: number, factor?: number) => number;
  vs: (n: number, factor?: number) => number;
};

export function buildScaledTheme(width: number, height: number): ScaledTheme {
  const scale = horizontalScale(width);
  const vScale = verticalScaleFactor(height);
  const bucket = phoneBucket(width);

  return {
    width,
    height,
    scale,
    vScale,
    bucket,
    isCompact: bucket === 'compact',
    spacing: {
      xs: ss(4, scale),
      sm: ss(8, scale),
      md: ss(16, scale),
      lg: ss(20, scale),
      xl: ss(24, scale),
      xxl: ss(32, scale),
    },
    type: {
      xs: ms(11, scale),
      sm: ms(13, scale),
      body: ms(15, scale),
      md: ms(16, scale),
      lg: ms(18, scale),
      xl: ms(22, scale),
      title: ms(26, scale),
      display: ms(30, scale),
    },
    icon: {
      sm: ms(16, scale),
      md: ms(22, scale),
      lg: ms(28, scale),
    },
    hit: Math.max(44, ms(44, scale, 0.35)),
    buttonMd: Math.max(48, ms(52, scale, 0.4)),
    buttonLg: Math.max(48, ms(56, scale, 0.4)),
    field: Math.max(48, ms(56, scale, 0.4)),
    drawerWidth: Math.min(ss(288, scale), width * 0.82),
    ms: (n, factor = 0.5) => ms(n, scale, factor),
    ss: (n, factor = 0.65) => ss(n, scale, factor),
    vs: (n, factor = 0.5) => vs(n, vScale, factor),
  };
}
