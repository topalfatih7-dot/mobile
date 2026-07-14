import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, gradients, radius, shadows, spacing } from '@/constants/theme';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

function AuthHero({
  title,
  subtitle,
  compact,
}: {
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.primary}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[
        styles.hero,
        compact && styles.heroCompact,
        { paddingTop: insets.top + spacing.sm },
      ]}>
      <View style={styles.heroDecorA} />
      <View style={styles.heroDecorB} />

      <Pressable
        accessibilityLabel="Geri"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => router.back()}
        style={styles.back}>
        <Ionicons color={colors.white} name="chevron-back" size={22} />
      </Pressable>

      <View style={styles.heroContent}>
        <Text style={styles.brandLabel}>Yeni Form</Text>
        <BrandMark size={compact ? 40 : 44} />
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

export function AuthScaffold({ title, subtitle, children, footer }: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();
  const { isAuthSplit, horizontalPadding } = useResponsive();

  const form = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: horizontalPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.flex}>
        <ResponsiveCenter>
          <View style={styles.card}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ResponsiveCenter>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {isAuthSplit ? (
        <View style={styles.splitRow}>
          <View style={styles.splitHero}>
            <AuthHero compact subtitle={subtitle} title={title} />
          </View>
          <View style={styles.splitForm}>{form}</View>
        </View>
      ) : (
        <>
          <AuthHero subtitle={subtitle} title={title} />
          {form}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  splitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  splitHero: {
    flex: 2,
    maxWidth: '42%',
  },
  splitForm: {
    flex: 3,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  heroCompact: {
    flex: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: spacing.lg,
  },
  heroDecorA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -50,
    right: -40,
  },
  heroDecorB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(196, 165, 116, 0.2)',
    bottom: 10,
    left: -30,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroContent: {
    marginTop: spacing.md,
  },
  brandLabel: {
    fontFamily: fonts.displayExtra,
    fontSize: 13,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.white,
    marginTop: spacing.sm,
  },
  titleCompact: {
    fontSize: 22,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
    maxWidth: 300,
  },
  subtitleCompact: {
    maxWidth: 280,
  },
  scroll: {
    flexGrow: 1,
  },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
