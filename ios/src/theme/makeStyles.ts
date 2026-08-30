import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import type { ScaledTheme } from '@/theme/scale';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useMakeStyles<T extends NamedStyles<T>>(factory: (t: ScaledTheme) => T): T {
  const theme = useScaledTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
