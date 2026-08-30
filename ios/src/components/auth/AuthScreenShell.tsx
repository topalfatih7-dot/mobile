import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  topSlot?: ReactNode;
};

/** Ortak auth kabuğu — input’lar animasyonlu wrapper’da değil (focus/scroll bug). */
export function AuthScreenShell({ title, subtitle, children, topSlot }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AuthSceneBackground />
      <FormKeyboardScroll
        bottomOffset={72}
        extraKeyboardSpace={48}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          {children}
        </View>
        {topSlot}
      </FormKeyboardScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  content: { paddingHorizontal: spacing.lg },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    marginBottom: spacing.md,
  },
  sheet: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    boxShadow: '0px 12px 24px rgba(26,69,92,0.12)',
    elevation: 8,
  },
});
