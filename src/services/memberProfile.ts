import type { ProfileStat } from '@/data/user';
import {
  getCoachMeetingsPerMonth,
  getDefaultPackageForPlan,
  getPlanLabel,
  isPaidMembership,
  MEMBERSHIP_STATUS_LABELS,
  packageIncludesCoach,
  packageIncludesDietitian,
  type PackageConfig,
} from '@/data/membershipPlans';
import type { Program } from '@/data/programs';
import type { MemberProfile } from '@/types/session';

type WorkoutProgress = { date?: string };

export function getMemberPackageConfig(member: MemberProfile | null): PackageConfig {
  const stored = member?.packageConfig as PackageConfig | undefined;
  if (stored && typeof stored === 'object') return stored;
  const planId = (member?.membership as string) || 'free';
  const months = Number((member?.packageConfig as PackageConfig | undefined)?.durationMonths) || 1;
  return getDefaultPackageForPlan(planId, months);
}

export function buildProfileStats(member: MemberProfile | null, programs: Program[]): ProfileStat[] {
  const weight = member?.weight != null && member.weight !== '' ? String(member.weight) : '—';
  const workouts =
    ((member?.progress as { workouts?: WorkoutProgress[] } | undefined)?.workouts) || [];
  const streak = typeof member?.streak === 'number' ? String(member.streak) : '0';

  return [
    { id: 'weight', label: 'Kilo', value: weight, unit: weight === '—' ? '' : 'kg' },
    { id: 'workouts', label: 'Antrenman', value: String(workouts.length), unit: 'seans' },
    { id: 'programs', label: 'Program', value: String(programs.length), unit: 'adet' },
    { id: 'streak', label: 'Seri', value: streak, unit: 'gün' },
  ];
}

export type ProfileInfoRow = { label: string; value: string };

const GENDER_LABELS: Record<string, string> = {
  female: 'Kadın',
  male: 'Erkek',
  other: 'Diğer',
};

const FITNESS_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export function buildPersonalInfoRows(member: MemberProfile | null, email: string): ProfileInfoRow[] {
  const goals = Array.isArray(member?.goals)
    ? (member!.goals as string[]).join(', ')
    : typeof member?.goal === 'string'
      ? member.goal
      : '—';

  const cityLine = member?.city
    ? `${member.city}${member.district ? ` / ${member.district}` : ''}`
    : '—';

  return [
    { label: 'Ad Soyad', value: member?.name || '—' },
    { label: 'E-posta', value: email || member?.email || '—' },
    { label: 'Telefon', value: (member?.phone as string) || '—' },
    { label: 'Yaş', value: member?.age != null && member.age !== '' ? String(member.age) : '—' },
    {
      label: 'Cinsiyet',
      value: GENDER_LABELS[(member?.gender as string) || ''] || '—',
    },
    { label: 'Şehir / İlçe', value: cityLine },
    {
      label: 'Kilo / Boy',
      value:
        member?.weight != null && member.weight !== ''
          ? `${member.weight} kg${member?.height ? ` / ${member.height} cm` : ''}`
          : '—',
    },
    {
      label: 'Bel çevresi',
      value: member?.waist != null && member.waist !== '' ? `${member.waist} cm` : '—',
    },
    { label: 'Hedefler', value: goals || '—' },
    {
      label: 'Spor seviyesi',
      value: FITNESS_LABELS[(member?.fitnessLevel as string) || ''] || '—',
    },
  ];
}

export type MembershipSummary = {
  planLabel: string;
  planId: string;
  statusLabel: string;
  isPaid: boolean;
  packageConfig: PackageConfig;
  joinedAt?: string;
  premiumExpiresAt?: string;
  benefits: string[];
};

export function buildMembershipSummary(member: MemberProfile | null): MembershipSummary {
  const planId = (member?.membership as string) || 'free';
  const packageConfig = getMemberPackageConfig(member);
  const status = (member?.membershipStatus as string) || 'active';
  const benefits: string[] = [];

  const coachMeetings = getCoachMeetingsPerMonth(packageConfig);
  if (coachMeetings > 0) {
    benefits.push(`Ayda ${coachMeetings} koç görüşmesi`);
  }
  if (Number(packageConfig.dietitianMeetingsPerMonth) > 0) {
    benefits.push(`Ayda ${packageConfig.dietitianMeetingsPerMonth} diyetisyen görüşmesi`);
  }
  if (packageIncludesCoach(packageConfig)) {
    benefits.push('Kişisel antrenman programı');
  }
  if (packageIncludesDietitian(packageConfig)) {
    benefits.push('Kişisel beslenme programı');
  }
  if (planId === 'free') {
    benefits.push('Otomatik beslenme ve antrenman programı', 'Temel video kütüphanesi');
  }

  return {
    planLabel: getPlanLabel(planId),
    planId,
    statusLabel: MEMBERSHIP_STATUS_LABELS[status] || status,
    isPaid: isPaidMembership(planId),
    packageConfig,
    joinedAt: member?.joinedAt as string | undefined,
    premiumExpiresAt: member?.premiumExpiresAt as string | undefined,
    benefits,
  };
}
