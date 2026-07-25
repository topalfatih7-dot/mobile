import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

export type ProfileAccent = 'brand' | 'sage' | 'amber' | 'violet' | 'rose';

const ACCENTS: Record<
  ProfileAccent,
  { icon: [string, string]; border: string; glow: string; bg: [string, string] }
> = {
  brand: {
    icon: [colors.brand[500], colors.brand[600]],
    border: colors.brand[100],
    glow: 'rgba(45,143,196,0.12)',
    bg: [colors.brand[50], colors.white],
  },
  sage: {
    icon: [colors.sage[500], colors.sage[600]],
    border: colors.sage[100],
    glow: 'rgba(68,150,100,0.12)',
    bg: [colors.sage[50], colors.white],
  },
  amber: {
    icon: [colors.warm[500], colors.gold[500]],
    border: colors.warm[100],
    glow: 'rgba(232,137,79,0.14)',
    bg: [colors.warm[50], colors.white],
  },
  violet: {
    icon: ['#8b5cf6', '#7c3aed'],
    border: '#ede9fe',
    glow: 'rgba(139,92,246,0.12)',
    bg: ['#f5f3ff', colors.white],
  },
  rose: {
    icon: ['#f43f5e', '#ec4899'],
    border: '#ffe4e6',
    glow: 'rgba(244,63,94,0.12)',
    bg: ['#fff1f2', colors.white],
  },
};

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  accent?: ProfileAccent;
  children?: ReactNode;
  action?: ReactNode;
  delay?: number;
};

/** Web ProfileSectionCard parity. */
export function ProfileSectionCard({
  icon,
  title,
  subtitle,
  accent = 'brand',
  children,
  action,
  delay = 0,
}: Props) {
  const tone = ACCENTS[accent] || ACCENTS.brand;

  return (
    <FadeIn delay={delay}>
      <LinearGradient
        colors={tone.bg as [string, string]}
        style={[styles.card, { borderColor: tone.border }]}>
        <View style={[styles.glow, { backgroundColor: tone.glow }]} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={tone.icon as [string, string]} style={styles.iconBox}>
              <Ionicons color={colors.white} name={icon} size={20} />
            </LinearGradient>
            <View style={styles.titles}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
        {children ? <View style={styles.body}>{children}</View> : null}
      </LinearGradient>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    minWidth: 160,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 2,
  },
  action: { flexShrink: 0, alignSelf: 'flex-start' },
  body: { marginTop: spacing.md },
});
