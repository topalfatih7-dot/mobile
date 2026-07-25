import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HealthRadarScores } from '@/components/health-test/HealthRadarScores';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import {
  getHealthTestHubSections,
  getOverallHealthTestProgress,
  HEALTH_AUDIENCE_META,
  isHealthTestComplete,
} from '@/data/healthTest';
import { calculateRadarScores } from '@/services/aiAnalysis';
import { getMissingAnalysisProfileFields } from '@/utils/healthProfile';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SECTION_ICON: Record<string, IoniconName> = {
  HeartPulse: 'heart',
  Stethoscope: 'medkit',
  Dumbbell: 'barbell',
  Activity: 'pulse',
  Venus: 'female',
  Mars: 'male',
  Apple: 'nutrition',
  Moon: 'moon',
  Clock3: 'time',
  Flower2: 'sparkles',
};

/** Web CARD_THEME → solid RN colors (design-system tokens only) */
const CARD_THEME: Record<
  string,
  { bg: string; border: string; iconBg: string; iconColor: string }
> = {
  general: {
    bg: colors.brand[50],
    border: colors.brand[200],
    iconBg: colors.white,
    iconColor: colors.brand[600],
  },
  medical: {
    bg: colors.danger[50],
    border: colors.danger[100],
    iconBg: colors.white,
    iconColor: colors.danger[600],
  },
  physical: {
    bg: colors.warm[50],
    border: colors.warm[200],
    iconBg: colors.white,
    iconColor: colors.warm[500],
  },
  lifestyle: {
    bg: colors.brand[50],
    border: colors.brand[200],
    iconBg: colors.white,
    iconColor: colors.brand[500],
  },
  women: {
    bg: colors.warm[50],
    border: colors.warm[200],
    iconBg: colors.white,
    iconColor: colors.warm[500],
  },
  men: {
    bg: colors.cream[100],
    border: colors.cream[200],
    iconBg: colors.white,
    iconColor: colors.cream[800],
  },
  diet_reason: {
    bg: colors.sage[50],
    border: colors.sage[200],
    iconBg: colors.white,
    iconColor: colors.sage[600],
  },
  diet_health: {
    bg: colors.danger[50],
    border: colors.danger[100],
    iconBg: colors.white,
    iconColor: colors.danger[600],
  },
  diet_lifestyle: {
    bg: colors.brand[50],
    border: colors.brand[200],
    iconBg: colors.white,
    iconColor: colors.brand[500],
  },
  diet_activity: {
    bg: colors.warm[50],
    border: colors.warm[200],
    iconBg: colors.white,
    iconColor: colors.warm[500],
  },
  diet_nutrition: {
    bg: colors.sage[50],
    border: colors.sage[200],
    iconBg: colors.white,
    iconColor: colors.sage[600],
  },
  diet_women: {
    bg: colors.warm[50],
    border: colors.warm[200],
    iconBg: colors.white,
    iconColor: colors.warm[500],
  },
  diet_extra: {
    bg: colors.brand[50],
    border: colors.brand[200],
    iconBg: colors.white,
    iconColor: colors.brand[600],
  },
};

function cardTheme(id: string) {
  return CARD_THEME[id] || CARD_THEME.general;
}

function AnimatedProgressFill({ pct }: { pct: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(pct, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [pct, width]);
  const anim = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <Animated.View style={[styles.overallFill, anim]}>
      <LinearGradient
        colors={[colors.brand[500], colors.sage[500]]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/**
 * LOCK: docs/mobile/screens/member/health-test-hub.md
 * Web parity: HealthTestPage + HealthTestHub
 */
export default function HealthTestHub() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { isFreeTrialExpired } = useData();
  const { updateProfile } = useActions();
  const [healthAck, setHealthAck] = useState(Boolean(member?.healthAck));
  const [disclaimer, setDisclaimer] = useState(Boolean(member?.disclaimer));
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { packageConfig } = useMemo(() => {
    if (!member) return { packageConfig: getDefaultPackageForPlan('free') };
    return resolveMemberEntitlements(member as never);
  }, [member]);

  const gender = member?.gender ? String(member.gender) : null;
  const healthTest = (member?.healthTest as Record<string, unknown>) || {};

  const hubSections = useMemo(
    () => getHealthTestHubSections(gender, packageConfig, healthTest),
    [gender, packageConfig, healthTest],
  );
  const overall = useMemo(
    () => getOverallHealthTestProgress(healthTest, gender, packageConfig),
    [healthTest, gender, packageConfig],
  );

  const needsConsent = !member?.healthAck || !member?.disclaimer;
  const fullyComplete =
    isHealthTestComplete(healthTest, gender, packageConfig) &&
    Boolean(member?.healthAck) &&
    Boolean(member?.disclaimer);

  const missingProfile = useMemo(
    () => getMissingAnalysisProfileFields(member as Record<string, unknown>),
    [member],
  );

  const radarScores = useMemo(() => {
    if (!fullyComplete) return null;
    const stored = (member?.healthAnalysis as { radarScores?: Record<string, number> })
      ?.radarScores;
    if (stored) return stored;
    return calculateRadarScores({
      ...(member as Record<string, unknown>),
      healthTest,
      gender,
      packageConfig,
    });
  }, [fullyComplete, member, healthTest, gender, packageConfig]);

  const saveConsent = async () => {
    if (!healthAck || !disclaimer) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    await updateProfile(
      { healthAck, disclaimer },
      { toastMsg: 'Onaylar kaydedildi. Testlere başlayabilirsiniz.' },
    );
    setSaving(false);
  };

  if (isFreeTrialExpired) {
    return <FreeTrialExpiredGate />;
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}>
        <FadeIn>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
          <Text style={styles.title}>Sağlık Testleri</Text>
          <Text style={styles.sub}>
            {needsConsent
              ? 'Testlere başlamadan önce onayları işaretleyin'
              : 'Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz'}
          </Text>
        </FadeIn>

        {missingProfile.length > 0 ? (
          <FadeIn delay={40}>
            <Pressable
              onPress={() => router.push('/(member)/profile' as Href)}
              style={styles.profileBanner}>
              <Ionicons color={colors.warm[500]} name="alert-circle" size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.profileKicker}>Analiz kalitesi için önemli</Text>
                <Text style={styles.profileBannerTitle}>
                  Sağlık testi tek başına yeterli değildir
                </Text>
                <Text style={styles.profileBannerSub}>
                  Eksik: {missingProfile.map((m) => m.label).join(', ')}
                </Text>
              </View>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
            </Pressable>
          </FadeIn>
        ) : null}

        {needsConsent ? (
          <FadeIn delay={60}>
            <View style={styles.consentCard}>
              <View style={styles.consentInfo}>
                <Ionicons
                  color={colors.brand[600]}
                  name="shield-checkmark"
                  size={18}
                />
                <Text style={styles.consentInfoText}>
                  Testlere başlamadan önce onayları işaretleyin
                </Text>
              </View>
              <CheckboxRow
                checked={healthAck}
                label="Sağlık bilgilerimin değerlendirilmesini onaylıyorum."
                onChange={setHealthAck}
              />
              {showErrors && !healthAck ? (
                <Text style={styles.errorText}>Bu onay zorunludur.</Text>
              ) : null}
              <CheckboxRow
                checked={disclaimer}
                label="Bu testlerin tıbbi tanı yerine geçmediğini kabul ediyorum."
                onChange={setDisclaimer}
              />
              {showErrors && !disclaimer ? (
                <Text style={styles.errorText}>Bu onay zorunludur.</Text>
              ) : null}
              <Button
                label={saving ? 'Kaydediliyor…' : 'Onayları kaydet'}
                loading={saving}
                onPress={saveConsent}
                size="md"
              />
            </View>
          </FadeIn>
        ) : (
          <>
            <FadeIn delay={50}>
              <View style={styles.overallCard}>
                <View style={styles.overallTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.overallKicker}>Toplam ilerleme</Text>
                    <Text style={styles.overallTitle}>
                      {overall.completed} / {overall.total} test
                    </Text>
                    <Text style={styles.overallSub}>
                      Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla
                      ilerleyebilirsiniz.
                    </Text>
                  </View>
                  <View style={styles.overallPct}>
                    <Text style={styles.overallPctText}>{overall.percent}%</Text>
                  </View>
                </View>
                <View style={styles.overallTrack}>
                  <AnimatedProgressFill pct={overall.percent} />
                </View>
              </View>
            </FadeIn>

            {fullyComplete ? (
              <FadeIn delay={70}>
                <View style={styles.doneBanner}>
                  <Ionicons
                    color={colors.sage[600]}
                    name="checkmark-circle"
                    size={20}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doneBannerText}>
                      Tüm sağlık testleri kaydedildi
                    </Text>
                    <Text style={styles.doneBannerSub}>
                      Cevaplarınız profilinizde saklanır; koç, diyetisyen ve doktor
                      panelinde görünür. İstediğiniz kategoriyi tekrar açıp
                      güncelleyebilirsiniz.
                    </Text>
                  </View>
                </View>
                {radarScores ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <HealthRadarScores radarScores={radarScores} />
                  </View>
                ) : null}
              </FadeIn>
            ) : null}

            {hubSections.map(({ section, progress }, i) => {
              const theme = cardTheme(section.id);
              const audienceMeta =
                HEALTH_AUDIENCE_META[section.audience || 'shared'];
              const iconName =
                SECTION_ICON[section.icon || ''] || ('fitness' as IoniconName);

              let statusLabel = 'Başla';
              let statusBg: string = colors.cream[100];
              let statusColor: string = colors.cream[800];
              if (progress.complete) {
                statusLabel = 'Tamamlandı';
                statusBg = colors.sage[100];
                statusColor = colors.sage[700];
              } else if (progress.started || progress.requiredAnswered > 0) {
                statusLabel = 'Devam et';
                statusBg = colors.warm[100];
                statusColor = colors.warm[500];
              }

              const progressPercent = progress.complete ? 100 : progress.percent;

              return (
                <FadeIn key={section.id} delay={80 + i * 25}>
                  <Pressable
                    onPress={() =>
                      router.push(`/(member)/health-test/${section.id}` as Href)
                    }
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: theme.bg,
                        borderColor: theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.icon,
                          { backgroundColor: theme.iconBg },
                        ]}>
                        <Ionicons
                          color={
                            progress.complete
                              ? colors.sage[600]
                              : theme.iconColor
                          }
                          name={
                            progress.complete ? 'checkmark-circle' : iconName
                          }
                          size={20}
                        />
                      </View>
                      <View
                        style={[
                          styles.audienceChip,
                          { backgroundColor: audienceMeta.chipBg },
                        ]}>
                        <Text
                          style={[
                            styles.audienceChipText,
                            { color: audienceMeta.chipText },
                          ]}>
                          {audienceMeta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{section.title}</Text>
                    <Text style={styles.cardSub}>{section.subtitle || ''}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.progressCount}>
                        {progress.complete
                          ? `${progress.requiredTotal} / ${progress.requiredTotal} soru`
                          : `${progress.requiredAnswered} / ${progress.requiredTotal} soru`}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: statusBg },
                        ]}>
                        {progress.complete ? (
                          <Ionicons
                            color={statusColor}
                            name="checkmark-circle"
                            size={12}
                          />
                        ) : null}
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor: progress.complete
                              ? colors.sage[500]
                              : colors.brand[500],
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                </FadeIn>
              );
            })}
          </>
        )}
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.brand[600],
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  consentCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  consentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  consentInfoText: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
    lineHeight: 18,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
    marginTop: -4,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.warm[50],
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.warm[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  profileKicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.warm[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profileBannerTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
    marginTop: 2,
  },
  profileBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.75,
    marginTop: 2,
  },
  overallCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  overallTop: { flexDirection: 'row', gap: spacing.md },
  overallKicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overallTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.cream[900],
    marginTop: 2,
  },
  overallSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: 4,
    lineHeight: 18,
  },
  overallPct: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallPctText: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.brand[600],
  },
  overallTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  overallFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.sage[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sage[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  doneBannerText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.sage[700],
  },
  doneBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.sage[700],
    opacity: 0.75,
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  audienceChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
  },
  cardTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.cream[900],
    marginTop: 4,
  },
  cardSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
    lineHeight: 17,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 999 },
});
