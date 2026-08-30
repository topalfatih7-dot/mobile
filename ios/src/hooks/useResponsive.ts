import { useWindowDimensions, type DimensionValue } from 'react-native';

import { spacing } from '@/constants/theme';
import { phoneBucket } from '@/theme/scale';

export const BREAKPOINTS = {
  compact: 360,
  regular: 412,
  large: 448,
  tablet: 768,
  wide: 1024,
  landscapeMin: 640,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;
  const isAuthSplit = isTablet || (isLandscape && width >= BREAKPOINTS.landscapeMin);
  const bucket = phoneBucket(width);
  const isCompact = bucket === 'compact';

  const contentMaxWidth = isWide ? 760 : isTablet ? 680 : width;
  const gridColumns = isTablet || (isLandscape && width >= BREAKPOINTS.landscapeMin) ? 4 : 2;
  const programColumns = isTablet || (isLandscape && width >= 600) ? 2 : 1;
  const horizontalPadding = isTablet ? spacing.xl : spacing.lg;
  const tabBarHeight = isTablet ? 72 : 66;

  const statCardWidth: DimensionValue = gridColumns === 4 ? '23.5%' : '48%';
  const programCardWidth: DimensionValue = programColumns === 2 ? '48.5%' : '100%';

  return {
    width,
    height,
    bucket,
    isCompact,
    isLandscape,
    isTablet,
    isWide,
    isAuthSplit,
    contentMaxWidth,
    gridColumns,
    programColumns,
    horizontalPadding,
    tabBarHeight,
    statCardWidth,
    programCardWidth,
  };
}
