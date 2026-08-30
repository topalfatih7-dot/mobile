/**
 * LOCK: docs/mobile/domains/engagement-reminders.md
 * Yerel DATE trigger — listeye yazılmaz. 7 gün, her açılışta iptal+kur.
 */
import { addDays, format, startOfDay } from 'date-fns';
import { Platform } from 'react-native';

import { isCoreHealthTestComplete } from '@/data/coreHealthTest';
import { pickFallbackTip } from '@/data/dailyTipFallback';
import {
  pickDailyTipCopy,
  pickHabitCopy,
  pickProgramMealCopy,
  pickProgramWorkoutCopy,
  type HabitAction,
} from '@/data/engagementReminderCopy';
import { isPaidMembership } from '@/data/membershipPlans';
import { fetchDailyTip } from '@/services/dailyTip';
import { isReminderNotificationsEnabled } from '@/services/notificationSound';
import {
  androidNotificationChannelId,
  ensureNotificationChannel,
  hasGrantedNotificationPermission,
  notificationContentSound,
} from '@/services/push';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import {
  completionKey,
  getProgramEntriesForDate,
  groupEntriesByMeal,
  isMealCompleted,
  MEAL_TYPES,
  splitEntriesByType,
} from '@/utils/programSchedule';

const HABIT_PREFIX = 'yf-habit-';
const PROG_PREFIX = 'yf-prog-';
const HORIZON_DAYS = 7;
const SKIP_AHEAD_MS = 20 * 60 * 1000;
/** iOS pending local notification tavanı 64 — program + habit birlikte. */
const MAX_SCHEDULED = 60;

let lastEngagementFingerprint = '';
let syncGeneration = 0;

export function engagementFingerprint(
  member: Record<string, unknown> | null | undefined,
  programs: unknown[],
): string {
  if (!member?.id) return '';
  try {
    return JSON.stringify({
      day: format(startOfDay(new Date()), 'yyyy-MM-dd'),
      id: String(member.id),
      membership: member.membership ?? null,
      settings: member.settings ?? null,
      completedActivities: member.completedActivities ?? null,
      healthTest: member.healthTest ?? null,
      gender: member.gender ?? null,
      programs: programs ?? [],
    });
  } catch {
    return '';
  }
}

type NotificationsMod = typeof import('expo-notifications');
let notificationsMod: NotificationsMod | null | undefined;

async function loadNotifications(): Promise<NotificationsMod | null> {
  if (notificationsMod !== undefined) return notificationsMod;
  if (Platform.OS === 'web') {
    notificationsMod = null;
    return null;
  }
  try {
    notificationsMod = await import('expo-notifications');
    return notificationsMod;
  } catch {
    notificationsMod = null;
    return null;
  }
}

type SlotKind =
  | 'motivation'
  | 'daily_tip'
  | 'water'
  | 'midday'
  | 'water_mid'
  | 'water_pm'
  | 'evening'
  | 'evening_motivation'
  | 'streak';

const SLOT_HOURS: { kind: SlotKind; hour: number; minute: number }[] = [
  { kind: 'motivation', hour: 8, minute: 30 },
  { kind: 'daily_tip', hour: 9, minute: 0 },
  { kind: 'water', hour: 10, minute: 30 },
  { kind: 'midday', hour: 12, minute: 30 },
  { kind: 'water_mid', hour: 14, minute: 0 },
  { kind: 'water_pm', hour: 16, minute: 0 },
  { kind: 'evening', hour: 18, minute: 30 },
  { kind: 'evening_motivation', hour: 20, minute: 0 },
  { kind: 'streak', hour: 21, minute: 0 },
];

export type DayTaskState = {
  hasMeal: boolean;
  mealIncomplete: boolean;
  mealNoneStarted: boolean;
  hasWorkout: boolean;
  workoutIncomplete: boolean;
  workoutNoneStarted: boolean;
  coreHealthIncomplete: boolean;
};

export type ProgramScheduleItem = {
  identifier: string;
  action: 'habit_program_meal' | 'habit_program_workout';
  fire: Date;
  title: string;
  body: string;
};

export function parseEntryStart(start: unknown): { hour: number; minute: number } | null {
  const m = String(start || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** 22:00–08:00 sessiz (08:00 dahil, 22:00 hariç). */
export function isQuietLocalHour(hour: number): boolean {
  return hour < 8 || hour >= 22;
}

function mealShortLabel(mealType: string): string {
  const row = (MEAL_TYPES as { id: string; short?: string; label: string }[]).find(
    (m) => m.id === mealType,
  );
  return row?.short || row?.label || 'Öğün';
}

export function dayTaskState(
  date: Date,
  programs: unknown[],
  member: Record<string, unknown> | null | undefined,
): DayTaskState {
  const dateStr = format(date, 'yyyy-MM-dd');
  const completed =
    (member?.completedActivities as Record<string, string[]>) || {};
  const entries = getProgramEntriesForDate(programs as never, date, member as never);
  const { workout, nutrition } = splitEntriesByType(entries);
  const mealGroups = groupEntriesByMeal(nutrition.filter((e: { mealType?: string }) => e.mealType !== 'note'));
  const keys = completed[dateStr] || [];
  const mealIncomplete = mealGroups.some(
    (g: { mealType: string; entries: { id?: string }[] }) =>
      !isMealCompleted(completed, dateStr, g.mealType, g.entries),
  );
  const anyMealDone = mealGroups.some(
    (g: { mealType: string; entries: { id?: string }[] }) =>
      isMealCompleted(completed, dateStr, g.mealType, g.entries),
  );
  const workoutIncomplete = (workout || []).some(
    (e: { id?: string }) => e.id && !keys.includes(completionKey(dateStr, e.id)),
  );
  const anyWorkoutDone = (workout || []).some(
    (e: { id?: string }) => e.id && keys.includes(completionKey(dateStr, e.id)),
  );
  const gender = member?.gender ? String(member.gender) : null;
  const ht = (member?.healthTest as Record<string, unknown>) || {};
  const hasMeal = mealGroups.length > 0;
  const hasWorkout = (workout || []).length > 0;
  return {
    hasMeal,
    mealIncomplete,
    mealNoneStarted: hasMeal && !anyMealDone,
    hasWorkout,
    workoutIncomplete,
    workoutNoneStarted: hasWorkout && !anyWorkoutDone,
    coreHealthIncomplete: !isCoreHealthTestComplete(ht, gender),
  };
}

export function resolveSlotAction(
  kind: SlotKind,
  unpaid: boolean,
  day: DayTaskState,
  middaySubstituteFired: boolean,
  allowPurchaseNudge = true,
  hasProgramMealNotif = false,
  hasProgramWorkoutNotif = false,
): HabitAction | null {
  if (kind === 'motivation') return 'habit_motivation';
  if (kind === 'evening_motivation') {
    if (!unpaid && (day.hasMeal || day.hasWorkout)) {
      const mealIdle = !day.hasMeal || day.mealNoneStarted;
      const workoutIdle = !day.hasWorkout || day.workoutNoneStarted;
      if (mealIdle && workoutIdle) return 'habit_no_activity';
    }
    return 'habit_motivation';
  }
  if (kind === 'daily_tip') return 'habit_daily_tip';
  if (kind === 'water' || kind === 'water_mid' || kind === 'water_pm') return 'habit_water';
  if (kind === 'midday') {
    if (!unpaid && hasProgramMealNotif) return null;
    if (!unpaid && day.hasMeal && day.mealIncomplete) return 'habit_meal';
    if (unpaid && day.coreHealthIncomplete) return 'habit_health';
    if (unpaid) return allowPurchaseNudge ? 'habit_upsell' : null;
    return null;
  }
  if (kind === 'evening') {
    if (!unpaid && hasProgramWorkoutNotif) return null;
    if (!unpaid && day.hasWorkout && day.workoutIncomplete) return 'habit_workout';
    if (unpaid) {
      if (middaySubstituteFired) return null;
      if (day.coreHealthIncomplete) return 'habit_health';
      return allowPurchaseNudge ? 'habit_upsell' : null;
    }
    return null;
  }
  if (kind === 'streak') {
    if (unpaid) return null;
    const leftover =
      (day.hasMeal && day.mealIncomplete) ||
      (day.hasWorkout && day.workoutIncomplete);
    return leftover ? 'habit_streak' : null;
  }
  return null;
}

function atLocal(day: Date, hour: number, minute: number) {
  const d = startOfDay(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function habitIdentifier(action: HabitAction, dateStr: string, kind: string) {
  return `${HABIT_PREFIX}${kind}-${action}-${dateStr}`;
}

export function programIdentifier(kind: 'meal' | 'wo', key: string, dateStr: string) {
  return `${PROG_PREFIX}${kind}-${key}-${dateStr}`;
}

export function buildProgramScheduleNotifications(opts: {
  date: Date;
  programs: unknown[];
  member: Record<string, unknown> | null | undefined;
  minFireMs: number;
}): ProgramScheduleItem[] {
  const { date, programs, member, minFireMs } = opts;
  const dateStr = format(date, 'yyyy-MM-dd');
  const completed =
    (member?.completedActivities as Record<string, string[]>) || {};
  const keys = completed[dateStr] || [];
  const entries = getProgramEntriesForDate(programs as never, date, member as never);
  const { workout, nutrition } = splitEntriesByType(entries);
  const mealGroups = groupEntriesByMeal(
    nutrition.filter((e: { mealType?: string }) => e.mealType !== 'note'),
  );
  const items: ProgramScheduleItem[] = [];

  for (const g of mealGroups as {
    mealType: string;
    entries: { id?: string; start?: string; programTitle?: string }[];
  }[]) {
    if (isMealCompleted(completed, dateStr, g.mealType, g.entries)) continue;
    const starts = g.entries
      .map((e) => parseEntryStart(e.start))
      .filter((hm): hm is { hour: number; minute: number } => Boolean(hm))
      .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    if (!starts.length) continue;
    const hm = starts[0];
    if (isQuietLocalHour(hm.hour)) continue;
    const fire = atLocal(date, hm.hour, hm.minute);
    if (fire.getTime() < minFireMs) continue;
    const copy = pickProgramMealCopy(
      dateStr,
      mealShortLabel(g.mealType),
      g.entries[0]?.programTitle,
    );
    items.push({
      identifier: programIdentifier('meal', g.mealType, dateStr),
      action: 'habit_program_meal',
      fire,
      title: copy.title,
      body: copy.body,
    });
  }

  const byStart = new Map<
    string,
    { hm: { hour: number; minute: number }; title?: string }
  >();
  for (const e of workout as { id?: string; start?: string; programTitle?: string }[]) {
    if (!e.id || keys.includes(completionKey(dateStr, e.id))) continue;
    const hm = parseEntryStart(e.start);
    if (!hm || isQuietLocalHour(hm.hour)) continue;
    const key = `${String(hm.hour).padStart(2, '0')}${String(hm.minute).padStart(2, '0')}`;
    if (!byStart.has(key)) byStart.set(key, { hm, title: e.programTitle });
  }
  for (const [key, slot] of byStart) {
    const fire = atLocal(date, slot.hm.hour, slot.hm.minute);
    if (fire.getTime() < minFireMs) continue;
    const copy = pickProgramWorkoutCopy(dateStr, slot.title);
    items.push({
      identifier: programIdentifier('wo', key, dateStr),
      action: 'habit_program_workout',
      fire,
      title: copy.title,
      body: copy.body,
    });
  }

  return items;
}

export function resetEngagementSyncCache() {
  lastEngagementFingerprint = '';
  syncGeneration += 1;
}

export async function cancelHabitReminders(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => {
          const id = String(n.identifier || '');
          return id.startsWith(HABIT_PREFIX) || id.startsWith(PROG_PREFIX);
        })
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
}

async function scheduleLocal(opts: {
  Notifications: NotificationsMod;
  identifier: string;
  title: string;
  body: string;
  action: HabitAction;
  fire: Date;
}): Promise<void> {
  const Schedulable = opts.Notifications.SchedulableTriggerInputTypes;
  await opts.Notifications.scheduleNotificationAsync({
    identifier: opts.identifier,
    content: {
      title: opts.title,
      body: opts.body,
      data: { type: 'reminder', action: opts.action },
      sound: notificationContentSound() || undefined,
      ...(Platform.OS === 'android'
        ? { channelId: androidNotificationChannelId() }
        : {}),
    },
    trigger: {
      type: Schedulable.DATE,
      date: opts.fire,
      ...(Platform.OS === 'android'
        ? { channelId: androidNotificationChannelId() }
        : {}),
    },
  });
}

export async function syncEngagementReminders(opts: {
  member: Record<string, unknown> | null | undefined;
  programs: unknown[];
}): Promise<void> {
  if (Platform.OS === 'web') return;
  const fp = engagementFingerprint(opts.member, opts.programs);
  if (fp && fp === lastEngagementFingerprint) return;

  const gen = ++syncGeneration;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  if (gen !== syncGeneration) return;

  const member = opts.member;
  if (!member?.id) {
    await cancelHabitReminders();
    return;
  }
  const settings = (member.settings || {}) as Record<string, unknown>;
  if (!isReminderNotificationsEnabled(settings)) {
    await cancelHabitReminders();
    if (gen === syncGeneration) lastEngagementFingerprint = fp;
    return;
  }

  // İzin yokken mevcut zilleri silme — sohbet satırı her güncellenince
  // getPermissions kısa süre false dönerse su/antrenman zilleri yok oluyordu.
  if (!(await hasGrantedNotificationPermission())) return;
  if (gen !== syncGeneration) return;

  await cancelHabitReminders();
  if (gen !== syncGeneration) return;

  const unpaid = !isPaidMembership(String(member.membership || 'free'));
  const now = Date.now();
  const minFire = now + SKIP_AHEAD_MS;

  await ensureNotificationChannel();

  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  let todayTip = '';
  try {
    const tipResult = await fetchDailyTip();
    if (tipResult.tip) todayTip = String(tipResult.tip).trim();
  } catch {
    todayTip = '';
  }

  const pending: {
    identifier: string;
    title: string;
    body: string;
    action: HabitAction;
    fire: Date;
  }[] = [];

  for (let i = 0; i < HORIZON_DAYS; i += 1) {
    const day = addDays(startOfDay(new Date()), i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const state = dayTaskState(day, opts.programs || [], member);
    const programItems = buildProgramScheduleNotifications({
      date: day,
      programs: opts.programs || [],
      member,
      minFireMs: minFire,
    });
    const hasProgramMealNotif = programItems.some((p) => p.action === 'habit_program_meal');
    const hasProgramWorkoutNotif = programItems.some(
      (p) => p.action === 'habit_program_workout',
    );

    for (const item of programItems) {
      pending.push({
        identifier: item.identifier,
        title: item.title,
        body: item.body,
        action: item.action,
        fire: item.fire,
      });
    }

    let middaySubstituteFired = false;

    for (const slot of SLOT_HOURS) {
      const fire = atLocal(day, slot.hour, slot.minute);
      if (fire.getTime() < minFire) continue;
      const action = resolveSlotAction(
        slot.kind,
        unpaid,
        state,
        middaySubstituteFired,
        canOfferWebPurchase(),
        hasProgramMealNotif,
        hasProgramWorkoutNotif,
      );
      if (!action) continue;
      if (slot.kind === 'midday' && unpaid) middaySubstituteFired = true;

      const copy =
        action === 'habit_daily_tip'
          ? pickDailyTipCopy(
              dateStr,
              dateStr === todayStr ? todayTip : pickFallbackTip(dateStr),
            )
          : pickHabitCopy(action, dateStr);
      pending.push({
        identifier: habitIdentifier(action, dateStr, slot.kind),
        title: copy.title,
        body: copy.body,
        action,
        fire,
      });
    }
  }

  pending.sort((a, b) => a.fire.getTime() - b.fire.getTime());
  const toSchedule = pending.slice(0, MAX_SCHEDULED);

  for (const item of toSchedule) {
    if (gen !== syncGeneration) return;
    try {
      await scheduleLocal({
        Notifications,
        identifier: item.identifier,
        title: item.title,
        body: item.body,
        action: item.action,
        fire: item.fire,
      });
    } catch {
      /* ignore per-slot */
    }
  }

  if (gen === syncGeneration) lastEngagementFingerprint = fp;
}
