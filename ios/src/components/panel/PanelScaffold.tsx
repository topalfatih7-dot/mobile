import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode, RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/ui/FadeIn';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { colors, fonts, radius, spacing } from '@/theme';

function headerInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export function PanelScaffold({
  title,
  subtitle,
  children,
  showBack,
  titleBadge,
  scroll = true,
  keyboard = false,
  scrollRef,
  avatarUri,
  avatarName,
  onHeaderPress,
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
  avatarUri?: string | null;
  avatarName?: string;
  onHeaderPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const photo = String(avatarUri || '').trim();
  const identity = Boolean(photo || avatarName);
  const pressable = Boolean(onHeaderPress);

  const titleInner = (
    <>
      <View style={styles.titleRow}>
        <Text numberOfLines={2} style={[styles.title, identity && styles.titleIdentity]}>
          {title}
        </Text>
        {titleBadge ? (
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>{titleBadge}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? (
        <Text numberOfLines={2} style={[styles.sub, identity && styles.subIdentity]}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  const heading = identity ? (
    <Pressable
      accessibilityLabel={pressable ? 'Profili aç' : undefined}
      accessibilityRole={pressable ? 'button' : undefined}
      disabled={!pressable}
      onPress={onHeaderPress}
      style={({ pressed }) => [
        styles.identity,
        pressable && pressed && styles.identityPressed,
      ]}>
      {photo ? (
        <Image
          accessibilityLabel={avatarName || title}
          contentFit="cover"
          source={{ uri: photo }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>
            {headerInitials(avatarName || title)}
          </Text>
        </View>
      )}
      <View style={styles.identityText}>{titleInner}</View>
      {pressable ? (
        <View style={styles.identityChevron}>
          <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
        </View>
      ) : null}
    </Pressable>
  ) : (
    titleInner
  );

  const header = (
    <FadeIn>
      {showBack ? (
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.back}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
      ) : null}
      {heading}
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
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  identityPressed: { opacity: 0.88 },
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  identityChevron: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderRadius: 10,
    flexShrink: 0,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  avatar: {
    backgroundColor: colors.cream[100],
    borderColor: colors.brand[100],
    borderRadius: 18,
    borderWidth: 1.5,
    flexShrink: 0,
    height: 56,
    overflow: 'hidden',
    width: 56,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.brand[500],
    borderRadius: 18,
    flexShrink: 0,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarInitials: {
    color: colors.white,
    fontFamily: fonts.sansSemi,
    fontSize: 18,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.cream[900] },
  titleIdentity: { flexShrink: 1, fontSize: 22 },
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
  subIdentity: { marginBottom: 0 },
});
