/**
 * Web parity: Adsız `src/hooks/useStaffHealthAnalysisRerun.js`
 * Personel/admin — HT/profil fingerprint stale (veya ilk analiz eksik) ise yeniden üretim.
 */
import { useCallback, useState } from 'react';

import { getCoreHealthTestKeySet } from '@/data/coreHealthTest';
import { isDetailedHealthTestComplete } from '@/data/healthTest';
import { isPaidMembership } from '@/data/membershipPlans';
import {
  appendHealthScoreHistory,
  isHealthAnalysisStale,
  needsInitialHealthAnalysis,
  resolveHealthScoreAnalysis,
  type HealthScoreAnalysis,
  type HealthScoreHistoryEntry,
} from '@/services/healthScoreAnalysis';

const UNCHANGED_MSG =
  'Sağlık testi veya profil bilgileri değişmedi; yeniden analiz yapılamaz';

type MemberLike = Record<string, unknown> & {
  id?: string;
  membership?: string | null;
  gender?: string | null;
  healthTest?: Record<string, unknown> | null;
  healthAnalysis?: HealthScoreAnalysis | null;
  healthScoreHistory?: HealthScoreHistoryEntry[] | null;
  packageConfig?: Record<string, unknown> | null;
};

export function useStaffHealthAnalysisRerun({
  member,
  packageConfig = null,
  patchMember,
}: {
  member: MemberLike | null | undefined;
  packageConfig?: Record<string, unknown> | null;
  patchMember: (
    memberId: string,
    patch: Record<string, unknown>,
  ) => Promise<unknown>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rerun = useCallback(async (): Promise<
    { ok: true; analysis: HealthScoreAnalysis } | { ok: false; error: string }
  > => {
    if (!member?.id || typeof patchMember !== 'function') {
      return { ok: false, error: 'Üye bulunamadı' };
    }

    if (!isPaidMembership(member.membership)) {
      const msg = 'Yeniden analiz yalnızca aktif ücretli üyelikte kullanılabilir';
      setError(msg);
      return { ok: false, error: msg };
    }

    const analysis = member.healthAnalysis;
    const canRerun =
      needsInitialHealthAnalysis(analysis) ||
      isHealthAnalysisStale(analysis, member);
    if (!canRerun) {
      setError(UNCHANGED_MSG);
      return { ok: false, error: UNCHANGED_MSG };
    }

    setLoading(true);
    setError(null);
    try {
      const gender = member.gender ? String(member.gender) : null;
      const detailed = Boolean(
        gender &&
          isDetailedHealthTestComplete(
            member.healthTest as Record<string, unknown>,
            gender,
            packageConfig || member.packageConfig,
            getCoreHealthTestKeySet(gender),
          ),
      );
      const next = await resolveHealthScoreAnalysis(
        {
          ...member,
          packageConfig: packageConfig || member.packageConfig,
        },
        {
          memberId: String(member.id),
          force: true,
          analysisStage: detailed ? 'detailed' : 'core',
        },
      );
      const healthScoreHistory = appendHealthScoreHistory(
        member.healthScoreHistory,
        next,
      );
      await patchMember(String(member.id), {
        healthAnalysis: next,
        healthScoreHistory,
      });
      return { ok: true, analysis: next };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Yeniden analiz başarısız';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [member, packageConfig, patchMember]);

  return { rerun, loading, error };
}
