// @ts-nocheck
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { AVAILABILITY_WEEKDAYS } from '@/utils/memberAvailability';
import {
  CYCLE_PLAN_LENGTH,
  dedupeDailyNutritionEntries,
  usesLegacyCycleDayRotation,
} from '@/utils/programSchedule';

export function amountText(e: {
  amountType?: string;
  amount?: number | string;
  durationUnit?: string;
}) {
  return e.amountType === 'duration'
    ? `${e.amount} ${e.durationUnit || 'sn'}`
    : `${e.amount} tekrar`;
}

function groupKey(e: Record<string, unknown>) {
  if (e.cycleDay != null && e.cycleDay !== '') return `cycle:${e.cycleDay}`;
  if (e.date) return `date:${e.date}`;
  if (e.day != null && e.day !== '') return `day:${e.day}`;
  return 'other';
}

function groupLabel(key: string, program: Record<string, unknown> | null = null) {
  if (key.startsWith('cycle:')) {
    const n = Number(key.slice(6));
    const len = Number(program?.cycleLength) || CYCLE_PLAN_LENGTH;
    return `Gün ${n + 1} / ${len}`;
  }
  if (key.startsWith('date:')) {
    const d = key.slice(5);
    try {
      return format(new Date(`${d}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr });
    } catch {
      return d;
    }
  }
  if (key.startsWith('day:')) {
    return AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(key.slice(4)))?.label || '';
  }
  return 'Diğer';
}

export function groupBySchedule(entries: Record<string, unknown>[] = [], program: Record<string, unknown> | null = null) {
  const sameDailyFixed =
    (program?.scheduleType === 'cycle14' || program?.scheduleType === 'dateRange') &&
    !usesLegacyCycleDayRotation(program);
  if (sameDailyFixed) {
    return [
      {
        key: 'daily',
        label:
          program?.type === 'nutrition'
            ? 'Günlük menü (her gün aynı)'
            : 'Günlük antrenman (her gün aynı)',
        items:
          program?.type === 'nutrition'
            ? dedupeDailyNutritionEntries(entries)
            : [...entries].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
      },
    ];
  }

  const groups: Record<string, Record<string, unknown>[]> = {};
  entries.forEach((e) => {
    const key = groupKey(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return Object.keys(groups)
    .sort((a, b) => {
      if (a.startsWith('cycle:') && b.startsWith('cycle:')) return Number(a.slice(6)) - Number(b.slice(6));
      if (a.startsWith('date:') && b.startsWith('date:')) return a.slice(5).localeCompare(b.slice(5));
      if (a.startsWith('day:') && b.startsWith('day:')) return Number(a.slice(4)) - Number(b.slice(4));
      return a.localeCompare(b);
    })
    .map((key) => ({
      key,
      label: groupLabel(key, program),
      items: [...groups[key]].sort((a, b) =>
        String(a.start || '').localeCompare(String(b.start || '')),
      ),
    }));
}
