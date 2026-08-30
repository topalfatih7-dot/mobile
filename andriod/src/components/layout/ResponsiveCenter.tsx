import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

type ResponsiveCenterProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
};

/** Tablet / yatay modda içeriği ortalar ve maksimum genişlik uygular. */
export function ResponsiveCenter({ children, style, innerStyle }: ResponsiveCenterProps) {
  const { contentMaxWidth } = useResponsive();

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, { maxWidth: contentMaxWidth }, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
});
