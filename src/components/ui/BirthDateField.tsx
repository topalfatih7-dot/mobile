import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectSheet } from '@/components/ui/SelectSheet';
import { ageFromBirthDate } from '@/utils/birthDate';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  label?: string;
  value?: string;
  onChange?: (isoDate: string) => void;
  error?: string;
  hint?: string;
};

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/**
 * Web BirthDateField parity — Expo Go uyumlu (native DateTimePicker yok).
 * Gün / ay / yıl SelectSheet ile seçilir.
 */
export function BirthDateField({
  label = 'Doğum Tarihi',
  value = '',
  onChange,
  error,
  hint,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<'day' | 'month' | 'year' | null>(null);

  const today = new Date();
  const maxYear = today.getFullYear() - 13;
  const minYear = today.getFullYear() - 100;

  const selected = useMemo(() => {
    if (!value) return null;
    try {
      const d = parseISO(value);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }, [value]);

  const [draftYear, setDraftYear] = useState(selected?.getFullYear() ?? 2000);
  const [draftMonth, setDraftMonth] = useState(selected?.getMonth() ?? 0);
  const [draftDay, setDraftDay] = useState(selected?.getDate() ?? 1);

  const openEditor = () => {
    const base = selected || new Date(2000, 0, 1);
    setDraftYear(base.getFullYear());
    setDraftMonth(base.getMonth());
    setDraftDay(base.getDate());
    setOpen(true);
  };

  const maxDay = daysInMonth(draftYear, draftMonth);
  const safeDay = Math.min(draftDay, maxDay);

  const yearOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push({ value: String(y), label: String(y) });
    }
    return list;
  }, [maxYear, minYear]);

  const monthOptions = MONTHS.map((label, i) => ({
    value: String(i),
    label,
  }));

  const dayOptions = useMemo(() => {
    return Array.from({ length: maxDay }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }));
  }, [maxDay]);

  const display = selected
    ? format(selected, 'd MMMM yyyy', { locale: tr })
    : 'Tarih seçin';
  const age = selected ? ageFromBirthDate(format(selected, 'yyyy-MM-dd')) : null;

  const confirm = () => {
    const day = Math.min(draftDay, daysInMonth(draftYear, draftMonth));
    const iso = toISO(draftYear, draftMonth, day);
    // 13–100 yaş aralığı (birthDateError ile aynı sınırlar)
    const picked = parseISO(iso);
    const earliest = new Date(minYear, today.getMonth(), today.getDate());
    const latest = new Date(maxYear, today.getMonth(), today.getDate());
    if (picked < earliest || picked > latest) {
      // sınır dışıysa en yakın geçerli tarihe sıkıştırma yerine yine yaz;
      // validasyon birthDateError ile formda gösterilir
    }
    onChange?.(iso);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openEditor}
        style={[styles.field, error ? styles.fieldError : null]}>
        <View style={styles.iconChip}>
          <Ionicons color={colors.brand[600]} name="calendar-outline" size={18} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.value, !selected && styles.placeholder]}>{display}</Text>
          {age != null ? <Text style={styles.age}>{age} yaş</Text> : null}
        </View>
        <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
      </Pressable>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}

      <Modal animationType="slide" transparent visible={open}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Doğum Tarihi</Text>
              <Pressable onPress={confirm}>
                <Text style={styles.done}>Tamam</Text>
              </Pressable>
            </View>

            <View style={styles.pickers}>
              <Pressable onPress={() => setSheet('day')} style={styles.pickBtn}>
                <Text style={styles.pickLabel}>Gün</Text>
                <Text style={styles.pickValue}>{safeDay}</Text>
              </Pressable>
              <Pressable onPress={() => setSheet('month')} style={styles.pickBtn}>
                <Text style={styles.pickLabel}>Ay</Text>
                <Text style={styles.pickValue}>{MONTHS[draftMonth]}</Text>
              </Pressable>
              <Pressable onPress={() => setSheet('year')} style={styles.pickBtn}>
                <Text style={styles.pickLabel}>Yıl</Text>
                <Text style={styles.pickValue}>{draftYear}</Text>
              </Pressable>
            </View>

            {(() => {
              const previewAge = ageFromBirthDate(toISO(draftYear, draftMonth, safeDay));
              return previewAge != null ? (
                <Text style={styles.previewAge}>{previewAge} yaş</Text>
              ) : null;
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      <SelectSheet
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          setDraftDay(Number(v));
          setSheet(null);
        }}
        options={dayOptions}
        title="Gün"
        value={String(safeDay)}
        visible={sheet === 'day'}
      />
      <SelectSheet
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          const m = Number(v);
          setDraftMonth(m);
          setDraftDay((d) => Math.min(d, daysInMonth(draftYear, m)));
          setSheet(null);
        }}
        options={monthOptions}
        title="Ay"
        value={String(draftMonth)}
        visible={sheet === 'month'}
      />
      <SelectSheet
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          const y = Number(v);
          setDraftYear(y);
          setDraftDay((d) => Math.min(d, daysInMonth(y, draftMonth)));
          setSheet(null);
        }}
        options={yearOptions}
        title="Yıl"
        value={String(draftYear)}
        visible={sheet === 'year'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  field: {
    minHeight: 56,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldError: {
    borderColor: colors.danger[500],
    backgroundColor: colors.warm[50],
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  value: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.cream[900] },
  placeholder: { color: colors.cream[300] },
  age: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 2,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger[600] },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.55 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
  },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  done: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  pickers: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  pickBtn: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  pickLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
    textTransform: 'uppercase',
  },
  pickValue: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  previewAge: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.65,
  },
});
