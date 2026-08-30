import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { buildScaledTheme, type ScaledTheme } from '@/theme/scale';

export function useScaledTheme(): ScaledTheme {
  const { width, height } = useWindowDimensions();
  return useMemo(() => buildScaledTheme(width, height), [width, height]);
}
