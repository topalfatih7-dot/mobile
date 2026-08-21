/**
 * LOCK: docs/mobile/domains/engagement-reminders.md
 * Yerel DATE trigger — listeye yazılmaz. 7 gün, her açılışta iptal+kur.
 */
import { addDays, format, startOfDay } from 'date-fns';
import { Platform } from 'react-native';

import { isUiOnly } from '@/config/runtime';
import { isCoreHealthTestComplete } from '@/data/coreHealthTest';
import { pickFallbackTip } from '@/data/dailyTipFallback';
import {
  pickDailyTipCopy,
  pickHabitCopy,
  type HabitAction,
} from '@/data/engagementReminderCopy';
import { isPaidMembership } from '@/data/membershipPlans';
import { fetchDailyTip } from '@/services/dailyTip';
import { isReminderNotificationsEnabled } from '@/services/notificationSound';
import {
  androidNotificationChannelId,
  ensureNotificationChannel,
  notificationContentSound,
} from '@/services/push';
import {
  completionKey,
  getProgramEntriesForDate,
  groupEntriesByMeal,
  isMealCompleted,
  splitEntriesByType,
} from '@/utils/programSchedule';

const HABIT_PREFIX = 'yf-habit-';
const HORIZON_DAYS = 7;
const SKIP_AHEAD_MS = 20 * 60 * 1000;

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
  hasWorkout: boolean;
  workoutIncomplete: boolean;
  coreHealthIncomplete: boolean;
};

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
  const workoutIncomplete = (workout || []).some(
    (e: { id?: string }) => e.id && !keys.includes(completionKey(dateStr, e.id)),
  );
  const gender = member?.gender ? String(member.gender) : null;
  const ht = (member?.healthTest as Record<string, unknown>) || {};
  return {
    hasMeal: mealGroups.length > 0,
    mealIncomplete,
    hasWorkout: (workout || []).length > 0,
    workoutIncomplete,
    coreHealthIncomplete: !isCoreHealthTestComplete(ht, gender),
  };
}

export function resolveSlotAction(
  kind: SlotKind,
  unpaid: boolean,
  day: DayTaskState,
  middaySubstituteFired: boolean,
): HabitAction | null {
  if (kind === 'motivation' || kind === 'evening_motivation') return 'habit_motivation';
  if (kind === 'daily_tip') return 'habit_daily_tip';
  if (kind === 'water' || kind === 'water_mid' || kind === 'water_pm') return 'habit_water';
  if (kind === 'midday') {
    if (!unpaid && day.hasMeal && day.mealIncomplete) return 'habit_meal';
    if (unpaid && day.coreHealthIncomplete) return 'habit_health';
    if (unpaid) return 'habit_upsell';
    return null;
  }
  if (kind === 'evening') {
    if (!unpaid && day.hasWorkout && day.workoutIncomplete) return 'habit_workout';
    if (unpaid) {
      if (middaySubstituteFired) return null;
      return day.coreHealthIncomplete ? 'habit_health' : 'habit_upsell';
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

export async function cancelHabitReminders(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => String(n.identifier || '').startsWith(HABIT_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
}

export async function syncEngagementReminders(opts: {
  member: Record<string, unknown> | null | undefined;
  programs: unknown[];
}): Promise<void> {
  if (Platform.OS === 'web' || isUiOnly()) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await cancelHabitReminders();

  const member = opts.member;
  if (!member?.id) return;
  const settings = (member.settings || {}) as Record<string, unknown>;
  if (!isReminderNotificationsEnabled(settings)) return;

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

  const Schedulable = Notifications.SchedulableTriggerInputTypes;

  for (let i = 0; i < HORIZON_DAYS; i += 1) {
    const day = addDays(startOfDay(new Date()), i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const state = dayTaskState(day, opts.programs || [], member);
    let middaySubstituteFired = false;

    for (const slot of SLOT_HOURS) {
      const fire = atLocal(day, slot.hour, slot.minute);
      if (fire.getTime() < minFire) continue;
      const action = resolveSlotAction(
        slot.kind,
        unpaid,
        state,
        middaySubstituteFired,
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
      const identifier = habitIdentifier(action, dateStr, slot.kind);
      try {
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: copy.title,
            body: copy.body,
            data: { type: 'reminder', action },
            sound: notificationContentSound(),
            ...(Platform.OS === 'android'
              ? { channelId: androidNotificationChannelId() }
              : {}),
          },
          trigger: {
            type: Schedulable.DATE,
            date: fire,
            ...(Platform.OS === 'android'
              ? { channelId: androidNotificationChannelId() }
              : {}),
          },
        });
      } catch {
        /* ignore per-slot */
      }
    }
  }
}
