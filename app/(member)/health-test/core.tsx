import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
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
  getCoreHealthTestQuestions,
  getCoreHealthTestResumeIndex,
  isCoreHealthTestComplete,
  isCoreQuestionAnswered,
} from '@/data/coreHealthTest';
import { EMPTY_HEALTH_TEST } from '@/data/healthTest';
import {
  getHealthTestLockState,
  needsInitialHealthAnalysis,
} from '@/services/healthScoreAnalysis';
import { isDetailedHealthTestComplete } from '@/data/healthTest';
import { getCoreHealthTestKeySet } from '@/data/coreHealthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import { hasCompleteAnalysisProfile } from '@/utils/healthProfile';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { colors, fonts, spacing } from '@/theme';

/**
 * Web parity: /health-test/core — 1. aşama Genel Sağlık Testi
 */
export default function HealthTestCoreScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { isFreeTrialExpired } = useData();
  const { updateHealthTestPartial } = useActions();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const packageConfig = useMemo(() => {
    if (!member) return getDefaultPackageForPlan('free');
    const entitlements = resolveMemberEntitlements(member as never);
    return (
      (entitlements.packageConfig as Record<string, unknown>) ||
      getDefaultPackageForPlan(String(entitlements.membership || 'free'))
    );
  }, [member]);

  const gender = member?.gender ? String(member.gender) : null;
  const questions = useMemo(
    () => getCoreHealthTestQuestions(gender),
    [gender],
  );

  const initial = useMemo(
    () => ({
      ...EMPTY_HEALTH_TEST,
      ...((member?.healthTest as Record<string, unknown>) || {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [healthTest, setHealthTest] = useState(initial);
  const [questionIndex, setQuestionIndex] = useState(0);
  const healthTestRef = useRef(healthTest);
  const lastPersistedRef = useRef(JSON.stringify(initial));

  useEffect(() => {
    healthTestRef.current = healthTest;
  }, [healthTest]);

  const analysis = member?.healthAnalysis as
    | import('@/services/healthScoreAnalysis').HealthScoreAnalysis
    | undefined;
  const coreKeys = useMemo(() => getCoreHealthTestKeySet(gender), [gender]);
  const detailedComplete = Boolean(
    gender &&
      isCoreHealthTestComplete(member?.healthTest as never, gender) &&
      isDetailedHealthTestComplete(
        (member?.healthTest as Record<string, unknown>) || {},
        gender,
        packageConfig,
        coreKeys,
      ),
  );
  const lockState = getHealthTestLockState({
    healthAnalysis: analysis || null,
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
  const coreAlreadyDone = Boolean(
    gender && isCoreHealthTestComplete(member?.healthTest as never, gender),
  );
  const awaitingRetake = Boolean(
    lockState.canRetake && coreAlreadyDone && analysisReady,
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
    if (coreAlreadyDone) {
      router.replace('/(member)/health-test' as Href);
    }
  }, [
    member,
    lockState.fullLock,
    awaitingRetake,
    coreAlreadyDone,
  ]);

  useEffect(() => {
    const resume = getCoreHealthTestResumeIndex(initial, gender);
    setHealthTest(initial);
    setQuestionIndex(resume);
    setShowErrors(false);
    lastPersistedRef.current = JSON.stringify(initial);
  }, [initial, gender]);

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
    if (!isCoreQuestionAnswered(currentQuestion, healthTest)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (!lastQuestion) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    if (!isCoreHealthTestComplete(healthTest, gender)) {
      setShowErrors(true);
      toast('Lütfen tüm soruları eksiksiz cevaplayın.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateHealthTestPartial(healthTest);
      lastPersistedRef.current = JSON.stringify(healthTest);
      toast(
        'Genel Sağlık Testi tamamlandı. Analizi başlatmak için butona tıklayın.',
        'success',
      );
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

  if (!currentQuestion) {
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
          <Text style={styles.title}>Genel Sağlık Testi</Text>
          <Text style={styles.subtitle}>
            Temel sorular — tamamlandığında skorlarınız hesaplanır
          </Text>
        </FadeIn>

        <FadeIn delay={40} key={`core-${currentQuestion.key}`}>
          <HealthTestStep
            healthTest={healthTest}
            question={{ ...currentQuestion, required: true }}
            questionIndex={questionIndex}
            sectionTitle="Genel Sağlık Testi"
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
            style={[styles.backBtn, questionIndex === 0 && { opacity: 0.3 }]}>
            <Text style={styles.backBtnText}>Geri</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Button
              label={
                lastQuestion
                  ? saving
                    ? 'Kaydediliyor…'
                    : 'Testi Bitir'
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
