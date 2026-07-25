import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HealthTestStep } from '@/components/health-test/HealthTestStep';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  EMPTY_HEALTH_TEST,
  getApplicableSections,
  getSectionQuestions,
  getSectionResumeState,
  hasHealthTestProgress,
  isHealthTestComplete,
  isQuestionAnswered,
  isQuestionFullyAnswered,
  isSectionComplete,
} from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import { syncMemberHealthAssets } from '@/services/memberHealthSync';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { colors, fonts, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/member/health-test-section.md
 * Web parity: HealthTestSectionPage + HealthTestFlow (flat healthTest)
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

  const { packageConfig } = useMemo(() => {
    if (!member) return { packageConfig: getDefaultPackageForPlan('free') };
    return resolveMemberEntitlements(member as never);
  }, [member]);

  const gender = member?.gender ? String(member.gender) : null;
  const applicable = useMemo(
    () => getApplicableSections(gender, packageConfig),
    [gender, packageConfig],
  );
  const section = applicable.find((s) => s.id === sectionId) || null;
  const valid = Boolean(section);
  const questions = useMemo(
    () => getSectionQuestions(sectionId, gender, packageConfig),
    [sectionId, gender, packageConfig],
  );

  const initial = useMemo(
    () => ({
      ...EMPTY_HEALTH_TEST,
      ...((member?.healthTest as Record<string, unknown>) || {}),
    }),
    // only seed once per section open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionId],
  );

  const [healthTest, setHealthTest] = useState<Record<string, unknown>>(initial);
  const [questionIndex, setQuestionIndex] = useState(0);
  const healthTestRef = useRef(healthTest);
  const lastPersistedRef = useRef(JSON.stringify(initial));

  useEffect(() => {
    healthTestRef.current = healthTest;
  }, [healthTest]);

  useEffect(() => {
    if (!member?.healthAck || !member?.disclaimer) {
      router.replace('/(member)/health-test' as Href);
      return;
    }
    if (!valid) {
      router.replace('/(member)/health-test' as Href);
    }
  }, [valid, member?.healthAck, member?.disclaimer]);

  useEffect(() => {
    if (!section) return;
    const resume = getSectionResumeState(section, initial);
    setHealthTest(initial);
    setQuestionIndex(resume.questionIndex);
    setShowErrors(false);
    lastPersistedRef.current = JSON.stringify(initial);
  }, [sectionId, section, initial]);

  const persistProgress = useCallback(async () => {
    const snapshot = healthTestRef.current;
    if (!hasHealthTestProgress(snapshot, gender, packageConfig)) return;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    await updateHealthTestPartial(snapshot);
  }, [gender, packageConfig, updateHealthTestPartial]);

  // Debounced autosave — web 700ms parity
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
    if (!isQuestionAnswered(currentQuestion, healthTest)) {
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
    if (!allSectionDone || !section || !isSectionComplete(section, healthTest)) {
      setShowErrors(true);
      toast(
        'Lütfen tüm soruları eksiksiz cevaplayın (açıklama alanları dahil).',
        'error',
      );
      return;
    }

    setSaving(true);
    try {
      await updateHealthTestPartial(healthTest);
      lastPersistedRef.current = JSON.stringify(healthTest);

      const allSectionsDone = isHealthTestComplete(
        healthTest,
        gender,
        packageConfig,
      );
      if (allSectionsDone) {
        toast(
          `${section.title} tamamlandı. Tüm testler kaydedildi.`,
          'success',
        );

        const membership = String(member?.membership || 'free');
        if (
          (membership === 'free' || membership === 'eko') &&
          member
        ) {
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
          } else if (sync.skipped === 'window_closed') {
            toast(
              'Ücretsiz deneme süreniz dolmuş; otomatik program oluşturulamadı.',
              'error',
            );
          } else if (sync.skipped === 'package_expired') {
            toast(
              'Eko paket süreniz dolmuş; otomatik program oluşturulamadı.',
              'error',
            );
          } else if (sync.error) {
            toast(sync.error, 'warning');
          }
        }

        router.replace('/(member)/health-test' as Href);
      } else {
        toast(`${section.title} testi kaydedildi.`, 'success');
        router.replace('/(member)/health-test' as Href);
      }
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
            accessibilityLabel="Tüm testlere dön"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.replace('/(member)/health-test' as Href)}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Tüm testlere dön</Text>
          </Pressable>
          <Text style={styles.title}>{section?.title}</Text>
          {section?.subtitle ? (
            <Text style={styles.subtitle}>{section.subtitle}</Text>
          ) : null}
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
