import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
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

  const body = (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {topSlot}
      <Text style={styles.brand}>Yeni Form</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.sheet}>{children}</View>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <AuthSceneBackground />
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    color: colors.white,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  sub: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: spacing.md,
    maxWidth: 360,
  },
  sheet: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    shadowColor: colors.brand[900],
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
