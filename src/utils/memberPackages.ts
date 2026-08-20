// @ts-nocheck
import {
  DEFAULT_PACKAGE,
  getDefaultPackageForPlan,
  getPlanFromCatalog,
  isPaidMembership,
  PLAN_IDS,
  sanitizeStaffForPackage,
} from '@/data/membershipPlans'

const todayIso = () => new Date().toISOString().split('T')[0]

function getDurationMonths(packageConfig: Record<string, unknown> = {}) {
  if (packageConfig.durationMonths) return Number(packageConfig.durationMonths)
  if (packageConfig.durationWeeks) {
    return Math.max(1, Math.round(Number(packageConfig.durationWeeks) / 4))
  }
  return 1
}

function computePremiumExpiresAt(startDate: string, durationMonths: number) {
  const start = startDate || todayIso()
  const d = new Date(start)
  d.setMonth(d.getMonth() + (Number(durationMonths) || 1))
  return d.toISOString().split('T')[0]
}

const today = () => new Date().toISOString().split('T')[0]

export const ONE_TIME_PLANS = new Set(['doktor'])

export function isOneTimePlan(planId) {
  if (!planId) return false
  if (ONE_TIME_PLANS.has(planId)) return true
  const plan = getPlanFromCatalog(planId)
  return plan?.billingType === 'one_time' || plan?.period === 'Tek Seferlik'
}

export function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') return true
  if (!pkg.expiresAt) return true
  return pkg.expiresAt >= now
}

/** Eski tekil üyelik → activePackages dizisine taşır */
export function migrateLegacyToPackages(member) {
  // Explicit array (including []) is authoritative — do not revive from membership
  if (Array.isArray(member?.activePackages)) {
    return member.activePackages
  }
  if (!member || !isPaidMembership(member.membership)) return []
  const planId = member.membership
  const packageConfig = member.packageConfig || getDefaultPackageForPlan(planId)
  return [{
    id: `legacy-${member.id}-${planId}`,
    planId,
    packageConfig,
    startedAt: member.premiumStartedAt || member.joinedAt || today(),
    expiresAt: isOneTimePlan(planId) ? null : (member.premiumExpiresAt || null),
    status: 'active',
    purchasedAt: member.premiumStartedAt || member.joinedAt || today(),
  }]
}

/** videoCallSession JOIN_WINDOW_DEFAULTS.doctor.after ile aynı */
const DOCTOR_JOIN_AFTER_MINUTES = 30

const DOCTOR_QUOTA_STATUSES = new Set([
  'pending', 'scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending', 'completed', 'no_show',
])
const DOCTOR_CONSUME_STATUSES = new Set(['completed', 'no_show'])

function doctorSessionWindowEnd(session) {
  const start = new Date(session?.date || session?.start || 0)
  if (Number.isNaN(start.getTime())) return null
  const durationMin = Number(session?.duration) || 30
  return new Date(start.getTime() + (durationMin + DOCTOR_JOIN_AFTER_MINUTES) * 60_000)
}

/** Onaylı görüşme: katılma penceresi kapandı, completed değil. pending asla no_show olmaz. */
export function isDoctorApprovedNoShow(session, now = new Date()) {
  const status = session?.status || 'scheduled'
  if (status !== 'scheduled' && status !== 'rescheduled') return false
  const windowEnd = doctorSessionWindowEnd(session)
  return Boolean(windowEnd && now > windowEnd)
}

export function applyDoctorSessionNoShows(sessions = [], now = new Date()) {
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    if (!isDoctorApprovedNoShow(s, now)) return s
    if (s.status === 'no_show') return s
    return {
      ...s,
      status: 'no_show',
      noShowAt: s.noShowAt || now.toISOString(),
    }
  })
}

/** Yeni randevu kotası — pending dahil yer tutar; red/iptal sayılmaz */
export function countUsedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_QUOTA_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
}

/** Tek seferlik paket tüketimi — yalnız completed + no_show */
export function countConsumedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_CONSUME_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
}

export function mergePackageConfigs(packages = [], member = null) {
  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = { ...DEFAULT_PACKAGE, addOns: [] }

  active.forEach((pkg) => {
    const c = pkg.packageConfig || {}
    merged.coachMeetingsPerMonth = Math.max(
      merged.coachMeetingsPerMonth,
      Number(c.coachMeetingsPerMonth) || 0
    )
    merged.dietitianMeetingsPerMonth = Math.max(
      merged.dietitianMeetingsPerMonth,
      Number(c.dietitianMeetingsPerMonth) || 0
    )
    merged.doctorMeetingsPerMonth = Math.max(
      merged.doctorMeetingsPerMonth,
      Number(c.doctorMeetingsPerMonth) || 0
    )
    merged.coachMeetingsPerWeek = Math.max(
      merged.coachMeetingsPerWeek,
      Number(c.coachMeetingsPerWeek) || 0
    )
    merged.doctorSessionsTotal = (Number(merged.doctorSessionsTotal) || 0)
      + (Number(c.doctorSessionsTotal) || 0)
    if (c.billingType === 'one_time') merged.billingType = 'one_time'
    merged.durationMonths = Math.max(merged.durationMonths || 0, getDurationMonths(c))
  })

  const usedDoctor = member ? countUsedDoctorSessions(member) : 0
  if (merged.doctorSessionsTotal > 0) {
    merged.doctorSessionsRemaining = Math.max(0, merged.doctorSessionsTotal - usedDoctor)
  }

  return merged
}

const PLAN_RANK = Object.fromEntries(PLAN_IDS.map((id, i) => [id, i]))

/** Geriye dönük plan id → sıra (resolvePrimaryMembership) */
export const LEGACY_PLAN_RANK = {
  gumus: 1,
  altin: 6,
  kurucu: 6,
  platinum: 7,
  premium: 7,
}

export function planRank(planId) {
  if (PLAN_RANK[planId] != null) return PLAN_RANK[planId]
  return LEGACY_PLAN_RANK[planId] ?? 0
}

/** Görüntüleme için birincil plan (en yüksek abonelik; yalnız doktor varsa doktor) */
export function resolvePrimaryMembership(activePackages = [], fallback = 'free') {
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  if (!active.length) return fallback === 'free' ? 'free' : fallback

  const subs = active.filter((p) => !isOneTimePlan(p.planId))
  const pool = subs.length ? subs : active
  return pool.reduce((best, p) => {
    const rank = planRank(p.planId)
    const bestRank = planRank(best)
    return rank >= bestRank ? p.planId : best
  }, pool[0].planId)
}

export function isOneTimePackage(pkg) {
  if (!pkg) return false
  return isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time'
}

export function createPackageEntry(planId, packageConfig, meta = {}) {
  const startedAt = meta.startedAt || today()
  const oneTime = isOneTimePlan(planId) || packageConfig?.billingType === 'one_time'
  const provider = ['stripe', 'revenuecat', 'admin'].includes(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'
  const entry = {
    id: meta.id || `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    planId,
    packageConfig,
    startedAt,
    expiresAt: oneTime
      ? null
      : computePremiumExpiresAt(startedAt, getDurationMonths(packageConfig)),
    status: 'active',
    purchasedAt: meta.purchasedAt || new Date().toISOString(),
    price: meta.price || 0,
    provider,
  }
  const sid = String(meta.stripeSubscriptionId || '').trim()
  if (sid) entry.stripeSubscriptionId = sid
  if (meta.cancelAtPeriodEnd != null) entry.cancelAtPeriodEnd = Boolean(meta.cancelAtPeriodEnd)
  const periodEnd = String(meta.currentPeriodEnd || '').trim()
  if (periodEnd) entry.currentPeriodEnd = periodEnd
  return entry
}

export function addMemberPackage(activePackages = [], planId, packageConfig, meta = {}) {
  return [...(activePackages || []), createPackageEntry(planId, packageConfig, meta)]
}

export function memberHasActivePaidPackages(member) {
  const packages = migrateLegacyToPackages(member)
  return packages.some((p) => isPackageEntryActive(p))
}

export function packageStripeSubscriptionId(pkg) {
  const sid = String(pkg?.stripeSubscriptionId || '').trim()
  return sid || null
}

export function findPackageBySubscriptionId(packages, subscriptionId, member = null) {
  const sid = String(subscriptionId || '').trim()
  if (!sid) return null
  const pkgs = packages || []
  const exact = pkgs.find((p) => packageStripeSubscriptionId(p) === sid)
  if (exact) return exact
  const memberSid = String(member?.stripeSubscriptionId || '').trim()
  if (memberSid !== sid) return null
  const unlabeled = pkgs.filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && !packageStripeSubscriptionId(p)
  ))
  if (unlabeled.length === 1) return unlabeled[0]
  const recurring = pkgs.filter((p) => isPackageEntryActive(p) && !isOneTimePackage(p))
  if (recurring.length === 1) return recurring[0]
  return null
}

export function packageBillingSubscriptionId(pkg, member) {
  const sid = packageStripeSubscriptionId(pkg)
  if (sid) return sid
  if (isOneTimePackage(pkg)) return null
  const memberSid = String(member?.stripeSubscriptionId || '').trim()
  if (!memberSid) return null
  const match = findPackageBySubscriptionId(migrateLegacyToPackages(member), memberSid, member)
  return match?.id === pkg?.id ? memberSid : null
}

export function listCancelAtPeriodEndPackages(member) {
  return migrateLegacyToPackages(member).filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && Boolean(p.cancelAtPeriodEnd)
  ))
}

export function memberHasActiveRecurringPackages(member) {
  return migrateLegacyToPackages(member).some((p) => isPackageEntryActive(p) && !isOneTimePackage(p))
}

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free') return false
  return memberHasActivePaidPackages(member)
}

/**
 * Ücretli plan satın alma / değiştirme:
 * - Tek seferlik (doktor) veya addPackage → mevcut paketlere ekler
 * - Abonelik planı → aktif abonelikleri değiştirir, tek seferlik paketleri korur
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []

  if (addPackage || isOneTimePlan(planId) || String(meta.provider || '') === 'stripe') {
    const sid = String(meta.stripeSubscriptionId || '').trim()
    if (sid) {
      const idx = packages.findIndex((p) => String(p?.stripeSubscriptionId || '').trim() === sid)
      if (idx >= 0) {
        const next = [...packages]
        next[idx] = createPackageEntry(planId, packageConfig, { ...meta, id: packages[idx].id })
        return next
      }
    }
    return addMemberPackage(packages, planId, packageConfig, meta)
  }

  const keepOneTime = packages.filter((p) => isOneTimePlan(p.planId) && isPackageEntryActive(p))
  return [...keepOneTime, createPackageEntry(planId, packageConfig, meta)]
}

/** Paket süreleri, tüketim ve birleşik config */
export function syncMemberPackages(member) {
  if (!member) return member

  const syncedMember = {
    ...member,
    doctorSessions: applyDoctorSessionNoShows(member.doctorSessions),
  }

  let packages = migrateLegacyToPackages(syncedMember)
  const now = today()
  const consumedDoctor = countConsumedDoctorSessions(syncedMember)

  packages = packages.map((pkg) => {
    if (pkg.status === 'expired') return { ...pkg, status: 'expired' }
    if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') {
      const total = Number(pkg.packageConfig?.doctorSessionsTotal) || 1
      if (consumedDoctor >= total) return { ...pkg, status: 'consumed' }
      return { ...pkg, status: 'active' }
    }
    if (pkg.status === 'consumed') return { ...pkg, status: 'consumed' }
    if (pkg.expiresAt && pkg.expiresAt < now) return { ...pkg, status: 'expired' }
    return { ...pkg, status: 'active' }
  })

  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = mergePackageConfigs(active, syncedMember)
  const primary = resolvePrimaryMembership(active, member.membership)

  const subExpiries = active
    .filter((p) => !isOneTimePlan(p.planId) && p.expiresAt)
    .map((p) => p.expiresAt)
    .sort()
  const latestExpiry = subExpiries.length ? subExpiries[subExpiries.length - 1] : null

  let membership = active.length ? primary : 'free'
  let membershipStatus = member.membershipStatus || 'active'
  const adminHeld = membershipStatus === 'paused' || membershipStatus === 'cancelled'
  const wasPaid = isPaidMembership(member.membership)

  if (!active.length && wasPaid) {
    membership = 'free'
    if (!adminHeld) membershipStatus = 'active'
  } else if (latestExpiry && !adminHeld) {
    const remaining = Math.ceil((new Date(latestExpiry) - new Date(now)) / (1000 * 60 * 60 * 24))
    if (remaining <= 0) {
      membership = active.length ? primary : 'free'
    } else if (remaining <= 7) {
      membershipStatus = 'expiring'
    } else if (membershipStatus === 'expiring') {
      membershipStatus = 'active'
    }
  } else if (adminHeld) {
    membershipStatus = member.membershipStatus
  }

  const goingFree = membership === 'free' && !active.length
  const synced = {
    ...syncedMember,
    activePackages: packages,
    packageConfig: goingFree ? { ...DEFAULT_PACKAGE } : merged,
    membership,
    membershipStatus,
    premiumExpiresAt: goingFree ? null : (latestExpiry ?? member.premiumExpiresAt ?? null),
    premiumStartedAt: goingFree ? null : (member.premiumStartedAt || packages[0]?.startedAt || null),
    freeTrialExpiresAt: goingFree ? null : (member.freeTrialExpiresAt ?? null),
  }
  return sanitizeStaffForPackage(synced.packageConfig, synced)
}

/** hydrate sırasında süre dolumu senkronunun DB'ye yazılması gerekip gerekmediği */
export function memberExpirySyncNeedsPersist(before, after) {
  if (!before || !after) return false
  if (before.membership !== after.membership) return true
  if (before.membershipStatus !== after.membershipStatus) return true
  if (before.assignedCoachId !== after.assignedCoachId) return true
  if (before.assignedDietitianId !== after.assignedDietitianId) return true
  if (before.assignedDoctorId !== after.assignedDoctorId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  if ((before.premiumStartedAt || null) !== (after.premiumStartedAt || null)) return true
  if (JSON.stringify(before.activePackages || []) !== JSON.stringify(after.activePackages || [])) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın
  for (const key of ['coachSessions', 'dietitianSessions', 'doctorSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

/** Doktor randevu limiti: tek seferlik kalan hak veya aylık limit */
export function doctorBookingLimit(packageConfig = {}, member = null) {
  const total = Number(packageConfig.doctorSessionsTotal) || 0
  if (total > 0 && member) {
    return Math.max(0, total - countUsedDoctorSessions(member))
  }
  return Number(packageConfig.doctorMeetingsPerMonth) || 0
}

export function doctorLimitIsOneTime(packageConfig = {}) {
  return (Number(packageConfig.doctorSessionsTotal) || 0) > 0
}

const PHOTO_CALORIE_PLANS = new Set(['eko_diyet', 'eko_spor', 'diyet', 'spor', 'vip', 'platinum', 'premium'])
const FULL_VIDEO_PLANS = new Set(['eko_spor', 'spor', 'vip', 'platinum', 'premium'])
const MANUAL_CALORIE_EXCLUDE = new Set(['free', 'doktor', 'kurucu'])

/** Aktif paketler + birleşik config */
export function resolveMemberEntitlements(member) {
  if (!member) {
    return { membership: 'free', packageConfig: { ...DEFAULT_PACKAGE }, activePackages: [] }
  }
  const activePackages = migrateLegacyToPackages(member)
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  const packageConfig = active.length
    ? mergePackageConfigs(active, member)
    : (member.packageConfig || { ...DEFAULT_PACKAGE })
  const membership = resolvePrimaryMembership(active, member.membership || 'free')
  return { membership, packageConfig, activePackages: active }
}

function activePlanIds(member) {
  const { activePackages, membership } = resolveMemberEntitlements(member)
  const ids = activePackages.map((p) => p.planId)
  return ids.length ? ids : [membership]
}

export function memberHasPhotoCalorieAccess(member) {
  return activePlanIds(member).some((id) => PHOTO_CALORIE_PLANS.has(id))
}

export function memberHasManualCalorieAccess(member) {
  return activePlanIds(member).some((id) => !MANUAL_CALORIE_EXCLUDE.has(id))
}

export function memberHasFullVideoAccess(member) {
  return activePlanIds(member).some((id) => FULL_VIDEO_PLANS.has(id))
}
