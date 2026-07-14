/**
 * Paket erişim kapıları — web `memberPackages.js` (kalori / video).
 */
import type { MemberProfile } from '@/types/session';

const PHOTO_CALORIE_PLANS = new Set(['diyet', 'spor', 'vip', 'platinum', 'premium']);
const FULL_VIDEO_PLANS = new Set(['spor', 'vip', 'platinum', 'premium']);
const MANUAL_CALORIE_EXCLUDE = new Set(['free', 'doktor', 'kurucu']);

type PackageEntry = {
  planId?: string;
  status?: string;
  expiresAt?: string | null;
  packageConfig?: { billingType?: string };
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function isOneTimePlan(planId: string) {
  return planId === 'doktor';
}

function isPackageEntryActive(pkg: PackageEntry, now = today()) {
  if (!pkg || pkg.status !== 'active') return false;
  if (isOneTimePlan(pkg.planId || '') || pkg.packageConfig?.billingType === 'one_time') return true;
  if (!pkg.expiresAt) return true;
  return pkg.expiresAt >= now;
}

function migrateLegacyToPackages(member: MemberProfile | null | undefined): PackageEntry[] {
  const raw = member?.activePackages;
  if (Array.isArray(raw) && raw.length > 0) return raw as PackageEntry[];
  const membership = (member?.membership as string) || 'free';
  if (!membership || membership === 'free') return [];
  return [
    {
      id: `legacy-${member?.id}-${membership}`,
      planId: membership,
      status: 'active',
      expiresAt: (member?.premiumExpiresAt as string) || null,
    } as PackageEntry,
  ];
}

function activePlanIds(member: MemberProfile | null | undefined): string[] {
  const activePackages = migrateLegacyToPackages(member).filter((p) => isPackageEntryActive(p));
  const ids = activePackages.map((p) => p.planId).filter(Boolean) as string[];
  const membership = (member?.membership as string) || 'free';
  return ids.length ? ids : [membership];
}

export function memberHasPhotoCalorieAccess(member: MemberProfile | null | undefined) {
  return activePlanIds(member).some((id) => PHOTO_CALORIE_PLANS.has(id));
}

export function memberHasManualCalorieAccess(member: MemberProfile | null | undefined) {
  return activePlanIds(member).some((id) => !MANUAL_CALORIE_EXCLUDE.has(id));
}

export function memberHasFullVideoAccess(member: MemberProfile | null | undefined) {
  return activePlanIds(member).some((id) => FULL_VIDEO_PLANS.has(id));
}
