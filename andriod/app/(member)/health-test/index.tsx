import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentProps } from 'react';
import { findNodeHandle, Pressable, StyleSheet, Text, View } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HealthProfileGateForm } from '@/components/health-test/HealthProfileGateForm';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { MemberHealthBrief } from '@/components/dashboard/MemberHealthBrief';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { FadeIn } from '@/components/ui/FadeIn';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  getCoreHealthTestKeySet,
  getCoreHealthTestProgress,
} from '@/data/coreHealthTest';
import {
  getRemainingHubSections,
  HEALTH_AUDIENCE_META,
} from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import { useHealthAnalysisSync } from '@/hooks/useHealthAnalysisSync';
import {
  getHealthTestLockState,
  needsInitialHealthAnalysis,
  resolveMemberBrief,
} from '@/services/healthScoreAnalysis';
import { hasCompleteAnalysisProfile } from '@/utils/healthProfile';
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

function getScrollContentHost(scroll: KeyboardAwareScrollViewRef | null): object | null {
  if (!scroll) return null;
  const s = scroll as unknown as {
    getInnerViewRef?: () => unknown;
    getNativeScrollRef?: () => unknown;
  };
  const inner = s.getInnerViewRef?.();
  if (inner && typeof inner === 'object') return inner;
  const native = s.getNativeScrollRef?.();
  if (native && typeof native === 'object') return native;
  return null;
}

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
    bg: colors.brand[50],
    border: colors.brand[200],
    iconBg: colors.white,
    iconColor: colors.brand[600],
  },
  nutrition: {
    bg: colors.sage[50],
    border: colors.sage[200],
    iconBg: colors.white,
    iconColor: colors.sage[600],
  },
};

function formatLockedUntil(date: Date | null): string {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * LOCK: docs/mobile/screens/member/health-test-hub.md
 * Web parity: HealthTestHub — 2 aşamalı (core → optional)
 */
export default function HealthTestHubScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { isFreeTrialExpired, isUnpaidMember } = useData();
  const { updateProfile } = useActions();
  const { toast } = useToast();
  const {
    analysis,
    history,
    loading: analysisLoading,
    error: analysisError,
    coreComplete,
    detailedComplete,
    analysisStage,
    runSync,
  } = useHealthAnalysisSync();

  const [localAck, setLocalAck] = useState(Boolean(member?.healthAck));
  const [localDisclaimer, setLocalDisclaimer] = useState(
    Boolean(member?.disclaimer),
  );
  const [consentSaving, setConsentSaving] = useState(false);
  const [profileGateSaving, setProfileGateSaving] = useState(false);
  const [retakeSaving, setRetakeSaving] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);
  const [showConsentErrors, setShowConsentErrors] = useState(false);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const firstIncompleteRef = useRef<View>(null);

  const packageConfig = useMemo(() => {
    if (!member) return getDefaultPackageForPlan('free');
    const entitlements = resolveMemberEntitlements(member as never);
    return (
      (entitlements.packageConfig as Record<string, unknown>) ||
      getDefaultPackageForPlan(String(entitlements.membership || 'free'))
    );
  }, [member]);

  const gender = member?.gender ? String(member.gender) : null;
  const healthTest = (member?.healthTest || {}) as Record<string, unknown>;
  const coreKeys = useMemo(() => getCoreHealthTestKeySet(gender), [gender]);
  const coreProgress = useMemo(
    () => getCoreHealthTestProgress(healthTest, gender),
    [healthTest, gender],
  );

  const sections = useMemo(
    () => getRemainingHubSections(gender, packageConfig, healthTest, coreKeys),
    [gender, packageConfig, healthTest, coreKeys],
  );

  const remainingSectionsDone = sections.filter((s) => s.progress.complete).length;
  const remainingAnswered = sections.reduce(
    (sum, s) => sum + s.progress.requiredAnswered,
    0,
  );
  const remainingTotal = sections.reduce(
    (sum, s) => sum + s.progress.requiredTotal,
    0,
  );
  const remainingPercent = remainingTotal
    ? Math.round((remainingAnswered / remainingTotal) * 100)
    : 0;

  const needsConsent = !member?.healthAck || !member?.disclaimer;
  const profileReady = hasCompleteAnalysisProfile(member as never);
  const analysisReady = !needsInitialHealthAnalysis(analysis);
  const lockState = getHealthTestLockState({
    healthAnalysis: analysis,
    detailedComplete,
    optionalCompletedAt: healthTest.optionalCompletedAt
      ? String(healthTest.optionalCompletedAt)
      : null,
    retakeAt: healthTest.retakeAt ? String(healthTest.retakeAt) : null,
  });
  const awaitingRetake = Boolean(
    lockState.canRetake && coreComplete && analysisReady,
  );
  const awaitingCoreAnalysis = coreComplete && !analysisReady;
  const showOptionalGrid = !lockState.fullLock && !awaitingRetake;
  const firstIncompleteSectionId =
    sections.find((s) => !s.progress.complete)?.section.id ?? null;
  const showScrollToIncomplete = Boolean(
    showOptionalGrid && !detailedComplete && firstIncompleteSectionId,
  );
  const lockedUntilLabel = formatLockedUntil(lockState.lockedUntil);
  const memberBrief = resolveMemberBrief(analysis);

  const handleConsentSubmit = useCallback(async () => {
    if (!localAck || !localDisclaimer) {
      setShowConsentErrors(true);
      return;
    }
    setConsentSaving(true);
    try {
      await updateProfile(
        { healthAck: true, disclaimer: true },
        { toastMsg: 'Onaylar kaydedildi. Analize başlayabilirsiniz.' },
      );
    } finally {
      setConsentSaving(false);
    }
  }, [localAck, localDisclaimer, updateProfile]);

  const handleProfileGateSave = useCallback(
    async (patch: Record<string, unknown>) => {
      setProfileGateSaving(true);
      try {
        await updateProfile(patch, {
          toastMsg: 'Profil bilgileriniz kaydedildi.',
        });
      } finally {
        setProfileGateSaving(false);
      }
    },
    [updateProfile],
  );

  const [coreStarting, setCoreStarting] = useState(false);
  const handleStartCoreAnalysis = useCallback(async () => {
    if (coreStarting || analysisLoading) return;
    setCoreStarting(true);
    try {
      const next = await runSync({ stage: 'core' });
      if (next?.overallScore != null || next?.overallScore === 0) {
        toast('Temel analiziniz hazır.', 'success');
      } else if (!next && needsInitialHealthAnalysis(analysis)) {
        toast('Analiz başlatılamadı. Lütfen tekrar deneyin.', 'error');
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Analiz başlatılamadı.',
        'error',
      );
    } finally {
      setCoreStarting(false);
    }
  }, [runSync, toast, coreStarting, analysisLoading, analysis]);

  const handleRetake = useCallback(async () => {
    if (!lockState.canRetake) {
      toast('Yeniden çözme süresi henüz dolmadı.', 'error');
      return;
    }
    setRetakeSaving(true);
    try {
      const retakeAt = new Date().toISOString();
      const patch: Record<string, unknown> = { healthTest: { retakeAt } };
      if (analysis && !needsInitialHealthAnalysis(analysis)) {
        patch.healthAnalysis = { ...analysis, analysisStage: 'core' };
      }
      await updateProfile(patch, {
        toastMsg:
          'Cevaplar sıfırlandı. Genel Sağlık Testini baştan çözebilirsiniz.',
      });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Test sıfırlanamadı.',
        'error',
      );
    } finally {
      setRetakeSaving(false);
    }
  }, [lockState.canRetake, updateProfile, toast, analysis]);

  const scrollToFirstIncomplete = useCallback(() => {
    const target = firstIncompleteRef.current;
    const scroll = scrollRef.current;
    if (!target) return;

    const fallbackToDom = () => {
      const node = target as unknown as {
        scrollIntoView?: (opts: ScrollIntoViewOptions) => void;
      };
      if (typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const handle = findNodeHandle(target) as unknown as {
        scrollIntoView?: (opts: ScrollIntoViewOptions) => void;
      } | null;
      handle?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    };

    const relativeNative = getScrollContentHost(scroll);
    if (!scroll || !relativeNative || typeof target.measureLayout !== 'function') {
      fallbackToDom();
      return;
    }

    target.measureLayout(
      relativeNative as Parameters<View['measureLayout']>[0],
      (_x, y) => {
        scroll.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true });
      },
      fallbackToDom,
    );
  }, []);

  if (isFreeTrialExpired) {
    return <FreeTrialExpiredGate />;
  }

  const subtitle = needsConsent
    ? 'Analize başlamadan önce onayları işaretleyin'
    : !profileReady
      ? 'Boy, kilo ve yaş bilgilerinizi tamamlayın'
      : !coreComplete
        ? '1. aşama: Genel Sağlık Testini tamamlayın'
        : !analysisReady
          ? 'Test tamamlandı — skorlarınız için Analizi Başlat’a tıklayın'
          : lockState.canRetake && coreComplete
            ? '14 gün doldu — testi yeniden çözerek skorlarınızı güncelleyebilirsiniz'
            : lockState.fullLock
              ? `Cevaplarınız kilitli — ${lockState.daysLeft} gün sonra yeniden çözebilirsiniz`
              : analysisStage === 'detailed' || detailedComplete
                ? 'Sağlık analiziniz hazır!'
                : 'Daha detaylı analiz için kalan soruları da tamamlayın';

  return (
    <MeshBackground style={styles.root}>
      <FormKeyboardScroll
        ref={scrollRef}
        extraKeyboardSpace={48}
        bottomOffset={48}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}>
        <FadeIn>
          <Text style={styles.title}>Kişisel Sağlık Analizi</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </FadeIn>

        {needsConsent ? (
          <FadeIn delay={40}>
            <View style={styles.consentCard}>
              <Text style={styles.consentTitle}>Onaylar</Text>
              <CheckboxRow
                checked={localAck}
                label="Sağlık verilerimin analiz için işlenmesini kabul ediyorum"
                onChange={setLocalAck}
              />
              <CheckboxRow
                checked={localDisclaimer}
                label="Bu analizin tıbbi teşhis yerine geçmediğini anlıyorum"
                onChange={setLocalDisclaimer}
              />
              {showConsentErrors && (!localAck || !localDisclaimer) ? (
                <Text style={styles.err}>
                  Devam etmek için her iki onayı da işaretleyin.
                </Text>
              ) : null}
              <Button
                label="Onayları kaydet"
                loading={consentSaving}
                onPress={() => void handleConsentSubmit()}
              />
            </View>
          </FadeIn>
        ) : !profileReady ? (
          <HealthProfileGateForm
            onSave={handleProfileGateSave}
            profile={member as never}
            saving={profileGateSaving}
          />
        ) : !coreComplete ? (
          <FadeIn delay={40} style={styles.stageStack}>
            <View style={styles.stageCard}>
              <View style={styles.stageHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stageEyebrow}>1. Aşama</Text>
                  <Text style={styles.stageTitle}>Genel Sağlık Testi</Text>
                  <Text style={styles.stageSub}>
                    {coreProgress.total} soruluk temel test — tamamlandığında
                    skorlarınız hazırlanır. İsterseniz daha sonra kategori
                    sorularıyla analizi derinleştirebilirsiniz.
                  </Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentText}>{coreProgress.percent}%</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${coreProgress.percent}%` }]}
                />
              </View>
              <Text style={styles.barLabel}>
                {coreProgress.answered} / {coreProgress.total} soru
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(member)/health-test/core' as Href)}
              style={styles.coreCta}>
              <LinearGradient
                colors={[colors.brand[50], colors.sage[50]]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.coreCtaInner}>
                <View style={styles.coreCtaTop}>
                  <View style={styles.coreIcon}>
                    <Ionicons color={colors.brand[600]} name="heart" size={22} />
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      coreProgress.started
                        ? styles.statusAmber
                        : styles.statusBrand,
                    ]}>
                    <Text style={styles.statusPillText}>
                      {coreProgress.started ? 'Devam et' : 'Başla'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.coreCtaTitle}>Genel Sağlık Testi</Text>
                <Text style={styles.coreCtaSub}>
                  Genel sağlık, tıbbi geçmiş, beslenme, hareket ve yaşam
                  tarzından seçilmiş temel sorular. Kategori seçmeden tek akışta
                  ilerlersiniz.
                </Text>
                <Text style={styles.coreCtaLink}>
                  {coreProgress.started
                    ? 'Kaldığınız yerden devam'
                    : 'Teste başla'}{' '}
                  →
                </Text>
              </LinearGradient>
            </Pressable>
          </FadeIn>
        ) : (
          <FadeIn delay={40} style={styles.stageStack}>
            <View
              style={[
                styles.doneBanner,
                awaitingCoreAnalysis
                  ? styles.doneBannerAwait
                  : styles.doneBannerOk,
              ]}>
              <View style={styles.doneRow}>
                <Ionicons
                  color={
                    awaitingCoreAnalysis ? colors.brand[600] : colors.sage[600]
                  }
                  name="checkmark-circle"
                  size={18}
                />
                <Text style={styles.doneTitle}>
                  {analysisStage === 'detailed' || detailedComplete
                    ? 'Genel Sağlık Testi tamamlandı'
                    : 'İlk aşama tamamlandı'}
                </Text>
              </View>
              <Text style={styles.doneSub}>
                {analysisLoading
                  ? 'Analiziniz hazırlanıyor…'
                  : analysisReady
                    ? analysisStage === 'detailed' || detailedComplete
                      ? 'Sağlık analiziniz hazır!'
                      : 'Daha detaylı analiz için kalan soruları da tamamlayın.'
                    : 'Cevaplarınız kaydedildi. Skorlarınızı görmek için analizi başlatın.'}
              </Text>
              {awaitingCoreAnalysis ? (
                <Button
                  label={
                    analysisLoading || coreStarting
                      ? 'Analiz hazırlanıyor…'
                      : 'Analizi Başlat'
                  }
                  loading={analysisLoading || coreStarting}
                  onPress={() => void handleStartCoreAnalysis()}
                  style={{ marginTop: spacing.sm }}
                />
              ) : null}
              {showScrollToIncomplete ? (
                <Button
                  label="Kalan kategorilere git"
                  onPress={scrollToFirstIncomplete}
                  rightIcon="chevron-down"
                  size="md"
                  style={{ marginTop: spacing.sm }}
                  variant="secondary"
                />
              ) : null}
              {analysisError ? (
                <Text style={styles.err}>{analysisError}</Text>
              ) : null}
            </View>

            {analysisReady && analysis ? (
              <>
                <HealthScoreCard
                  analysis={analysis}
                  complete
                  error={analysisError}
                  history={history}
                  loading={analysisLoading}
                  lockState={lockState}
                  scoresOnly={isUnpaidMember}
                />
                <MemberHealthBrief
                  brief={memberBrief}
                  showPitch={isUnpaidMember}
                />
              </>
            ) : null}

            {lockState.locked ? (
              <View style={styles.lockCard}>
                <View style={styles.doneRow}>
                  <Ionicons
                    color={colors.warm[500]}
                    name="lock-closed"
                    size={16}
                  />
                  <Text style={styles.lockTitle}>Cevaplarınız kilitli</Text>
                </View>
                <Text style={styles.lockSub}>
                  {lockState.daysLeft} gün sonra
                  {lockedUntilLabel ? ` (${lockedUntilLabel})` : ''} testi yeniden
                  çözebilirsiniz. Bu süre boyunca skorlarınızı görebilirsiniz;
                  sorulara erişim kapalıdır.
                </Text>
              </View>
            ) : null}

            {awaitingRetake ? (
              <View style={styles.retakeCard}>
                <View style={styles.doneRow}>
                  <Ionicons
                    color={colors.brand[600]}
                    name="refresh"
                    size={16}
                  />
                  <Text style={styles.doneTitle}>
                    Yeniden çözme hakkınız açıldı
                  </Text>
                </View>
                <Text style={styles.doneSub}>
                  14 günlük süre doldu. Testi yeniden çözmek önceki cevaplarınızı
                  siler; soruları baştan tamamlamanız ve yeni analiz almanız
                  gerekir.
                </Text>
                {!confirmRetake ? (
                  <Button
                    label="Testi Yeniden Çöz"
                    loading={retakeSaving}
                    onPress={() => setConfirmRetake(true)}
                    style={{ marginTop: spacing.sm }}
                  />
                ) : (
                  <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                    <Text style={styles.retakeWarn}>
                      Önceki cevaplarınız silinecek. Emin misiniz?
                    </Text>
                    <Button
                      label="Evet, sıfırla ve baştan çöz"
                      loading={retakeSaving}
                      onPress={() => void handleRetake().then(() => setConfirmRetake(false))}
                    />
                    <Button
                      label="Vazgeç"
                      onPress={() => setConfirmRetake(false)}
                      variant="secondary"
                    />
                  </View>
                )}
              </View>
            ) : null}

            {showOptionalGrid && !detailedComplete ? (
              <View style={styles.stageCard}>
                <View style={styles.stageHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageEyebrow}>2. Aşama — Opsiyonel</Text>
                    <Text style={styles.stageTitle}>
                      {remainingSectionsDone} / {sections.length} kategori
                    </Text>
                    <Text style={styles.stageSub}>
                      Kalan soruları istediğiniz sırayla tamamlayın. Yarıda
                      bıraktığınız kategorilere dönebilirsiniz. Tümü bitince
                      detaylı analiz üretilir ve cevaplar 14 gün kilitlenir.
                    </Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{remainingPercent}%</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${remainingPercent}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {remainingAnswered} / {remainingTotal} kalan soru
                </Text>
              </View>
            ) : null}

            {detailedComplete && !awaitingRetake ? (
              <View style={styles.detailedDone}>
                <View style={styles.doneRow}>
                  <Ionicons
                    color={colors.sage[600]}
                    name="checkmark-circle"
                    size={16}
                  />
                  <Text style={styles.doneTitle}>
                    {analysisStage === 'detailed' || detailedComplete
                      ? 'Sağlık analiziniz hazır!'
                      : 'Tüm opsiyonel sorular tamamlandı'}
                  </Text>
                </View>
                <Text style={styles.doneSub}>
                  {analysisLoading
                    ? 'Detaylı analiz hazırlanıyor…'
                    : lockState.locked
                      ? 'Cevaplarınız kilitli. Süre dolunca testi yeniden çözebilirsiniz.'
                      : 'İstediğiniz zaman testi yeniden çözebilirsiniz.'}
                </Text>
              </View>
            ) : null}

            {showOptionalGrid
              ? sections.map(({ section, progress }) => {
                  const theme = CARD_THEME[section.id] || CARD_THEME.general;
                  const audience =
                    HEALTH_AUDIENCE_META[section.audience || 'shared'];
                  const iconName =
                    SECTION_ICON[section.icon || ''] || 'fitness-outline';
                  const sectionLocked = Boolean(
                    lockState.fullLock || awaitingRetake,
                  );
                  let statusLabel = 'Başla';
                  let statusStyle: { backgroundColor: string } =
                    styles.statusNeutral;
                  if (sectionLocked) {
                    statusLabel = 'Kilitli';
                    statusStyle = styles.statusAmber;
                  } else if (progress.complete) {
                    statusLabel = 'Tamamlandı';
                    statusStyle = styles.statusSage;
                  } else if (progress.started || progress.requiredAnswered > 0) {
                    statusLabel = 'Devam et';
                    statusStyle = styles.statusAmber;
                  }
                  const progressPercent = progress.complete
                    ? 100
                    : progress.percent;
                  const isFirstIncomplete =
                    section.id === firstIncompleteSectionId;

                  return (
                    <View
                      collapsable={false}
                      key={section.id}
                      ref={isFirstIncomplete ? firstIncompleteRef : undefined}
                      style={{ width: '100%' }}>
                    <Pressable
                      disabled={sectionLocked}
                      onPress={() => {
                        if (sectionLocked) return;
                        router.push(
                          `/(member)/health-test/${section.id}` as Href,
                        );
                      }}
                      style={[
                        styles.sectionCard,
                        {
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                          opacity: sectionLocked ? 0.7 : 1,
                        },
                      ]}>
                      <View style={styles.sectionTop}>
                        <View
                          style={[
                            styles.sectionIcon,
                            { backgroundColor: theme.iconBg },
                          ]}>
                          <Ionicons
                            color={theme.iconColor}
                            name={iconName}
                            size={20}
                          />
                        </View>
                        <View style={styles.audienceChip}>
                          <Text
                            style={[
                              styles.audienceText,
                              { color: audience.chipText },
                            ]}>
                            {audience.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      {section.subtitle ? (
                        <Text style={styles.sectionSub}>{section.subtitle}</Text>
                      ) : null}
                      <Text style={styles.optionalLabel}>Opsiyonel</Text>
                      <View style={styles.sectionProgressRow}>
                        <Text style={styles.barLabel}>
                          {progress.complete
                            ? `${progress.requiredTotal} / ${progress.requiredTotal} soru`
                            : `${progress.requiredAnswered} / ${progress.requiredTotal} soru`}
                        </Text>
                        <View style={[styles.statusPill, statusStyle]}>
                          <Text style={styles.statusPillText}>{statusLabel}</Text>
                        </View>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
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
                    </View>
                  );
                })
              : null}
          </FadeIn>
        )}
      </FormKeyboardScroll>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  stageStack: { gap: spacing.lg },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.cream[900],
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    opacity: 0.7,
    marginTop: 4,
  },
  consentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.sm,
  },
  consentTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  err: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
  },
  stageCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.sm,
  },
  stageHeader: { flexDirection: 'row', gap: spacing.md },
  stageEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.cream[800],
    opacity: 0.5,
  },
  stageTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
    marginTop: 2,
  },
  stageSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 4,
  },
  percentBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.brand[600],
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.brand[500],
  },
  barLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  coreCta: { borderRadius: radius.xl, overflow: 'hidden' },
  coreCtaInner: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  coreCtaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coreIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreCtaTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  coreCtaSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.cream[800],
    opacity: 0.65,
  },
  coreCtaLink: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[700],
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBrand: { backgroundColor: colors.brand[100] },
  statusAmber: { backgroundColor: colors.warm[100] },
  statusSage: { backgroundColor: colors.sage[100] },
  statusNeutral: { backgroundColor: colors.cream[100] },
  statusPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.cream[900],
  },
  doneBanner: {
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4,
  },
  doneBannerAwait: {
    borderWidth: 2,
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  doneBannerOk: {
    borderWidth: 1,
    borderColor: colors.sage[200],
    backgroundColor: colors.sage[50],
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  doneSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
    opacity: 0.75,
  },
  lockCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
    gap: 4,
  },
  lockTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  lockSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
    opacity: 0.85,
  },
  retakeCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    gap: 4,
  },
  retakeWarn: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.danger[600],
  },
  detailedDone: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage[200],
    backgroundColor: colors.sage[50],
    padding: spacing.md,
    gap: 4,
  },
  sectionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  audienceText: { fontFamily: fonts.sansBold, fontSize: 10 },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.cream[900],
  },
  sectionSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
    opacity: 0.6,
  },
  optionalLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.cream[800],
    opacity: 0.4,
  },
  sectionProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});
