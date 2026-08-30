/**
 * Web parity: Adsız `src/hooks/useHealthAnalysisSync.js`
 * Çekirdek test bitince 1. analiz (manuel); opsiyonel sorular bitince 2. (otomatik).
 *
 * Dashboard + hub aynı anda mount olabilir → modül düzeyinde tek sync kilidi.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useActions } from '@/context/ActionsContext';
import { useMember } from '@/context/DataContext';
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '@/data/coreHealthTest';
import { isDetailedHealthTestComplete } from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import {
  appendHealthScoreHistory,
  buildHealthAnalysisFingerprint,
  isHealthAnalysisStale,
  needsDetailedHealthAnalysis,
  needsInitialHealthAnalysis,
  resolveAnalysisStage,
  resolveHealthScoreAnalysis,
  resolveOptionalCompletedAtTimestamp,
  HealthAnalysisError,
  type AnalysisStage,
  type HealthScoreAnalysis,
  type HealthScoreHistoryEntry,
} from '@/services/healthScoreAnalysis';
import { resolveMemberEntitlements } from '@/utils/memberPackages';

/** Tüm hook instance'ları arasında paylaşılan in-flight promise */
let globalSyncPromise: Promise<HealthScoreAnalysis | null> | null = null;
let globalSyncKey = '';
/** Stage etiketleme / optionalCompletedAt — çift mount'ta tek yazma */
const stageLabelOnce = new Set<string>();
const optionalAtOnce = new Set<string>();

type SyncOpts = {
  force?: boolean;
  stage?: AnalysisStage | null;
};

export function useHealthAnalysisSync() {
  const member = useMember();
  const { updateProfile } = useActions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 423 kilit — aynı fingerprint için tekrar AI çağrısı yok */
  const lockedFingerprintRef = useRef('');

  const packageConfig = useMemo(() => {
    if (!member) return getDefaultPackageForPlan('free');
    const entitlements = resolveMemberEntitlements(member as never);
    return (
      (entitlements.packageConfig as Record<string, unknown>) ||
      getDefaultPackageForPlan(String(entitlements.membership || 'free'))
    );
  }, [member]);

  const analysis = (member?.healthAnalysis as HealthScoreAnalysis) || null;
  const history = (Array.isArray(member?.healthScoreHistory)
    ? member.healthScoreHistory
    : []) as HealthScoreHistoryEntry[];

  const userId = member?.id || null;
  const gender = String(member?.gender || '');
  const healthAck = Boolean(member?.healthAck);
  const disclaimer = Boolean(member?.disclaimer);
  const analysisFingerprint = analysis?.sourceFingerprint || '';
  const analysisStageRaw = analysis?.analysisStage || '';

  const healthTest = (member?.healthTest || {}) as Record<string, unknown>;

  const profileFingerprint = useMemo(() => {
    if (!userId || !member) return '';
    return buildHealthAnalysisFingerprint({
      healthTest: member.healthTest,
      birthDate: member.birthDate,
      weight: member.weight,
      height: member.height,
      goals: member.goals,
      fitnessLevel: member.fitnessLevel,
      nutritionPrefs: member.nutritionPrefs,
      age: member.age,
      gender: member.gender,
    });
  }, [userId, member]);

  const coreComplete = Boolean(
    userId &&
      healthAck &&
      disclaimer &&
      gender &&
      isCoreHealthTestComplete(healthTest, gender),
  );

  const coreKeys = useMemo(
    () => (gender ? getCoreHealthTestKeySet(gender) : new Set<string>()),
    [gender],
  );
  const detailedComplete = Boolean(
    coreComplete &&
      isDetailedHealthTestComplete(healthTest, gender, packageConfig, coreKeys),
  );

  const analysisStage = resolveAnalysisStage(analysis, detailedComplete);

  // Güncel değerleri ref'te tut — runSync identity'sini stabilize et
  const memberRef = useRef(member);
  const analysisRef = useRef(analysis);
  const packageConfigRef = useRef(packageConfig);
  const detailedCompleteRef = useRef(detailedComplete);
  const profileFingerprintRef = useRef(profileFingerprint);
  memberRef.current = member;
  analysisRef.current = analysis;
  packageConfigRef.current = packageConfig;
  detailedCompleteRef.current = detailedComplete;
  profileFingerprintRef.current = profileFingerprint;

  const runSync = useCallback(
    async ({ force = false, stage = null }: SyncOpts = {}) => {
      const currentMember = memberRef.current;
      const currentAnalysis = analysisRef.current;
      const currentDetailed = detailedCompleteRef.current;
      const currentPkg = packageConfigRef.current;
      const currentFp =
        profileFingerprintRef.current ||
        currentAnalysis?.sourceFingerprint ||
        'none';

      if (!currentMember?.id || !coreComplete) return null;

      const stale = isHealthAnalysisStale(currentAnalysis, {
        healthTest: currentMember.healthTest,
        birthDate: currentMember.birthDate,
        weight: currentMember.weight,
        height: currentMember.height,
        goals: currentMember.goals,
        fitnessLevel: currentMember.fitnessLevel,
        nutritionPrefs: currentMember.nutritionPrefs,
        age: currentMember.age,
        gender: currentMember.gender,
      });

      const targetStage: AnalysisStage =
        stage ||
        (needsDetailedHealthAnalysis(currentAnalysis, currentDetailed)
          ? 'detailed'
          : stale && currentDetailed
            ? 'detailed'
            : 'core');

      if (
        targetStage === 'core' &&
        !force &&
        !needsInitialHealthAnalysis(currentAnalysis)
      ) {
        return currentAnalysis;
      }
      if (
        targetStage === 'detailed' &&
        !force &&
        !needsDetailedHealthAnalysis(currentAnalysis, currentDetailed) &&
        !stale
      ) {
        return currentAnalysis;
      }
      if (targetStage === 'detailed' && !currentDetailed) return null;

      if (
        !force &&
        lockedFingerprintRef.current &&
        lockedFingerprintRef.current === currentFp
      ) {
        return currentAnalysis;
      }

      const syncKey = `${currentMember.id}:${targetStage}:${force ? 'f' : 'n'}:${currentFp}`;

      // Aynı istek zaten yürüyorsa bekle (çift mount / çift tık)
      if (globalSyncPromise && globalSyncKey === syncKey) {
        setLoading(true);
        try {
          return await globalSyncPromise;
        } finally {
          setLoading(false);
        }
      }

      const exec = async (): Promise<HealthScoreAnalysis | null> => {
        setLoading(true);
        setError(null);
        try {
          const next = await resolveHealthScoreAnalysis(
            {
              ...(currentMember as Record<string, unknown>),
              packageConfig: currentPkg,
            },
            {
              force: force === true,
              analysisStage: targetStage,
            },
          );

          const healthScoreHistory = appendHealthScoreHistory(
            currentMember.healthScoreHistory as HealthScoreHistoryEntry[],
            next,
          );
          await updateProfile(
            { healthAnalysis: next, healthScoreHistory },
            { toastMsg: '', skipAuthRefresh: true },
          );
          lockedFingerprintRef.current = '';
          return next;
        } catch (e) {
          if (
            e instanceof HealthAnalysisError &&
            e.code === 'health_analysis_locked'
          ) {
            lockedFingerprintRef.current = currentFp;
            setError(e.message || 'Sağlık testi kilitli');
            return null;
          }
          if (
            e instanceof HealthAnalysisError &&
            e.code === 'health_analysis_unchanged' &&
            targetStage === 'detailed' &&
            currentAnalysis &&
            !needsInitialHealthAnalysis(currentAnalysis)
          ) {
            const patched = {
              ...currentAnalysis,
              analysisStage: 'detailed' as const,
            };
            try {
              await updateProfile(
                { healthAnalysis: patched },
                { toastMsg: '', skipAuthRefresh: true },
              );
              return patched;
            } catch {
              /* fall through */
            }
          }
          const msg = e instanceof Error ? e.message : 'Skor hesaplanamadı';
          setError(msg);
          return null;
        } finally {
          setLoading(false);
          if (globalSyncKey === syncKey) {
            globalSyncPromise = null;
            globalSyncKey = '';
          }
        }
      };

      globalSyncKey = syncKey;
      globalSyncPromise = exec();
      return globalSyncPromise;
    },
    [coreComplete, updateProfile],
  );

  // Detaylı (2.) analiz opsiyonel sorular bitince otomatik.
  useEffect(() => {
    if (!coreComplete || !userId) return;
    if (needsInitialHealthAnalysis(analysis)) return;
    const stale = Boolean(
      (profileFingerprint &&
        analysisFingerprint &&
        profileFingerprint !== analysisFingerprint) ||
        (analysis && !analysisFingerprint),
    );
    if (
      lockedFingerprintRef.current &&
      lockedFingerprintRef.current ===
        (profileFingerprint || analysisFingerprint || 'none')
    ) {
      return undefined;
    }
    let cancelled = false;
    const kick = () => {
      // microtask yerine kısa delay — mount çiftlenmesinde tek tetik
      const t = setTimeout(() => {
        if (cancelled) return;
        void runSync({ stage: 'detailed' });
      }, 50);
      return () => clearTimeout(t);
    };
    if (needsDetailedHealthAnalysis(analysis, detailedComplete)) {
      const clear = kick();
      return () => {
        cancelled = true;
        clear?.();
      };
    }
    if (detailedComplete && stale) {
      const clear = kick();
      return () => {
        cancelled = true;
        clear?.();
      };
    }
    return undefined;
  }, [
    coreComplete,
    detailedComplete,
    userId,
    profileFingerprint,
    analysisFingerprint,
    analysisStageRaw,
    analysis?.overallScore,
    analysis?.sourceFingerprint,
    runSync,
  ]);

  // Eski kayıtlarda analysisStage yoksa bir kez etiketle
  useEffect(() => {
    if (!userId || !analysis || needsInitialHealthAnalysis(analysis)) return;
    if (analysis.analysisStage === 'core' || analysis.analysisStage === 'detailed') {
      return;
    }
    const inferred = resolveAnalysisStage(analysis, detailedComplete);
    if (!inferred) return;
    const onceKey = `${userId}:${inferred}:${analysis.overallScore ?? 'x'}`;
    if (stageLabelOnce.has(onceKey)) return;
    stageLabelOnce.add(onceKey);
    void updateProfile(
      { healthAnalysis: { ...analysis, analysisStage: inferred } },
      { toastMsg: '', skipAuthRefresh: true },
    );
  }, [userId, analysis, detailedComplete, updateProfile]);

  // Tüm opsiyoneller bitince optionalCompletedAt yaz
  useEffect(() => {
    if (!userId || !detailedComplete) return;
    const ht = member?.healthTest as Record<string, unknown> | undefined;
    if (!ht || typeof ht !== 'object') return;
    if (ht.optionalCompletedAt) return;
    const onceKey = `${userId}:optionalAt`;
    if (optionalAtOnce.has(onceKey)) return;
    optionalAtOnce.add(onceKey);
    const optionalCompletedAt = resolveOptionalCompletedAtTimestamp({
      existing: ht.optionalCompletedAt
        ? String(ht.optionalCompletedAt)
        : null,
      retakeAt: ht.retakeAt ? String(ht.retakeAt) : null,
      healthAnalysis: analysis,
    });
    void updateProfile(
      { healthTest: { ...ht, optionalCompletedAt } },
      { toastMsg: '', skipAuthRefresh: true },
    );
  }, [
    userId,
    detailedComplete,
    member?.healthTest,
    analysis,
    updateProfile,
  ]);

  // Retake sonrası once-set'leri temizle (yeni tur)
  useEffect(() => {
    if (!userId) return;
    if (healthTest.retakeAt && !healthTest.optionalCompletedAt) {
      optionalAtOnce.delete(`${userId}:optionalAt`);
    }
  }, [userId, healthTest.retakeAt, healthTest.optionalCompletedAt]);

  return {
    analysis,
    history,
    loading: loading || Boolean(globalSyncPromise),
    error,
    complete: coreComplete,
    coreComplete,
    detailedComplete,
    analysisStage,
    runSync,
  };
}
