import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { colors, spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  aurora?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: { top?: boolean; bottom?: boolean };
};

/** Lumina ekran kabuğu — mist canvas + safe area. */
export function Screen({
  children,
  scroll = false,
  aurora = false,
  style,
  contentStyle,
  edges = { top: true, bottom: true },
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.top ? insets.top : 0,
    paddingBottom: edges.bottom ? insets.bottom + spacing.md : spacing.md,
  };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, pad, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.flex}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );

  if (aurora) {
    return (
      <AuroraBackground>
        <View style={[styles.flex, style]}>{body}</View>
      </AuroraBackground>
    );
  }

  return <View style={[styles.root, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
});
