import { format, parseISO, isValid, addDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OverlayPortalProvider } from '@/components/ui/OverlayPortal';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (iso: string) => void;
  /** Parent already a RN Modal — nested Modal iOS’ta açılmaz. */
  embedded?: boolean;
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

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toISO(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseSafe(iso?: string) {
  if (!iso) return null;
  try {
    const d = startOfDay(parseISO(`${iso}T12:00:00`));
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Expo Go uyumlu tarih alanı — BirthDateField benzeri gün/ay/yıl SelectSheet.
 * Program süresi için min/max paket sınırları uygulanır.
 */
export function PlanDateField({
  label,
  value,
  min,
  max,
  onChange,
  embedded = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<'day' | 'month' | 'year' | null>(null);

  const selected = parseSafe(value);
  const minD = parseSafe(min) || new Date();
  const maxD = parseSafe(max) || addDays(new Date(), 365);

  const [draftYear, setDraftYear] = useState(selected?.getFullYear() ?? minD.getFullYear());
  const [draftMonth, setDraftMonth] = useState(selected?.getMonth() ?? minD.getMonth());
  const [draftDay, setDraftDay] = useState(selected?.getDate() ?? minD.getDate());

  const openEditor = () => {
    const base = selected || minD;
    setDraftYear(base.getFullYear());
    setDraftMonth(base.getMonth());
    setDraftDay(base.getDate());
    setOpen(true);
  };

  const maxDay = daysInMonth(draftYear, draftMonth);
  const safeDay = Math.min(draftDay, maxDay);

  const yearOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    for (let y = minD.getFullYear(); y <= maxD.getFullYear(); y += 1) {
      list.push({ value: String(y), label: String(y) });
    }
    return list;
  }, [minD, maxD]);

  const monthOptions = MONTHS.map((m, i) => ({ value: String(i), label: m }));
  const dayOptions = Array.from({ length: maxDay }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const commit = () => {
    let iso = toISO(draftYear, draftMonth, safeDay);
    if (min && iso < min) iso = min;
    if (max && iso > max) iso = max;
    onChange(iso);
    setOpen(false);
  };

  const display = selected
    ? format(selected, 'd MMMM yyyy', { locale: tr })
    : 'Tarih seç';

  const pickers = (
    <View style={styles.row}>
      <Pressable onPress={() => setSheet('day')} style={styles.part}>
        <Text style={styles.partLabel}>Gün</Text>
        <Text style={styles.partValue}>{safeDay}</Text>
      </Pressable>
      <Pressable onPress={() => setSheet('month')} style={styles.part}>
        <Text style={styles.partLabel}>Ay</Text>
        <Text style={styles.partValue}>{MONTHS[draftMonth]}</Text>
      </Pressable>
      <Pressable onPress={() => setSheet('year')} style={styles.part}>
        <Text style={styles.partLabel}>Yıl</Text>
        <Text style={styles.partValue}>{draftYear}</Text>
      </Pressable>
    </View>
  );

  const selectSheets = (
    <SelectSheet
      embedded
      onClose={() => setSheet(null)}
      onSelect={(v) => {
        if (sheet === 'day') setDraftDay(Number(v));
        if (sheet === 'month') setDraftMonth(Number(v));
        if (sheet === 'year') setDraftYear(Number(v));
      }}
      options={
        sheet === 'day' ? dayOptions : sheet === 'month' ? monthOptions : yearOptions
      }
      title={sheet === 'day' ? 'Gün' : sheet === 'month' ? 'Ay' : 'Yıl'}
      value={
        sheet === 'day'
          ? String(safeDay)
          : sheet === 'month'
            ? String(draftMonth)
            : String(draftYear)
      }
      visible={sheet != null}
    />
  );

  return (
    <View>
      <Pressable onPress={openEditor} style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{display}</Text>
      </Pressable>

      {embedded ? (
        <>
          {open ? (
            <View style={styles.inlinePicker}>
              <View style={styles.inlineHeader}>
                <Text style={styles.sheetTitle}>{label}</Text>
                <Pressable onPress={commit}>
                  <Text style={styles.done}>Tamam</Text>
                </Pressable>
              </View>
              {pickers}
            </View>
          ) : null}
          {selectSheets}
        </>
      ) : (
        <Modal
          animationType="slide"
          onRequestClose={() => setOpen(false)}
          transparent
          visible={open}>
          <OverlayPortalProvider>
            <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
                <View style={styles.handle} />
                <Text style={styles.sheetTitle}>{label}</Text>
                {pickers}
                <Pressable onPress={commit} style={styles.ok}>
                  <Text style={styles.okText}>Tamam</Text>
                </Pressable>
              </Pressable>
            </Pressable>
            {selectSheets}
          </OverlayPortalProvider>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[100],
    padding: spacing.md,
    gap: 4,
  },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  inlinePicker: {
    marginTop: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    gap: spacing.md,
  },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  done: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream[300],
  },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  row: { flexDirection: 'row', gap: 8 },
  part: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.sm,
    minHeight: 64,
    justifyContent: 'center',
  },
  partLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], opacity: 0.6 },
  partValue: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900], marginTop: 2 },
  ok: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.white },
});
