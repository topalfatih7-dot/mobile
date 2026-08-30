/**
 * Web parity: Adsız `src/components/package/WeeklyAvailability.jsx`
 * Saat aralığı 08:00–22:00 (DAY_START/DAY_END).
 */
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SelectSheet } from '@/components/ui/SelectSheet';
import { colors, fonts, radius, spacing } from '@/theme';

/** Web `services/availability` — Pazartesi önce */
export const STAFF_AVAILABILITY_WEEKDAYS = [
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
  { value: 0, label: 'Pazar', short: 'Paz' },
] as const;

const DAY_START = 8;
const DAY_END = 22;
const DEFAULT_RANGE = { start: 9, end: 17 };
const START_OPTIONS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

function fmt(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function dayKey(day: number) {
  return String(day);
}

function hoursForDay(value: Record<string, string[]>, day: number): string[] {
  const key = dayKey(day);
  const list = value[key] ?? (value as Record<number, string[]>)[day];
  return Array.isArray(list) ? list.map(String) : [];
}

export function hoursToRange(hours?: string[] | null) {
  if (!hours?.length) return null;
  const nums = hours
    .map((h) => Number.parseInt(h, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (!nums.length) return null;
  return { start: nums[0], end: nums[nums.length - 1] + 1 };
}

export function rangeToHours(start: number, end: number) {
  const out: string[] = [];
  for (let h = start; h < end; h += 1) out.push(fmt(h));
  return out;
}

export function countAvailabilitySlots(value: Record<string, string[]> = {}) {
  return Object.values(value).reduce((sum, hours) => sum + (hours?.length || 0), 0);
}

type Props = {
  value?: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  hint?: string;
};

export function WeeklyAvailability({
  value = {},
  onChange,
  hint = 'Danışanlar yalnızca burada seçtiğiniz gün ve saatlerden randevu alabilir.',
}: Props) {
  const total = countAvailabilitySlots(value);
  const [picker, setPicker] = useState<{
    day: number;
    field: 'start' | 'end';
  } | null>(null);

  const toggleDay = (day: number) => {
    const key = dayKey(day);
    const updated = { ...value };
    if (hoursForDay(updated, day).length) {
      delete updated[key];
    } else {
      updated[key] = rangeToHours(DEFAULT_RANGE.start, DEFAULT_RANGE.end);
    }
    onChange(updated);
  };

  const setRange = (day: number, patch: { start?: number; end?: number }) => {
    const key = dayKey(day);
    const current = hoursToRange(hoursForDay(value, day)) || { ...DEFAULT_RANGE };
    let start = patch.start ?? current.start;
    let end = patch.end ?? current.end;
    if (end <= start) end = start + 1;
    onChange({ ...value, [key]: rangeToHours(start, end) });
  };

  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const range = hoursToRange(hoursForDay(value, picker.day)) || { ...DEFAULT_RANGE };
    if (picker.field === 'start') {
      return START_OPTIONS.map((h) => ({ value: String(h), label: fmt(h) }));
    }
    return START_OPTIONS.filter((h) => h >= range.start)
      .map((h) => h + 1)
      .map((h) => ({ value: String(h), label: fmt(h) }));
  }, [picker, value]);

  return (
    <View style={styles.wrap}>
      <View style={styles.presets}>
        <Pressable
          onPress={() => {
            const updated = { ...value };
            ;[1, 2, 3, 4, 5].forEach((d) => {
              updated[dayKey(d)] = rangeToHours(9, 17);
            });
            onChange(updated);
          }}
          style={styles.preset}>
          <Text style={styles.presetText}>Hafta içi 09:00–17:00</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const updated = { ...value };
            ;[1, 2, 3, 4, 5, 6, 0].forEach((d) => {
              updated[dayKey(d)] = rangeToHours(18, 22);
            });
            onChange(updated);
          }}
          style={styles.preset}>
          <Text style={styles.presetText}>Her gün akşam 18:00–22:00</Text>
        </Pressable>
        <Pressable onPress={() => onChange({})} style={styles.clear}>
          <Ionicons color={colors.danger[600]} name="trash-outline" size={14} />
          <Text style={styles.clearText}>Temizle</Text>
        </Pressable>
      </View>

      <View style={styles.days}>
        {STAFF_AVAILABILITY_WEEKDAYS.map((d) => {
          const range = hoursToRange(hoursForDay(value, d.value));
          const active = Boolean(range);
          const cur = range || DEFAULT_RANGE;
          return (
            <View key={d.value} style={[styles.dayRow, active && styles.dayRowOn]}>
              <Pressable onPress={() => toggleDay(d.value)} style={styles.dayToggle}>
                <View style={[styles.check, active && styles.checkOn]}>
                  {active ? (
                    <Ionicons color={colors.white} name="checkmark" size={13} />
                  ) : null}
                </View>
                <Text style={styles.dayLabel}>{d.label}</Text>
              </Pressable>
              {active ? (
                <View style={styles.range}>
                  <Pressable
                    onPress={() => setPicker({ day: d.value, field: 'start' })}
                    style={styles.timeBtn}>
                    <Text style={styles.timeText}>{fmt(cur.start)}</Text>
                  </Pressable>
                  <Text style={styles.dash}>—</Text>
                  <Pressable
                    onPress={() => setPicker({ day: d.value, field: 'end' })}
                    style={styles.timeBtn}>
                    <Text style={styles.timeText}>{fmt(cur.end)}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.unavailable}>Bu gün uygun değilim</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.summary}>
        <Ionicons color={colors.brand[500]} name="calendar-outline" size={15} />
        <Text style={styles.summaryText}>{hint}</Text>
        {total > 0 ? <Text style={styles.summaryCount}>{total} saat</Text> : null}
      </View>

      <SelectSheet
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          if (!picker) return;
          const n = Number(v);
          if (picker.field === 'start') setRange(picker.day, { start: n });
          else setRange(picker.day, { end: n });
          setPicker(null);
        }}
        options={pickerOptions}
        title={picker?.field === 'start' ? 'Başlangıç' : 'Bitiş'}
        value={
          picker
            ? String(
                (hoursToRange(hoursForDay(value, picker.day)) || DEFAULT_RANGE)[
                  picker.field
                ],
              )
            : undefined
        }
        visible={Boolean(picker)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  clear: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.danger[600] },
  days: { gap: 10 },
  dayRow: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 10,
  },
  dayRowOn: {
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  dayToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cream[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  dayLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  range: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900] },
  dash: { fontFamily: fonts.sans, color: colors.cream[300] },
  unavailable: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[300] },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[50],
    padding: spacing.md,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    lineHeight: 17,
  },
  summaryCount: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600] },
});
