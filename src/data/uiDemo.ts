/**
 * UI-only demo verisi — gerçek DB yokken ekranların dolu görünmesi için.
 * UI_ONLY_MODE kapanınca kullanılmaz.
 */
import type { HydratedAuth } from '@/services/authHydrate';
import type { ProgramRecord, PostRecord } from '@/context/DataContext';
import { getDefaultPackageForPlan } from '@/data/membershipPlans';

export const DEMO_USER_ID = 'ui-demo-member';

function daysFromNow(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const WEEKDAY_HOURS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const WEEKDAY_AVAILABILITY: Record<string, string[]> = {
  '1': WEEKDAY_HOURS,
  '2': WEEKDAY_HOURS,
  '3': WEEKDAY_HOURS,
  '4': WEEKDAY_HOURS,
  '5': WEEKDAY_HOURS,
};

export function buildDemoMember(email = 'demo@yeniform.com'): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  const packageConfig = getDefaultPackageForPlan('vip', 1);
  return {
    id: DEMO_USER_ID,
    email,
    name: 'Demo Üye',
    phone: '5550000000',
    membership: 'vip',
    membershipStatus: 'active',
    profileComplete: true,
    joinedAt: today,
    streak: 3,
    completedActivities: {},
    progress: { weight: [], mood: [], workouts: [], meals: [] },
    availability: { '1': ['09:00'], '3': ['09:00'], '5': ['09:00'] },
    packageConfig,
    coachSessions: [
      {
        id: 'ui-sess-coach-1',
        type: 'coach',
        title: 'Koç Görüşmesi',
        date: daysFromNow(2, 10),
        duration: 30,
        status: 'scheduled',
        coach: 'Demo Koç',
        bookedBy: 'member',
        createdAt: new Date().toISOString(),
      },
    ],
    dietitianSessions: [
      {
        id: 'ui-sess-diet-1',
        type: 'dietitian',
        title: 'Diyetisyen Görüşmesi',
        date: daysFromNow(4, 14),
        duration: 30,
        status: 'scheduled',
        coach: 'Demo Diyetisyen',
        bookedBy: 'member',
        createdAt: new Date().toISOString(),
      },
    ],
    doctorSessions: [],
    settings: {
      theme: 'light',
      language: 'tr',
      emailNotifs: true,
      pushNotifs: false,
    },
    city: 'İstanbul',
    district: 'Kadıköy',
    gender: 'female',
    phoneCountry: 'TR',
    freeTrialExpiresAt: null,
    premiumStartedAt: today,
    premiumExpiresAt: null,
    assignedCoachId: 'ui-demo-coach',
    assignedDietitianId: 'ui-demo-dietitian',
    assignedDoctorId: 'ui-demo-doctor',
    healthAck: false,
    disclaimer: false,
    healthTest: {},
    notifications: [
      {
        id: 'ui-n1',
        type: 'chat',
        title: 'Yeni mesaj',
        message: 'Koçunuz size mesaj gönderdi.',
        read: false,
        createdAt: new Date().toISOString(),
        staffRole: 'coach',
      },
      {
        id: 'ui-n2',
        type: 'program',
        title: 'Program güncellendi',
        message: 'Yeni antrenman programınız hazır.',
        read: true,
        createdAt: daysFromNow(-1, 9),
      },
    ],
    supportTickets: [],
  };
}

/** UI-only rol: admin@ / coach@|staff@ / diet@ / doctor@ → ilgili panel; diğer → üye */
export function buildDemoAuth(email?: string): HydratedAuth {
  const normalized = (email || 'demo@yeniform.com').trim().toLowerCase();
  const local = normalized.split('@')[0] || '';

  if (normalized.includes('admin') || local === 'admin') {
    return {
      userId: 'ui-demo-admin',
      email: normalized,
      role: 'admin',
      member: null,
      staff: null,
      registeredMember: true,
    };
  }

  if (
    local.startsWith('coach') ||
    local.startsWith('staff') ||
    local.startsWith('diet') ||
    local.startsWith('doctor') ||
    normalized.includes('@staff')
  ) {
    const roleKey = local.startsWith('diet')
      ? 'dietitian'
      : local.startsWith('doctor')
        ? 'doctor'
        : 'coach';
    const staffId =
      roleKey === 'dietitian'
        ? 'ui-demo-dietitian'
        : roleKey === 'doctor'
          ? 'ui-demo-doctor'
          : 'ui-demo-coach';
    const staff = { ...DEMO_STAFF[staffId], email: normalized };
    return {
      userId: staffId,
      email: normalized,
      role: 'staff',
      member: null,
      staff,
      registeredMember: true,
    };
  }

  const member = buildDemoMember(normalized);
  return {
    userId: DEMO_USER_ID,
    email: String(member.email),
    role: 'member',
    member,
    staff: null,
    registeredMember: true,
  };
}

export const DEMO_PROGRAMS: ProgramRecord[] = [
  {
    id: 'ui-prog-workout',
    memberId: DEMO_USER_ID,
    staffId: 'ui-demo-coach',
    type: 'workout',
    title: 'Demo Antrenman',
    scheduleType: 'cycle14',
    cycleSameDaily: true,
    cycleLength: 14,
    entries: [
      {
        id: 'e1',
        name: 'Squat',
        amount: 12,
        amountType: 'reps',
        everyday: true,
        order: 0,
      },
      {
        id: 'e2',
        name: 'Plank',
        amount: 40,
        amountType: 'duration',
        durationUnit: 'sn',
        everyday: true,
        order: 1,
      },
    ],
  },
  {
    id: 'ui-prog-nutrition',
    memberId: DEMO_USER_ID,
    staffId: 'ui-demo-dietitian',
    type: 'nutrition',
    title: 'Demo Beslenme',
    scheduleType: 'cycle14',
    cycleSameDaily: true,
    cycleLength: 14,
    entries: [
      {
        id: 'm1',
        name: 'Yulaf + yoğurt',
        mealType: 'breakfast',
        everyday: true,
      },
      {
        id: 'm2',
        name: 'Izgara tavuk salata',
        mealType: 'lunch',
        everyday: true,
      },
    ],
  },
];

export const DEMO_POSTS: PostRecord[] = [
  {
    id: 'ui-post-1',
    published: true,
    title: 'Küçük adımlarla büyük değişim',
    createdAt: new Date().toISOString(),
    slug: 'kucuk-adimlar',
  },
];

export const DEMO_STAFF: Record<string, Record<string, unknown>> = {
  'ui-demo-coach': {
    id: 'ui-demo-coach',
    name: 'Demo Koç',
    role: 'coach',
    active: true,
    availability: WEEKDAY_AVAILABILITY,
  },
  'ui-demo-dietitian': {
    id: 'ui-demo-dietitian',
    name: 'Demo Diyetisyen',
    role: 'dietitian',
    active: true,
    availability: WEEKDAY_AVAILABILITY,
  },
  'ui-demo-doctor': {
    id: 'ui-demo-doctor',
    name: 'Demo Doktor',
    role: 'doctor',
    active: true,
    availability: {
      '2': ['10:00', '11:00'],
      '4': ['10:00', '11:00'],
    },
  },
};

export const DEMO_EXERCISES: Record<string, unknown>[] = [
  {
    id: 'ui-ex-1',
    name: 'Goblet Squat',
    bodyPart: 'Bacak',
    difficulty: 'beginner',
    locations: ['home', 'gym'],
    requiresMachine: false,
    thumbnailUrl: null,
    videoPending: true,
  },
  {
    id: 'ui-ex-2',
    name: 'Push-up',
    bodyPart: 'Göğüs',
    difficulty: 'beginner',
    locations: ['home', 'office'],
    requiresMachine: false,
    thumbnailUrl: null,
    videoPending: true,
  },
  {
    id: 'ui-ex-3',
    name: 'Lat Pulldown',
    bodyPart: 'Sırt',
    difficulty: 'intermediate',
    locations: ['gym'],
    requiresMachine: true,
    thumbnailUrl: null,
    videoPending: true,
  },
];

export const DEMO_CLIENTS: Record<string, unknown>[] = [
  {
    id: DEMO_USER_ID,
    name: 'Demo Üye',
    email: 'demo@yeniform.com',
    membership: 'vip',
    gender: 'female',
    phone: '5550000000',
    assignedCoachId: 'ui-demo-coach',
    assignedDietitianId: 'ui-demo-dietitian',
  },
  {
    id: 'ui-client-2',
    name: 'Ayşe Yılmaz',
    email: 'ayse@example.com',
    membership: 'spor',
    gender: 'female',
    phone: '5551112233',
    assignedCoachId: 'ui-demo-coach',
  },
  {
    id: 'ui-client-3',
    name: 'Mehmet Kaya',
    email: 'mehmet@example.com',
    membership: 'diyet',
    gender: 'male',
    phone: '5552223344',
    assignedDietitianId: 'ui-demo-dietitian',
  },
];

function minutesAgo(mins: number) {
  return new Date(Date.now() - mins * 60000).toISOString();
}

export type AdminStaffChatMessage = {
  id: string;
  from: 'staff' | 'admin';
  text: string;
  createdAt: string;
};

/** Admin ↔ personel sohbetleri için yerel tohum mesajlar (UI-only). */
export const DEMO_ADMIN_STAFF_CHATS: Record<string, AdminStaffChatMessage[]> = {
  'ui-demo-coach': [
    {
      id: 'ac1',
      from: 'staff',
      text: 'Yeni üyenin programını bugün hazırlıyorum.',
      createdAt: minutesAgo(55),
    },
    {
      id: 'ac2',
      from: 'admin',
      text: 'Teşekkürler, atamasız üyeleri de kontrol edelim.',
      createdAt: minutesAgo(40),
    },
  ],
  'ui-demo-dietitian': [
    {
      id: 'ad1',
      from: 'staff',
      text: 'Diyet listeleri güncellendi.',
      createdAt: minutesAgo(130),
    },
    {
      id: 'ad2',
      from: 'admin',
      text: 'Harika, yeni üyelerin listelerini de bu hafta tamamlayalım.',
      createdAt: minutesAgo(110),
    },
  ],
  'ui-demo-doctor': [
    {
      id: 'adr1',
      from: 'staff',
      text: 'Perşembe randevularım onaylandı.',
      createdAt: minutesAgo(300),
    },
    {
      id: 'adr2',
      from: 'admin',
      text: 'Teşekkürler, seans notlarını panelden takip ediyorum.',
      createdAt: minutesAgo(280),
    },
  ],
};

export const DEMO_ADMIN_STATS = {
  members: 128,
  activeSessions: 14,
  openTickets: 3,
  unassigned: 2,
  staffCount: 8,
  applications: 5,
};

export const DEMO_ADMIN_TICKETS = [
  {
    id: 't1',
    status: 'open',
    data: {
      subject: 'Paket yenileme',
      category: 'Ödeme',
      memberName: 'Demo Üye',
      messages: [{ from: 'member', text: 'Paketim ne zaman yenilenir?', createdAt: new Date().toISOString() }],
    },
  },
  {
    id: 't2',
    status: 'in-progress',
    data: {
      subject: 'Video açılmıyor',
      category: 'Teknik sorun',
      memberName: 'Ayşe Yılmaz',
      messages: [],
    },
  },
];

export const DEMO_APPLICATIONS = [
  { id: 'a1', kind: 'staff', name: 'Ali Koç', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'a2', kind: 'corporate', name: 'Acme A.Ş.', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'a3', kind: 'contact', name: 'Ziyaretçi', status: 'reviewed', createdAt: new Date().toISOString() },
];
