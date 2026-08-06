/**
 * Web parity: Adsız `src/hooks/useHealthAnalysisSync.js`
 * Analiz tamamlanınca YeniForm Sağlık Skoru üretir/kaydeder.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useActions } from '@/context/ActionsContext';
import { useMember } from '@/context/DataContext';
import { isHealthTestComplete } from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import {
  appendHealthScoreHistory,
  needsHealthScoreRefresh,
  resolveHealthScoreAnalysis,
  type HealthScoreAnalysis,
  type HealthScoreHistoryEntry,
} from '@/services/healthScoreAnalysis';
import { resolveMemberEntitlements } from '@/utils/memberPackages';

export function useHealthAnalysisSync() {
  const member = useMember();
  const { updateProfile } = useActions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const lastKeyRef = useRef('');

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

  const healthTest = (member?.healthTest || {}) as Record<string, unknown>;
  const gender = String(member?.gender || '');

  const complete = Boolean(
    member?.id &&
      member?.healthAck &&
      member?.disclaimer &&
      isHealthTestComplete(healthTest, gender, packageConfig),
  );

  const runSync = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!member?.id || !complete) return null;
      if (runningRef.current) return analysis;
      if (!force && !needsHealthScoreRefresh(analysis, healthTest)) {
        return analysis;
      }

      const key = `${member.id}:${Object.keys(healthTest).length}`;
      if (!force && lastKeyRef.current === key && analysis?.overallScore != null) {
        return analysis;
      }

      runningRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const next = await resolveHealthScoreAnalysis({
          ...(member as Record<string, unknown>),
          packageConfig,
        });
        const healthScoreHistory = appendHealthScoreHistory(
          member.healthScoreHistory as HealthScoreHistoryEntry[],
          next,
        );
        await updateProfile(
          { healthAnalysis: next, healthScoreHistory },
          { toastMsg: '' },
        );
        lastKeyRef.current = key;
        return next;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Skor hesaplanamadı';
        setError(msg);
        return null;
      } finally {
        runningRef.current = false;
        setLoading(false);
      }
    },
    [member, packageConfig, complete, analysis, healthTest, updateProfile],
  );

  useEffect(() => {
    if (!complete) return;
    if (!needsHealthScoreRefresh(analysis, healthTest)) return;
    void runSync();
  }, [complete, analysis, healthTest, runSync]);

  return {
    analysis,
    history,
    loading,
    error,
    complete,
  };
}
