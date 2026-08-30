import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { PlanDateField } from '@/components/staff/PlanDateField';
import { Button } from '@/components/ui/Button';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { OverlayPortalProvider } from '@/components/ui/OverlayPortal';
import { useToast } from '@/context/ToastContext';
import { getDateInputBounds } from '@/utils/programPackageScope';
import {
  summarizeRangeAvailability,
  formatRangeSummary,
  cycleLengthFromRange,
} from '@/utils/memberAvailability';
import { CYCLE_PLAN_LENGTH } from '@/utils/programSchedule';
import {
  buildWeeklyCoachProgramPayload,
  buildCoachProgramTitle,
  filledWeekdaysFromDayCarts,
  weekdayFullLabel,
  weekdayShortLabel,
  DEFAULT_SESSION_TIME,
  type DayCarts,
} from '@/utils/coachProgram';
import { colors, fonts, radius, spacing } from '@/theme';

type PackageRange = { start: string; end: string | null } | null;

type Props = {
  open: boolean;
  onClose: () => void;
  member: Record<string, unknown> | null;
  dayCarts: DayCarts;
  dateMode?: 'fixed14' | 'custom';
  onDateModeChange?: (mode: 'fixed14' | 'custom') => void;
  rangeStart: string;
  rangeEnd: string;
  onRangeChange?: (next: { start: string; end: string }) => void;
  packageRange?: PackageRange;
  onSubmit: (
    payload: ReturnType<typeof buildWeeklyCoachProgramPayload>,
    availabilitySummary: ReturnType<typeof summarizeRangeAvailability>,
  ) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
};

/**
 * Web parity: CoachProgramSendModal — tarih modu, paket sınırları, validation toast’ları.
 * iOS: pageSheet (şeffaf Modal + flex:1 scroll boş ekran). Tarih SelectSheet embedded.
 */
export function CoachProgramSendModal({
  open,
  onClose,
  member,
  dayCarts,
  dateMode = 'fixed14',
  onDateModeChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
  packageRange = null,
  onSubmit,
  submitting = false,
  submitLabel = 'Programı Gönder',
}: Props) {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState('');
  const isIOS = Platform.OS === 'ios';

  const dateBounds = useMemo(
    () =>
      getDateInputBounds(packageRange, {
        cycleLength: dateMode === 'fixed14' ? CYCLE_PLAN_LENGTH : 0,
      }),
    [packageRange, dateMode],
  );
  const customBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange]);
  const filledDays = useMemo(() => filledWeekdaysFromDayCarts(dayCarts), [dayCarts]);

  const availabilitySummary = useMemo(
    () =>
      summarizeRangeAvailability(
        rangeStart,
        rangeEnd,
        member?.availability as Record<string, unknown> | undefined,
      ),
    [rangeStart, rangeEnd, member?.availability],
  );

  const autoTitle = useMemo(
    () =>
      buildCoachProgramTitle(
        String(member?.name || 'Danışan'),
        rangeStart,
        rangeEnd,
        dateMode === 'fixed14' ? 'fixed14' : 'weekly',
      ),
    [member?.name, rangeStart, rangeEnd, dateMode],
  );

  const emptyAvailableDays = useMemo(() => {
    const workout = availabilitySummary.workoutWeekdays || [];
    const filledLabels = new Set(filledDays.map(weekdayFullLabel));
    return workout.filter(
      (label) => typeof label === 'string' && !filledLabels.has(label),
    ) as string[];
  }, [availabilitySummary.workoutWeekdays, filledDays]);

  useEffect(() => {
    if (!open) setDescription('');
  }, [open]);

  const handleSubmit = () => {
    if (!filledDays.length) {
      toast('En az bir güne hareket ekleyin', 'error');
      return;
    }
    if (rangeEnd < rangeStart) {
      toast('Bitiş tarihi başlangıçtan önce olamaz', 'error');
      return;
    }
    if (!availabilitySummary.hasWorkoutDays) {
      toast(
        'Danışan antrenman günü belirtmemiş. Önce müsaitlik doldurmasını isteyin.',
        'error',
      );
      return;
    }
    if (availabilitySummary.activeCount === 0) {
      toast('Seçilen tarih aralığında danışanın antrenman günü yok', 'error');
      return;
    }

    const daySessionTimes = Object.fromEntries(
      filledDays.map((day) => [day, DEFAULT_SESSION_TIME]),
    );

    const payload = buildWeeklyCoachProgramPayload({
      dayCarts,
      daySessionTimes,
      startDate: rangeStart,
      endDate: rangeEnd,
      description,
      sessionDuration: 45,
      memberName: String(member?.name || 'Danışan'),
      titleMode: dateMode === 'fixed14' ? 'fixed14' : 'weekly',
    });

    void onSubmit(payload, availabilitySummary);
  };

  const form = (
    <FormKeyboardScroll
      contentContainerStyle={styles.scroll}
      style={isIOS ? styles.iosScroll : styles.androidScroll}>
      <LinearGradient
        colors={[colors.brand[500], colors.brand[600], colors.sage[500]]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.hero}>
        <Text style={styles.heroEyebrow}>Program başlığı</Text>
        <Text style={styles.heroTitle}>{autoTitle}</Text>
      </LinearGradient>

      <View style={styles.segment}>
        {(
          [
            { id: 'fixed14' as const, label: '14 Günlük' },
            { id: 'custom' as const, label: 'Başlangıç – Bitiş' },
          ] as const
        ).map((m) => {
          const on = dateMode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => onDateModeChange?.(m.id)}
              style={[styles.segmentItem, on && styles.segmentItemOn]}>
              <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {dateMode === 'fixed14' ? (
        <View style={styles.dateCard}>
          <PlanDateField
            embedded
            label="Başlangıç tarihi"
            max={dateBounds.max}
            min={dateBounds.min}
            onChange={(start) => onRangeChange?.({ start, end: rangeEnd })}
            value={rangeStart}
          />
          <Text style={styles.dateHint}>
            Bitiş:{' '}
            <Text style={styles.dateHintStrong}>
              {format(parseISO(`${rangeEnd}T12:00:00`), 'd MMMM yyyy', {
                locale: tr,
              })}
            </Text>{' '}
            ({CYCLE_PLAN_LENGTH} gün)
          </Text>
        </View>
      ) : (
        <View style={styles.dateGrid}>
          <PlanDateField
            embedded
            label="Başlangıç"
            max={customBounds.max}
            min={customBounds.min}
            onChange={(start) => onRangeChange?.({ start, end: rangeEnd })}
            value={rangeStart}
          />
          <PlanDateField
            embedded
            label="Bitiş"
            max={customBounds.max}
            min={rangeStart || customBounds.min}
            onChange={(end) => onRangeChange?.({ start: rangeStart, end })}
            value={rangeEnd}
          />
          <Text style={styles.dateHint}>
            {formatRangeSummary(rangeStart, rangeEnd)} ·{' '}
            {cycleLengthFromRange(rangeStart, rangeEnd)} gün
            {packageRange?.end ? ` · paket ${packageRange.end}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.filledCard}>
        <Text style={styles.filledTitle}>Dolu günler</Text>
        <View style={styles.chips}>
          {filledDays.map((day) => {
            const count = dayCarts[day]?.length || 0;
            return (
              <View key={day} style={styles.chip}>
                <Text style={styles.chipText}>
                  {weekdayShortLabel(day)} · {count} hareket
                </Text>
              </View>
            );
          })}
        </View>
        {emptyAvailableDays.length > 0 ? (
          <Text style={styles.emptyHint}>Boş: {emptyAvailableDays.join(', ')}</Text>
        ) : null}
      </View>

      {!availabilitySummary.hasWorkoutDays ? (
        <View style={styles.warnRed}>
          <Ionicons color={colors.warm[500]} name="warning" size={16} />
          <Text style={styles.warnText}>
            Danışan henüz antrenman günü belirtmemiş. Program gönderilemez.
          </Text>
        </View>
      ) : null}

      {availabilitySummary.hasWorkoutDays && availabilitySummary.blockedCount > 0 ? (
        <View style={styles.warnAmber}>
          <Ionicons color={colors.warm[500]} name="warning" size={16} />
          <Text style={styles.warnText}>
            Aralıkta {availabilitySummary.activeCount} antrenman gününe yazılır;
            müsait olmayan {availabilitySummary.blockedCount} gün atlanır.
          </Text>
        </View>
      ) : null}

      <TextInput
        multiline
        onChangeText={setDescription}
        placeholder="Not ekle (opsiyonel)"
        placeholderTextColor={colors.cream[300]}
        style={styles.note}
        value={description}
      />

      <Button
        disabled={submitting}
        label={submitting ? 'Gönderiliyor…' : submitLabel}
        loading={submitting}
        onPress={handleSubmit}
        rightIcon="send"
        size="md"
      />
    </FormKeyboardScroll>
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={isIOS ? 'pageSheet' : undefined}
      transparent={!isIOS}
      visible={open}>
      <OverlayPortalProvider>
        <View style={isIOS ? styles.iosSheet : styles.root}>
          {isIOS ? null : <Pressable onPress={onClose} style={styles.backdrop} />}
          <View
            style={[
              isIOS ? styles.iosModal : styles.sheet,
              { paddingBottom: insets.bottom + spacing.md },
            ]}>
            {isIOS ? null : <View style={styles.handle} />}
            <View style={styles.titleRow}>
              <Text style={styles.title}>Programı Gönder</Text>
              <Pressable
                accessibilityLabel="Kapat"
                hitSlop={10}
                onPress={onClose}>
                <Ionicons color={colors.cream[800]} name="close" size={24} />
              </Pressable>
            </View>
            {form}
          </View>
        </View>
      </OverlayPortalProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  iosSheet: { flex: 1, backgroundColor: colors.cream[50] },
  iosModal: { flex: 1, backgroundColor: colors.cream[50], paddingTop: spacing.md },
  iosScroll: { flex: 1 },
  androidScroll: { flex: 1 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,35,50,0.5)',
  },
  sheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    height: '92%',
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream[300],
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  hero: { borderRadius: radius.xl, padding: spacing.md, gap: 6 },
  heroEyebrow: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.white, lineHeight: 22 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cream[100],
    borderRadius: radius.xl,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemOn: { backgroundColor: colors.brand[600] },
  segmentText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  segmentTextOn: { color: colors.white },
  dateCard: { gap: spacing.sm },
  dateGrid: { gap: spacing.sm },
  dateHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.7 },
  dateHintStrong: { fontFamily: fonts.sansSemi, color: colors.cream[900] },
  filledCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filledTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[700] },
  emptyHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.5 },
  warnRed: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: spacing.md,
  },
  warnAmber: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  warnText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.cream[900], lineHeight: 18 },
  note: {
    minHeight: 72,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
    textAlignVertical: 'top',
  },
});
