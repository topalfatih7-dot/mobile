import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fonts, gradients, radius, shadows, spacing } from '@/constants/theme';

type DashboardHeaderProps = {
  name: string;
  dateLabel: string;
  goalProgress: number;
  goalCompleted: number;
  goalTotal: number;
  streakDays: number;
};

export function DashboardHeader({
  name,
  dateLabel,
  goalProgress,
  goalCompleted,
  goalTotal,
  streakDays,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.decorA} />
        <View style={styles.decorB} />

        <View style={styles.topRow}>
          <Avatar name={name} ring size={50} />

          <View style={styles.greeting}>
            <Text style={styles.date}>{dateLabel}</Text>
            <Text style={styles.hello}>Merhaba, {name.split(' ')[0]} 👋</Text>
          </View>

          <Pressable accessibilityRole="button" hitSlop={8} style={styles.bell}>
            <Ionicons color={colors.white} name="notifications-outline" size={21} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.goalCard}>
        <View style={styles.goalTop}>
          <View style={styles.flex}>
            <Text style={styles.overline}>GÜNLÜK HEDEF</Text>
            <Text style={styles.percent}>%{Math.round(goalProgress * 100)}</Text>
            <Text style={styles.goalCaption}>
              {goalCompleted}/{goalTotal} görev tamamlandı
            </Text>
          </View>

          <View style={styles.streak}>
            <Ionicons color={colors.coral[500]} name="flame" size={16} />
            <Text style={styles.streakValue}>{streakDays}</Text>
            <Text style={styles.streakLabel}>gün seri</Text>
          </View>
        </View>

        <View style={styles.dots}>
          {Array.from({ length: goalTotal }).map((_, i) => (
            <View key={i} style={[styles.goalDot, i < goalCompleted && styles.goalDotOn]} />
          ))}
        </View>

        <ProgressBar gradient={gradients.brand} progress={goalProgress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  decorA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -40,
    right: -30,
  },
  decorB: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: 30,
    left: -40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    flex: 1,
    marginLeft: spacing.md,
  },
  date: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.8)',
  },
  hello: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.white,
    marginTop: 2,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.coral[400],
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  goalCard: {
    marginTop: -(spacing.xxl + spacing.md),
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text.muted,
  },
  percent: {
    fontFamily: fonts.displayExtra,
    fontSize: 34,
    color: colors.text.primary,
    marginTop: 2,
  },
  goalCaption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.coral[50],
  },
  streakValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.coral[600],
  },
  streakLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.coral[600],
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  goalDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink[200],
  },
  goalDotOn: {
    backgroundColor: colors.sage[400],
  },
});
