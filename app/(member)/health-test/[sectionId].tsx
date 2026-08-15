import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HealthTestStep } from '@/components/health-test/HealthTestStep';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '@/data/coreHealthTest';
import {
  EMPTY_HEALTH_TEST,
  getApplicableSections,
  getRemainingSectionQuestions,
  getRemainingSectionResumeState,
  isDetailedHealthTestComplete,
  isQuestionFullyAnswered,
  isSectionStrictlyComplete,
} from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import { syncMemberHealthAssets } from '@/services/memberHealthSync';
import {
  getHealthTestLockState,
  needsInitialHealthAnalysis,
  type HealthScoreAnalysis,
} from '@/services/healthScoreAnalysis';
import { hasCompleteAnalysisProfile } from '@/utils/healthProfile';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { colors, fonts, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/member/health-test-section.md
 * Web parity: HealthTestSectionPage mode=remaining (2. aşama)
 */
export default function HealthTestSectionScreen() {
  const insets = useSafeAreaInsets();
  const { sectionId: rawId } = useLocalSearchParams<{ sectionId: string }>();
  const sectionId = String(rawId || '');
  const member = useMember();
  const { myPrograms, refreshData, isFreeTrialExpired } = useData();
  const { updateHealthTestPartial } = useActions();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // core route → dedicated screen
  useEffect(() => {
    if (sectionId === 'core') {
      router.replace('/(member)/health-test/core' as Href);
    }
  }, [sectionId]);

  const { packageConfig } = useMemo(() => {
    if (!member) return { packageConfig: getDefaultPackageForPlan('free') };
    return resolveMemberEntitlements(member as never);
  }, [member]);

  const gender = member?.gender ? String(member.gender) : null;
  const coreKeys = useMemo(() => getCoreHealthTestKeySet(gender), [gender]);
  const applicable = useMemo(
    () => getApplicableSections(gender, packageConfig),
    [gender, packageConfig],
  );
  const section = applicable.find((s) => s.id === sectionId) || null;
  const valid = Boolean(section) && sectionId !== 'core';
  const questions = useMemo(
    () => getRemainingSectionQuestions(sectionId, gender, coreKeys),
    [sectionId, gender, coreKeys],
  );

  const initial = useMemo(
    () => ({
      ...EMPTY_HEALTH_TEST,
      ...((member?.healthTest as Record<string, unknown>) || {}),
    }),
    [sectionId, member?.healthTest],
  );

  const [healthTest, setHealthTest] = useState<Record<string, unknown>>(initial);
  const [questionIndex, setQuestionIndex] = useState(0);
  const healthTestRef = useRef(healthTest);
  const lastPersistedRef = useRef(JSON.stringify(initial));

  useEffect(() => {
    healthTestRef.current = healthTest;
  }, [healthTest]);

  const analysis = (member?.healthAnalysis as HealthScoreAnalysis) || null;
  const coreComplete = Boolean(
    gender && isCoreHealthTestComplete(member?.healthTest as never, gender),
  );
  const detailedComplete = Boolean(
    coreComplete &&
      isDetailedHealthTestComplete(
        (member?.healthTest as Record<string, unknown>) || {},
        gender,
        packageConfig,
        coreKeys,
      ),
  );
  const lockState = getHealthTestLockState({
    healthAnalysis: analysis,
    detailedComplete,
    optionalCompletedAt: (member?.healthTest as Record<string, unknown>)
      ?.optionalCompletedAt
      ? String(
          (member?.healthTest as Record<string, unknown>).optionalCompletedAt,
        )
      : null,
  });
  const analysisReady = Boolean(
    analysis && !needsInitialHealthAnalysis(analysis),
  );
  const awaitingRetake = Boolean(
    lockState.canRetake && coreComplete && analysisReady,
  );

  useEffect(() => {
    if (!member?.healthAck || !member?.disclaimer) {
      router.replace('/(member)/health-test' as Href);
      return;
    }
    if (!hasCompleteAnalysisProfile(member as never)) {
      router.replace('/(member)/health-test' as Href);
      return;
    }
    if (lockState.fullLock || awaitingRetake) {
      router.replace('/(member)/health-test' as Href);
      return;
    }
    if (!coreComplete) {
      router.replace('/(member)/health-test' as Href);
      return;
    }
    if (!valid) {
      router.replace('/(member)/health-test' as Href);
    }
  }, [
    valid,
    member,
    lockState.fullLock,
    awaitingRetake,
    coreComplete,
  ]);

  useEffect(() => {
    if (!section) return;
    const resume = getRemainingSectionResumeState(section, initial, coreKeys);
    setHealthTest(initial);
    setQuestionIndex(resume.questionIndex);
    setShowErrors(false);
    lastPersistedRef.current = JSON.stringify(initial);
  }, [sectionId, section, initial, coreKeys]);

  const persistProgress = useCallback(async () => {
    const snapshot = healthTestRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    await updateHealthTestPartial(snapshot);
  }, [updateHealthTestPartial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void persistProgress();
    }, 700);
    return () => clearTimeout(timer);
  }, [healthTest, persistProgress]);

  useEffect(() => {
    return () => {
      void persistProgress();
    };
  }, [persistProgress]);

  const updateHealthTest = useCallback((patch: Record<string, unknown>) => {
    setHealthTest((prev) => ({ ...prev, ...patch }));
  }, []);

  const currentQuestion = questions[questionIndex];
  const lastQuestion = questionIndex >= questions.length - 1;

  const goNext = async () => {
    if (!currentQuestion) return;
    // remaining: required:false — boş OK; yarım bağımlılık engeller
    if (!isQuestionFullyAnswered(currentQuestion, healthTest)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (!lastQuestion) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    const allSectionDone = questions.every((q) =>
      isQuestionFullyAnswered(q, healthTest),
    );
    if (!allSectionDone) {
      setShowErrors(true);
      toast(
        'Lütfen açık bıraktığınız açıklama alanlarını tamamlayın.',
        'error',
      );
      return;
    }

    if (!section) {
      toast('Bölüm bulunamadı.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateHealthTestPartial(healthTest);
      lastPersistedRef.current = JSON.stringify(healthTest);

      const allDetailed = isDetailedHealthTestComplete(
        healthTest,
        gender,
        packageConfig,
        coreKeys,
      );
      const sectionDone = isSectionStrictlyComplete(section, healthTest, {
        coreKeys,
        exemptOptionalText: true,
      });

      if (allDetailed) {
        toast(
          `${section.title} kaydedildi. Detaylı analiz hazırlanıyor…`,
          'success',
        );

        const membership = String(member?.membership || 'free');
        if ((membership === 'free' || membership === 'eko') && member) {
          const sync = await syncMemberHealthAssets(
            { ...member, healthTest } as Record<string, unknown>,
            { programs: myPrograms as Record<string, unknown>[] },
          );
          await refreshData();
          if (sync.synced) {
            const msg =
              membership === 'eko'
                ? 'Eko paket antrenman (30 gün) ve beslenme (15 gün) programınız hazır.'
                : 'Deneme süreniz boyunca geçerli antrenman ve beslenme programınız hazır.';
            toast(msg, 'success');
            router.replace('/(member)/programs' as Href);
            return;
          }
          if (sync.skipped === 'already_exists') {
            toast('Programınız zaten mevcut.', 'info');
          } else if (sync.error) {
            toast(sync.error, 'warning');
          }
        }
      } else if (sectionDone) {
        toast(`${section.title} tamamlandı.`, 'success');
      } else {
        toast(
          `${section.title} kaydedildi. İstediğiniz zaman devam edebilirsiniz.`,
          'success',
        );
      }

      router.replace('/(member)/health-test' as Href);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setShowErrors(false);
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
    else router.replace('/(member)/health-test' as Href);
  };

  if (isFreeTrialExpired) {
    return <FreeTrialExpiredGate />;
  }

  if (!valid || !currentQuestion) {
    return <MeshBackground style={styles.root} />;
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Pressable
            accessibilityLabel="Sağlık testine dön"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.replace('/(member)/health-test' as Href)}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Sağlık testine dön</Text>
          </Pressable>
          <Text style={styles.title}>{section?.title}</Text>
          {section?.subtitle ? (
            <Text style={styles.subtitle}>{section.subtitle} (opsiyonel)</Text>
          ) : (
            <Text style={styles.subtitle}>Opsiyonel sorular</Text>
          )}
        </FadeIn>

        <FadeIn delay={40} key={`${sectionId}-${currentQuestion.key}`}>
          <HealthTestStep
            healthTest={healthTest}
            question={currentQuestion}
            questionIndex={questionIndex}
            sectionTitle={section?.title}
            showErrors={showErrors}
            totalQuestions={questions.length}
            updateHealthTest={updateHealthTest}
            userId={String(member?.id || '')}
          />
        </FadeIn>

        <View style={styles.actions}>
          <Pressable
            disabled={questionIndex === 0}
            onPress={goBack}
            style={[
              styles.backBtn,
              questionIndex === 0 && { opacity: 0.3 },
            ]}>
            <Text style={styles.backBtnText}>Geri</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Button
              label={
                lastQuestion
                  ? saving
                    ? 'Kaydediliyor…'
                    : 'Kaydet'
                  : 'İleri'
              }
              loading={saving}
              onPress={() => void goNext()}
              rightIcon={lastQuestion ? 'checkmark' : 'arrow-forward'}
            />
          </View>
        </View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.brand[600],
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 2,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  backBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
  },
});
