import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ageFromBirthDate } from '@/utils/birthDate';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  label?: string;
  value?: string;
  onChange?: (isoDate: string) => void;
  error?: string;
  hint?: string;
  /** Parent already a RN Modal — nested Modal iOS’ta açılmaz. */
  embedded?: boolean;
};

type WheelOption = { value: string; label: string };

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

const WHEEL_ROW = 44;
const WHEEL_VISIBLE = 5;
const WHEEL_HEIGHT = WHEEL_ROW * WHEEL_VISIBLE;
const WHEEL_PAD = WHEEL_ROW * 2;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  try {
    const iso = value.length === 10 ? `${value}T12:00:00` : value;
    const d = parseISO(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function DateWheelColumn({
  options,
  value,
  onChange,
}: {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );

  useEffect(() => {
    const y = index * WHEEL_ROW;
    const id = requestAnimationFrame(() => {
      ref.current?.scrollTo({ y, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [index, options.length]);

  const commitY = (y: number) => {
    if (!options.length) return;
    const nextIndex = Math.max(
      0,
      Math.min(options.length - 1, Math.round(y / WHEEL_ROW)),
    );
    const next = options[nextIndex];
    if (next && next.value !== value) onChange(next.value);
  };

  return (
    <View style={styles.wheelCol}>
      <ScrollView
        ref={ref}
        contentContainerStyle={styles.wheelContent}
        contentOffset={{ x: 0, y: index * WHEEL_ROW }}
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        onMomentumScrollEnd={(e) => commitY(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          const vy = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(vy) < 0.2) commitY(e.nativeEvent.contentOffset.y);
        }}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={WHEEL_ROW}
        style={styles.wheelScroll}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={styles.wheelItem}>
              <Text
                numberOfLines={1}
                style={[styles.wheelItemText, selected && styles.wheelItemTextOn]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.wheelHighlight} />
    </View>
  );
}

/**
 * Web BirthDateField parity — Expo Go uyumlu (native DateTimePicker yok).
 * Gün / ay / yıl aynı sheet içinde kaydırılır; ikinci Modal açılmaz (iOS nested Modal kırılır).
 */
export function BirthDateField({
  label = 'Doğum Tarihi',
  value = '',
  onChange,
  error,
  hint,
  embedded = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const today = new Date();
  const maxYear = today.getFullYear() - 13;
  const minYear = today.getFullYear() - 100;

  const selected = useMemo(() => parseValue(value), [value]);

  const [draftYear, setDraftYear] = useState(selected?.getFullYear() ?? 2000);
  const [draftMonth, setDraftMonth] = useState(selected?.getMonth() ?? 0);
  const [draftDay, setDraftDay] = useState(selected?.getDate() ?? 1);

  const openEditor = () => {
    Keyboard.dismiss();
    const base = selected || new Date(2000, 0, 1);
    setDraftYear(base.getFullYear());
    setDraftMonth(base.getMonth());
    setDraftDay(base.getDate());
    setOpen(true);
  };

  const closeEditor = () => setOpen(false);

  const maxDay = daysInMonth(draftYear, draftMonth);
  const safeDay = Math.min(draftDay, maxDay);

  const yearOptions = useMemo(() => {
    const list: WheelOption[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push({ value: String(y), label: String(y) });
    }
    return list;
  }, [maxYear, minYear]);

  const monthOptions = useMemo(
    () => MONTHS.map((monthLabel, i) => ({ value: String(i), label: monthLabel })),
    [],
  );

  const dayOptions = useMemo(
    () =>
      Array.from({ length: maxDay }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    [maxDay],
  );

  const display = selected
    ? format(selected, 'd MMMM yyyy', { locale: tr })
    : 'Tarih seçin';
  const age = selected ? ageFromBirthDate(toISO(selected.getFullYear(), selected.getMonth(), selected.getDate())) : null;
  const previewAge = ageFromBirthDate(toISO(draftYear, draftMonth, safeDay));

  const confirm = () => {
    const day = Math.min(draftDay, daysInMonth(draftYear, draftMonth));
    onChange?.(toISO(draftYear, draftMonth, day));
    setOpen(false);
  };

  const editor = (
    <>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Doğum Tarihi</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={confirm}
          style={styles.doneHit}>
          <Text style={styles.done}>Tamam</Text>
        </Pressable>
      </View>

      <View style={styles.wheelHead}>
        <Text style={styles.wheelHeadLabel}>Gün</Text>
        <Text style={styles.wheelHeadLabel}>Ay</Text>
        <Text style={styles.wheelHeadLabel}>Yıl</Text>
      </View>
      <View style={styles.wheels}>
        <DateWheelColumn
          onChange={(v) => setDraftDay(Number(v))}
          options={dayOptions}
          value={String(safeDay)}
        />
        <DateWheelColumn
          onChange={(v) => {
            const m = Number(v);
            setDraftMonth(m);
            setDraftDay((d) => Math.min(d, daysInMonth(draftYear, m)));
          }}
          options={monthOptions}
          value={String(draftMonth)}
        />
        <DateWheelColumn
          onChange={(v) => {
            const y = Number(v);
            setDraftYear(y);
            setDraftDay((d) => Math.min(d, daysInMonth(y, draftMonth)));
          }}
          options={yearOptions}
          value={String(draftYear)}
        />
      </View>

      {previewAge != null ? (
        <Text style={styles.previewAge}>{previewAge} yaş</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={confirm}
        style={styles.confirmBtn}>
        <Text style={styles.confirmBtnText}>Tarihi onayla</Text>
      </Pressable>
    </>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
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

      {embedded ? (
        open ? <View style={styles.inlinePicker}>{editor}</View> : null
      ) : (
        <Modal
          animationType="slide"
          onRequestClose={closeEditor}
          presentationStyle="overFullScreen"
          statusBarTranslucent={Platform.OS === 'android'}
          transparent
          visible={open}>
          <View style={styles.backdrop}>
            <Pressable
              accessibilityLabel="Kapat"
              accessibilityRole="button"
              onPress={closeEditor}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
              ]}>
              {editor}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  inlinePicker: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
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
    zIndex: 1,
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
  doneHit: { minHeight: 44, minWidth: 64, alignItems: 'flex-end', justifyContent: 'center' },
  done: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  wheelHead: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  wheelHeadLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
    textTransform: 'uppercase',
  },
  wheels: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  wheelCol: {
    flex: 1,
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
  },
  wheelScroll: { flex: 1, backgroundColor: 'transparent' },
  wheelContent: {
    paddingVertical: WHEEL_PAD,
  },
  wheelItem: {
    height: WHEEL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wheelItemText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.cream[800],
    opacity: 0.45,
  },
  wheelItemTextOn: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    color: colors.cream[900],
    opacity: 1,
  },
  wheelHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_PAD,
    height: WHEEL_ROW,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brand[300],
    backgroundColor: 'rgba(240,247,251,0.35)',
  },
  previewAge: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.65,
  },
  confirmBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    minHeight: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.white,
  },
});
