/**
 * Web parity: Adsız `utils/coachProgram.js`
 */
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { CYCLE_PLAN_LENGTH } from '@/utils/programSchedule';
import {
  AVAILABILITY_WEEKDAYS,
  cycleLengthFromRange,
} from '@/utils/memberAvailability';

export const COACH_DURATION_PRESETS = [20, 30, 45, 60, 75, 90];

export const DEFAULT_SESSION_TIME = { start: '09:00', end: '10:00' };

export type CartEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  videoUrl?: string;
  videoPending?: boolean;
  description?: string;
  amountType: 'reps' | 'duration';
  amount: number;
  durationUnit: 'sn' | 'dk';
  note: string;
};

export type DayCarts = Record<number, CartEntry[]>;

export function weekdayShortLabel(day: number | string) {
  return (
    AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(day))?.short || String(day)
  );
}

export function weekdayFullLabel(day: number | string) {
  return (
    AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(day))?.label || String(day)
  );
}

export function entryToDisplayText(e: Record<string, unknown>) {
  const amount =
    e.amountType === 'duration'
      ? `${e.amount} ${e.durationUnit || 'sn'}`
      : `${e.amount} tekrar`;
  const day =
    e.day != null && e.day !== '' ? `${weekdayShortLabel(e.day as number)} · ` : '';
  return `${day}${e.exerciseName} · ${amount}${e.note ? ` (${e.note})` : ''}`;
}

/** Workout programlarındaki benzersiz exerciseId listesi (koç + AI). */
export function collectProgramExerciseIds(programs: Record<string, unknown>[] = []): string[] {
  const ids = new Set<string>();
  for (const program of programs || []) {
    if (program?.type && program.type !== 'workout') continue;
    const entries = Array.isArray(program?.entries) ? program.entries : [];
    for (const entry of entries as Record<string, unknown>[]) {
      const id = entry?.exerciseId;
      if (id && typeof id === 'string') ids.add(id);
    }
  }
  return [...ids];
}

export function buildCoachProgramTitle(
  memberName: string,
  startStr: string,
  endStr: string,
  mode: 'weekly' | 'fixed14' | string = 'weekly',
) {
  const startFmt = format(parseISO(`${startStr}T12:00:00`), 'd MMM yyyy', { locale: tr });
  const endFmt = format(parseISO(`${endStr}T12:00:00`), 'd MMM yyyy', { locale: tr });
  if (mode === 'fixed14') {
    return `${memberName} — 14 Günlük Antrenman (${startFmt} – ${endFmt})`;
  }
  if (mode === 'weekly') {
    return `${memberName} — Haftalık Antrenman (${startFmt} – ${endFmt})`;
  }
  return `${memberName} — Antrenman (${startFmt} – ${endFmt})`;
}

function normalizeCartEntry(
  e: CartEntry,
  i: number,
  {
    day,
    start,
    end,
  }: { day?: number; start: string; end: string },
) {
  return {
    id: e.id || `e-${Date.now()}-${day ?? 'x'}-${i}`,
    exerciseId: e.exerciseId,
    exerciseName: e.exerciseName,
    videoUrl: e.videoUrl || '',
    description: e.description || '',
    amountType: e.amountType || 'reps',
    amount: e.amount ?? 12,
    durationUnit: e.durationUnit || 'sn',
    note: e.note || '',
    start,
    end,
    order: i,
    ...(day != null ? { day: Number(day) } : {}),
  };
}

/** Sepet satırlarını yeni id’lerle kopyala (gün kopyalama / tüm günlere uygula). */
export function cloneCartEntries(entries: CartEntry[] = []): CartEntry[] {
  const stamp = Date.now();
  return (entries || []).map((e, i) => ({
    ...e,
    id: `e-${stamp}-${i}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}

export function filledWeekdaysFromDayCarts(dayCarts: DayCarts = {}) {
  return Object.keys(dayCarts)
    .map(Number)
    .filter((d) => !Number.isNaN(d) && (dayCarts[d] || []).length > 0)
    .sort((a, b) => a - b);
}

/** programs.entries → dayCarts hydrate (admin/staff edit). */
export function hydrateDayCartsFromEntries(entries: Record<string, unknown>[] = []): DayCarts {
  const carts: DayCarts = {};
  for (const e of entries || []) {
    if (e?.day == null || e.day === '') continue;
    const day = Number(e.day);
    if (Number.isNaN(day)) continue;
    if (!carts[day]) carts[day] = [];
    carts[day].push({
      id: String(e.id || `e-${day}-${carts[day].length}-${Date.now()}`),
      exerciseId: String(e.exerciseId || ''),
      exerciseName: String(e.exerciseName || ''),
      videoUrl: String(e.videoUrl || ''),
      videoPending: Boolean(e.videoPending),
      description: String(e.description || ''),
      amountType: (e.amountType === 'duration' ? 'duration' : 'reps') as CartEntry['amountType'],
      amount: Number(e.amount ?? 12),
      durationUnit: (e.durationUnit === 'dk' ? 'dk' : 'sn') as CartEntry['durationUnit'],
      note: String(e.note || ''),
    });
  }
  return carts;
}

export function countDayCartExercises(dayCarts: DayCarts = {}) {
  return filledWeekdaysFromDayCarts(dayCarts).reduce(
    (sum, d) => sum + (dayCarts[d]?.length || 0),
    0,
  );
}

export function createCartEntry(ex: Record<string, unknown>): CartEntry {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId: String(ex.id),
    exerciseName: String(ex.name),
    videoUrl: String(ex.videoUrl || ''),
    videoPending: Boolean(ex.videoPending),
    description: String(ex.description || ''),
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    note: '',
  };
}

/**
 * Gün bazlı haftalık şablon → programs.data payload.
 * cycleSameDaily yazılmaz (legacy cycleDay rotasyonuna düşmesin).
 */
export function buildWeeklyCoachProgramPayload({
  dayCarts = {},
  daySessionTimes = {},
  startDate,
  endDate,
  description = '',
  sessionDuration = 45,
  memberName,
  titleMode = 'weekly',
}: {
  dayCarts?: DayCarts;
  daySessionTimes?: Record<number, { start: string; end: string }>;
  startDate: string;
  endDate: string;
  description?: string;
  sessionDuration?: number;
  memberName: string;
  titleMode?: 'weekly' | 'fixed14' | string;
}) {
  const cycleLength = cycleLengthFromRange(startDate, endDate);
  const filledDays = filledWeekdaysFromDayCarts(dayCarts);
  const entries: Record<string, unknown>[] = [];

  filledDays.forEach((day) => {
    const time = daySessionTimes[day] || DEFAULT_SESSION_TIME;
    const cart = dayCarts[day] || [];
    cart.forEach((e, i) => {
      entries.push(
        normalizeCartEntry(e, i, {
          day,
          start: time.start,
          end: time.end,
        }),
      );
    });
  });

  return {
    title: buildCoachProgramTitle(memberName, startDate, endDate, titleMode),
    description: String(description || '').trim(),
    sessionDuration,
    scheduleType: 'weekly' as const,
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    entries,
    items: entries.map(entryToDisplayText),
  };
}

export { CYCLE_PLAN_LENGTH };
