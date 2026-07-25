/**
 * Web parity: Adsız `services/memberHealthSync` + `aiBasicPrograms`
 * → POST /api/ai-nutrition-tips { task: 'basic-programs' | 'eko-programs' }
 */
import { isUiOnly } from '@/config/runtime';
import { postJson } from '@/services/api';
import { allApplicableComplete, isHealthTestComplete } from '@/data/healthTest';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';
import { resolveMemberEntitlements } from '@/utils/memberPackages';

type SyncResult = {
  synced: boolean;
  reason?: string;
  skipped?: string;
  error?: string | null;
  ok?: boolean;
};

function profileReadyForAnalysis(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return false;
  const { packageConfig } = resolveMemberEntitlements(profile as never);
  const gender = profile.gender ? String(profile.gender) : null;
  return isHealthTestComplete(
    (profile.healthTest as Record<string, unknown>) || {},
    gender,
    packageConfig || getDefaultPackageForPlan(String(profile.membership || 'free')),
  );
}

function memberHasAiSource(programs: Record<string, unknown>[], source: string) {
  return (programs || []).some((p) => p.source === source);
}

async function callAiPrograms(task: 'basic-programs' | 'eko-programs'): Promise<SyncResult> {
  if (isUiOnly()) {
    return { synced: false, reason: 'ui_only', skipped: 'ui_only', ok: true };
  }
  const { ok, json } = await postJson<{
    ok?: boolean;
    synced?: boolean;
    skipped?: string;
    error?: string;
    programs?: unknown[];
  }>('/api/ai-nutrition-tips', { task });

  if (json?.skipped) {
    return {
      ok: true,
      synced: false,
      skipped: json.skipped,
      reason: json.skipped,
      error: json.error || null,
    };
  }
  if (!ok || json?.ok === false) {
    return {
      ok: false,
      synced: false,
      error: String(json?.error || 'AI program üretilemedi'),
    };
  }
  return {
    ok: true,
    synced: Boolean(json?.synced),
    reason: json?.synced ? 'synced' : 'no_change',
  };
}

/**
 * Basic veya Eko üye için uygun AI program üretimini tetikler.
 */
export async function syncMemberHealthAssets(
  profile: Record<string, unknown> | null | undefined,
  opts: { programs?: Record<string, unknown>[] } = {},
): Promise<SyncResult> {
  if (!profile?.id) return { synced: false, reason: 'no_profile' };
  if (!profileReadyForAnalysis(profile)) {
    return { synced: false, reason: 'health_test_incomplete' };
  }

  const membership = String(profile.membership || 'free');
  const programs = opts.programs || [];

  if (membership === 'free') {
    if (memberHasAiSource(programs, 'ai_basic')) {
      return { synced: false, reason: 'already_exists', skipped: 'already_exists', ok: true };
    }
    return callAiPrograms('basic-programs');
  }

  if (membership === 'eko') {
    if (memberHasAiSource(programs, 'ai_eko')) {
      return { synced: false, reason: 'already_exists', skipped: 'already_exists', ok: true };
    }
    return callAiPrograms('eko-programs');
  }

  return { synced: false, reason: 'not_eligible', ok: true };
}
