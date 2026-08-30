import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode, RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/ui/FadeIn';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { colors, fonts, radius, spacing } from '@/theme';

export function PanelScaffold({
  title,
  subtitle,
  children,
  showBack,
  titleBadge,
  scroll = true,
  keyboard = false,
  scrollRef,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
  titleBadge?: string;
  /** false → View (FlatList vb. için; ScrollView içine VirtualizedList koyma) */
  scroll?: boolean;
  keyboard?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
}) {
  const insets = useSafeAreaInsets();
  const header = (
    <FadeIn>
      {showBack ? (
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.back}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
      ) : null}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {titleBadge ? (
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>{titleBadge}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </FadeIn>
  );

  if (!scroll) {
    const fill = (
      <View
        style={[
          styles.content,
          styles.contentFill,
          { paddingTop: spacing.sm, paddingBottom: insets.bottom + 16 },
        ]}>
        {header}
        {children}
      </View>
    );
    return (
      <MeshBackground style={styles.root}>
        {keyboard ? (
          <KeyboardAvoidingView behavior="padding" style={styles.root}>
            {fill}
          </KeyboardAvoidingView>
        ) : (
          fill
        )}
      </MeshBackground>
    );
  }

  const contentStyle = [
    styles.content,
    { paddingTop: spacing.sm, paddingBottom: insets.bottom + 32 },
  ];

  const scroller = keyboard ? (
    <FormKeyboardScroll contentContainerStyle={contentStyle}>
      {header}
      {children}
    </FormKeyboardScroll>
  ) : (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}>
      {header}
      {children}
    </ScrollView>
  );

  return <MeshBackground style={styles.root}>{scroller}</MeshBackground>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  contentFill: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.cream[900] },
  titleBadge: {
    backgroundColor: colors.gold[400],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  titleBadgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.white },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
