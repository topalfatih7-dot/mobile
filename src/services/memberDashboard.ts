import type { Conversation } from '@/data/messages';
import type {
  DailyStat,
  NextSession,
  TodayItem,
} from '@/data/dashboard';
import type { Program } from '@/data/programs';
import { gradients, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';
import type { MemberProfile } from '@/types/session';

import type { DbChatThread } from './db/chat';
import type { DbProgram } from './db/programs';

const STAFF_ROLE_LABELS: Record<string, string> = {
  coach: 'Kişisel Koç',
  dietitian: 'Diyetisyen',
};

const STAFF_GRADIENTS: Record<string, Gradient> = {
  coach: gradients.coral,
  dietitian: gradients.forest,
};

type MemberTask = {
  id: string;
  type?: string;
  title?: string;
  done?: boolean;
  due?: string;
};

type CoachSession = {
  id?: string;
  status?: string;
  date?: string;
  time?: string;
  type?: string;
  duration?: number;
  durationMin?: number;
  coachName?: string;
  coach?: string;
};

type WorkoutProgress = {
  date?: string;
  value?: number;
  count?: number;
};

function completedKeys(member: MemberProfile | null): string[] {
  const map = member?.completedActivities as Record<string, string[]> | undefined;
  if (!map) return [];
  return Object.values(map).flat();
}

export function computeProgramProgress(
  program: DbProgram,
  member: MemberProfile | null,
): number {
  const entries = program.entries || [];
  if (entries.length === 0) return 0;
  const keys = completedKeys(member);
  const done = entries.filter((entry) => keys.some((key) => key.endsWith(`_${entry.id}`))).length;
  return done / entries.length;
}

function programMeta(program: DbProgram) {
  const isNutrition = program.type === 'nutrition';
  return {
    category: isNutrition ? 'Beslenme' : 'Antrenman',
    icon: (isNutrition ? 'nutrition' : 'barbell') as IoniconName,
    gradient: (isNutrition ? gradients.forest : gradients.coral) as Gradient,
    level: isNutrition ? 'Tüm seviyeler' : 'Kişisel',
    perWeek: isNutrition
      ? `${program.entries.length || 0} öğün kaydı`
      : `${program.entries.length || 0} hareket`,
  };
}

export function mapProgramsToMobile(
  programs: DbProgram[],
  member: MemberProfile | null,
): Program[] {
  return programs.map((program) => {
    const meta = programMeta(program);
    return {
      id: program.id,
      title: program.title || (program.type === 'nutrition' ? 'Beslenme Programı' : 'Antrenman Programı'),
      category: meta.category,
      level: meta.level,
      weeks: Math.max(1, Math.ceil((program.entries?.length || 0) / 7)),
      perWeek: meta.perWeek,
      progress: computeProgramProgress(program, member),
      icon: meta.icon,
      gradient: meta.gradient,
      coach: program.staffName || 'Uzmanınız',
    };
  });
}

export function buildFeaturedProgram(programs: Program[]) {
  if (programs.length === 0) return null;
  const featured = [...programs].sort((a, b) => b.progress - a.progress)[0];
  const sessionsTotal = Math.max(8, featured.weeks * 4);
  const sessionsDone = Math.round(featured.progress * sessionsTotal);
  return {
    id: featured.id,
    title: featured.title,
    tag: featured.progress > 0 ? 'Devam ediyor' : 'Yeni program',
    weeks: featured.weeks,
    sessionsDone,
    sessionsTotal,
    progress: featured.progress,
    gradient: featured.gradient,
    nextLabel: featured.perWeek,
  };
}

export function buildDailyGoal(member: MemberProfile | null) {
  const tasks = (member?.tasks as MemberTask[] | undefined) || [];
  const total = tasks.length || 0;
  const completed = tasks.filter((task) => task.done).length;
  return {
    progress: total > 0 ? completed / total : 0,
    completed,
    total: total || 0,
  };
}

function taskIcon(type?: string): IoniconName {
  if (type === 'workout') return 'barbell';
  if (type === 'meal' || type === 'nutrition') return 'nutrition';
  if (type === 'checkin') return 'checkbox-outline';
  return 'ellipse-outline';
}

function taskGradient(type?: string): Gradient {
  if (type === 'workout') return gradients.coral;
  if (type === 'meal' || type === 'nutrition') return gradients.forest;
  if (type === 'checkin') return gradients.brand;
  return gradients.violet;
}

export function buildTodayPlan(member: MemberProfile | null): TodayItem[] {
  const tasks = (member?.tasks as MemberTask[] | undefined) || [];
  return tasks.map((task) => ({
    id: task.id,
    title: task.title || 'Görev',
    subtitle: task.type === 'workout' ? 'Antrenman görevi' : 'Günlük görev',
    time: task.due || 'Bugün',
    icon: taskIcon(task.type),
    gradient: taskGradient(task.type),
    done: Boolean(task.done),
  }));
}

export function buildNextSession(member: MemberProfile | null): NextSession | null {
  const sessions = [
    ...(((member?.coachSessions as CoachSession[] | undefined) || []).map((session) => ({
      ...session,
      sessionType: 'coach' as const,
    }))),
    ...(((member?.dietitianSessions as CoachSession[] | undefined) || []).map((session) => ({
      ...session,
      sessionType: 'dietitian' as const,
    }))),
  ].filter((session) => session.status === 'scheduled' && session.date);

  if (sessions.length === 0) return null;

  const sorted = [...sessions].sort((a, b) => {
    const aKey = `${a.date}T${a.time || '00:00'}`;
    const bKey = `${b.date}T${b.time || '00:00'}`;
    return aKey.localeCompare(bKey);
  });

  const next =
    sorted.find((session) => {
      const when = new Date(`${session.date}T${session.time || '12:00'}`);
      return when >= new Date();
    }) || sorted[0];

  const when = new Date(`${next.date}T${next.time || '12:00'}`);
  const isToday = when.toDateString() === new Date().toDateString();

  return {
    id: next.id || `${next.sessionType}-${next.date}`,
    sessionType: next.sessionType,
    coach: next.coachName || next.coach || 'Uzmanınız',
    role: next.sessionType === 'dietitian' ? 'Diyetisyen' : 'Kişisel Koç',
    type: next.type || 'Video Görüşme',
    date: isToday ? 'Bugün' : when.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    time: next.time || '—',
    durationMin: next.durationMin || next.duration || 30,
    rawDate: next.date!,
  };
}

export function buildDailyStats(
  member: MemberProfile | null,
  programs: Program[],
): DailyStat[] {
  const streak = typeof member?.streak === 'number' ? member.streak : 0;
  const goal = buildDailyGoal(member);
  const avgProgress =
    programs.length > 0
      ? programs.reduce((sum, program) => sum + program.progress, 0) / programs.length
      : 0;
  const workouts = ((member?.progress as { workouts?: WorkoutProgress[] } | undefined)?.workouts) || [];
  const weekCount = workouts.filter((item) => {
    if (!item.date) return false;
    const date = new Date(item.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  return [
    {
      id: 'streak',
      label: 'Seri',
      value: String(streak),
      unit: 'gün',
      icon: 'flame',
      gradient: gradients.coral,
      progress: Math.min(streak / 14, 1),
    },
    {
      id: 'tasks',
      label: 'Görevler',
      value: String(goal.completed),
      unit: `/ ${goal.total || 0}`,
      icon: 'checkbox-outline',
      gradient: gradients.brand,
      progress: goal.progress,
    },
    {
      id: 'programs',
      label: 'Program',
      value: String(programs.length),
      unit: 'adet',
      icon: 'barbell',
      gradient: gradients.violet,
      progress: avgProgress,
    },
    {
      id: 'workouts',
      label: 'Antrenman',
      value: String(weekCount),
      unit: 'bu hafta',
      icon: 'fitness',
      gradient: gradients.teal,
      progress: Math.min(weekCount / 5, 1),
    },
  ];
}

export function buildWeeklyActivity(member: MemberProfile | null) {
  const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const workouts = ((member?.progress as { workouts?: WorkoutProgress[] } | undefined)?.workouts) || [];
  const today = new Date();

  return labels.map((day, index) => {
    const date = new Date(today);
    const currentDay = (today.getDay() + 6) % 7;
    date.setDate(today.getDate() - (currentDay - index));
    const dateStr = date.toISOString().slice(0, 10);
    const count = workouts.filter((item) => item.date === dateStr).length;
    return { day, value: Math.min(count / 2, 1) };
  });
}

export function formatChatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Dün';
  return date.toLocaleDateString('tr-TR', { weekday: 'short' });
}

export function mapChatThreadsToConversations(threads: DbChatThread[]): Conversation[] {
  return threads.map((thread) => ({
    id: thread.id,
    name: thread.staffName || 'Uzman',
    role: STAFF_ROLE_LABELS[thread.staffRole] || 'Uzman',
    last: thread.lastPreview || 'Henüz mesaj yok',
    time: formatChatTime(thread.lastMessageAt),
    unread: thread.memberUnread,
    online: false,
    gradient: STAFF_GRADIENTS[thread.staffRole] || gradients.brand,
  }));
}

export function totalChatUnread(threads: DbChatThread[]): number {
  return threads.reduce((sum, thread) => sum + thread.memberUnread, 0);
}
