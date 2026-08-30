import { Ionicons } from '@expo/vector-icons';
import { addDays, format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachApplySameProgramModal } from '@/components/staff/CoachApplySameProgramModal';
import { CoachProgramSendModal } from '@/components/staff/CoachProgramSendModal';
import { CoachProgramDayFlowEditor } from '@/components/staff/CoachProgramDayFlowEditor';
import { PlanDateField } from '@/components/staff/PlanDateField';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useToast } from '@/context/ToastContext';
import { DIFFICULTY_LABELS, formatExerciseLocations } from '@/data/exerciseLabels';
import {
  EXERCISE_PAGE_SIZE,
  fetchDistinctExerciseCategories,
  fetchExercisesPage,
} from '@/services/exerciseLibrary';
import {
  AVAILABILITY_WEEKDAYS,
  cycleLengthFromRange,
  formatRangeSummary,
  getWorkoutWeekdays,
  memberHasWorkoutAvailability,
  summarizeRangeAvailability,
} from '@/utils/memberAvailability';
import {
  buildWeeklyCoachProgramPayload,
  cloneCartEntries,
  cartEntrySummary,
  countDayCartExercises,
  createCartEntry,
  CYCLE_PLAN_LENGTH,
  DEFAULT_SESSION_TIME,
  filledWeekdaysFromDayCarts,
  hydrateDayCartsFromEntries,
  weekdayFullLabel,
  weekdayShortLabel,
  type CartEntry,
  type DayCarts,
} from '@/utils/coachProgram';
import {
  findEntriesOutsidePackage,
  getDateInputBounds,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '@/utils/programPackageScope';
import { colors, fonts, radius, spacing } from '@/theme';

const STEPS = [
  { id: 1, label: 'Süre' },
  { id: 2, label: 'Günler' },
  { id: 3, label: 'Akış' },
  { id: 4, label: 'Önizle' },
] as const;

const LOCATIONS = [
  { id: 'home', label: 'Ev' },
  { id: 'gym', label: 'Salon' },
  { id: 'office', label: 'Ofis' },
];

function clampRangeToBounds(
  start: string,
  end: string,
  bounds: { min: string; max: string },
) {
  let s = start;
  let e = end;
  if (bounds?.min && s < bounds.min) s = bounds.min;
  if (bounds?.max && s > bounds.max) s = bounds.max;
  if (bounds?.max && e > bounds.max) e = bounds.max;
  if (e < s) e = s;
  return { start: s, end: e };
}

type Props = {
  member: Record<string, unknown> | null;
  initialProgram?: Record<string, unknown> | null;
  onSubmit: (
    payload: ReturnType<typeof buildWeeklyCoachProgramPayload>,
  ) => Promise<boolean>;
  submitLabel?: string;
  submittingLabel?: string;
  titleSuffix?: string;
  relaxAvailability?: boolean;
};

/**
 * Web CoachProgramEditor RN uyarlaması — 4 adım: Süre → Günler → Akış → Önizle.
 * Önizleme sayfa içi; gönder CoachProgramSendModal ile (tek modal, iOS nested modal yok).
 */
export function CoachProgramEditor({
  member,
  initialProgram = null,
  onSubmit,
  submitLabel = 'Programı Gönder',
  submittingLabel = 'Gönderiliyor…',
  titleSuffix = 'Antrenman programı · haftalık şablon',
  relaxAvailability = false,
}: Props) {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const isEdit = Boolean(initialProgram);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [location, setLocation] = useState('');
  const [requiresMachine, setRequiresMachine] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exercises, setExercises] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exLoading, setExLoading] = useState(false);

  const [dayCarts, setDayCarts] = useState<DayCarts>(() =>
    initialProgram
      ? hydrateDayCartsFromEntries(
          (initialProgram.entries as Record<string, unknown>[]) || [],
        )
      : {},
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dateMode, setDateMode] = useState<'fixed14' | 'custom'>(() => {
    if (!initialProgram) return 'fixed14';
    const len = Number(initialProgram.cycleLength) || CYCLE_PLAN_LENGTH;
    return len === CYCLE_PLAN_LENGTH ? 'fixed14' : 'custom';
  });
  const [rangeStart, setRangeStart] = useState(
    () =>
      String(initialProgram?.cycleStartDate || format(new Date(), 'yyyy-MM-dd')),
  );
  const [rangeEnd, setRangeEnd] = useState(() => {
    if (initialProgram?.cycleStartDate && initialProgram?.cycleLength) {
      return format(
        addDays(
          parseISO(`${initialProgram.cycleStartDate}T12:00:00`),
          (Number(initialProgram.cycleLength) || 1) - 1,
        ),
        'yyyy-MM-dd',
      );
    }
    return format(addDays(new Date(), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd');
  });
  const [applySameOpen, setApplySameOpen] = useState(false);
  const [copyTargetOpen, setCopyTargetOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Record<string, unknown> | null>(
    null,
  );
  const [rangeReady, setRangeReady] = useState(Boolean(initialProgram));
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'workout') : null),
    [member],
  );
  const dateBounds = useMemo(
    () =>
      getDateInputBounds(packageRange, {
        cycleLength: dateMode === 'fixed14' ? CYCLE_PLAN_LENGTH : 0,
      }),
    [packageRange, dateMode],
  );
  const customBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange]);
  const fixedEndDate = useMemo(
    () =>
      format(
        addDays(parseISO(`${rangeStart}T12:00:00`), CYCLE_PLAN_LENGTH - 1),
        'yyyy-MM-dd',
      ),
    [rangeStart],
  );
  const activeStart = rangeStart;
  const activeEnd = dateMode === 'fixed14' ? fixedEndDate : rangeEnd;

  const memberWeekdays = useMemo(
    () => getWorkoutWeekdays(member?.availability as Record<string, unknown>),
    [member?.availability],
  );
  const workoutWeekdays = useMemo(() => {
    if (memberWeekdays.length) return memberWeekdays;
    if (relaxAvailability || isEdit) {
      const fromCarts = filledWeekdaysFromDayCarts(dayCarts);
      if (fromCarts.length) return fromCarts;
      return AVAILABILITY_WEEKDAYS.map((d) => d.value);
    }
    return memberWeekdays;
  }, [memberWeekdays, relaxAvailability, isEdit, dayCarts]);

  const orderedWorkoutDays = useMemo(
    () => AVAILABILITY_WEEKDAYS.filter((d) => workoutWeekdays.includes(d.value)),
    [workoutWeekdays],
  );
  const hasAvailability =
    memberHasWorkoutAvailability(member?.availability as Record<string, unknown>) ||
    ((relaxAvailability || isEdit) && workoutWeekdays.length > 0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void fetchDistinctExerciseCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    (async () => {
      setExLoading(true);
      try {
        const res = await fetchExercisesPage({
          page,
          pageSize: EXERCISE_PAGE_SIZE,
          filters: {
            search: debouncedSearch,
            category,
            difficulty,
            location,
            requiresMachine,
          },
        });
        if (!cancelled) {
          setExercises(res.items);
          setTotalPages(res.totalPages);
          setTotal(res.total);
        }
      } catch {
        if (!cancelled) {
          setExercises([]);
          setTotalPages(1);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setExLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, page, debouncedSearch, category, difficulty, location, requiresMachine]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, difficulty, location, requiresMachine]);

  useEffect(() => {
    if (!member || rangeReady) return;
    const bounds = getDateInputBounds(packageRange, {
      cycleLength: CYCLE_PLAN_LENGTH,
    });
    const start = bounds.min;
    const end = format(
      addDays(parseISO(`${start}T12:00:00`), CYCLE_PLAN_LENGTH - 1),
      'yyyy-MM-dd',
    );
    const customEnd =
      packageRange?.end && packageRange.end >= start
        ? packageRange.end
        : getDateInputBounds(packageRange).max;
    setRangeStart(start);
    setRangeEnd(customEnd >= start ? customEnd : end);
    setRangeReady(true);
  }, [member, packageRange, rangeReady]);

  useEffect(() => {
    if (dateMode !== 'fixed14') return;
    const nextEnd = format(
      addDays(parseISO(`${rangeStart}T12:00:00`), CYCLE_PLAN_LENGTH - 1),
      'yyyy-MM-dd',
    );
    if (rangeEnd !== nextEnd) setRangeEnd(nextEnd);
  }, [dateMode, rangeStart, rangeEnd]);

  useEffect(() => {
    if (!orderedWorkoutDays.length) {
      setSelectedDay(null);
      return;
    }
    if (selectedDay == null || !workoutWeekdays.includes(selectedDay)) {
      setSelectedDay(orderedWorkoutDays[0].value);
    }
  }, [orderedWorkoutDays, workoutWeekdays, selectedDay]);

  const activeCart = selectedDay != null ? dayCarts[selectedDay] || [] : [];
  const cartExerciseIds = useMemo(
    () => new Set(activeCart.map((e) => e.exerciseId)),
    [activeCart],
  );
  const totalExercises = countDayCartExercises(dayCarts);
  const filledDays = filledWeekdaysFromDayCarts(dayCarts);
  const otherCopyTargets = orderedWorkoutDays.filter((d) => d.value !== selectedDay);

  const availabilitySummary = useMemo(
    () =>
      summarizeRangeAvailability(
        activeStart,
        activeEnd,
        member?.availability as Record<string, unknown>,
      ),
    [activeStart, activeEnd, member?.availability],
  );

  const canGoStep2 =
    hasAvailability &&
    activeEnd >= activeStart &&
    (availabilitySummary.activeCount > 0 || relaxAvailability || isEdit);
  const canGoStep3 = filledDays.length > 0;

  const patchDayCart = (
    day: number,
    updater: CartEntry[] | ((list: CartEntry[]) => CartEntry[]),
  ) => {
    setDayCarts((prev) => {
      const current = prev[day] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [day]: next };
    });
  };

  const toggleCart = (ex: Record<string, unknown>) => {
    if (selectedDay == null) {
      toast('Önce bir antrenman günü seçin', 'error');
      return;
    }
    const exerciseId = String(ex.id);
    if (cartExerciseIds.has(exerciseId)) {
      patchDayCart(selectedDay, (list) =>
        list.filter((e) => e.exerciseId !== exerciseId),
      );
      toast(
        `${ex.name} ${weekdayShortLabel(selectedDay)} gününden çıkarıldı`,
        'info',
      );
      return;
    }
    patchDayCart(selectedDay, (list) => [...list, createCartEntry(ex)]);
  };

  const updateCartItem = (id: string, patch: Partial<CartEntry>) => {
    if (selectedDay == null) return;
    patchDayCart(selectedDay, (list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const removeFromCart = (id: string) => {
    if (selectedDay == null) return;
    patchDayCart(selectedDay, (list) => list.filter((e) => e.id !== id));
  };

  const moveCartItem = (id: string, dir: number) => {
    if (selectedDay == null) return;
    patchDayCart(selectedDay, (list) => {
      const i = list.findIndex((e) => e.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const clearSelectedDay = () => {
    if (selectedDay == null) return;
    patchDayCart(selectedDay, []);
    toast(`${weekdayFullLabel(selectedDay)} temizlendi`, 'info');
  };

  const copyDayTo = (targetDay: number) => {
    if (selectedDay == null || targetDay === selectedDay) return;
    if (!workoutWeekdays.includes(targetDay)) {
      toast('Hedef gün müsait değil', 'error');
      return;
    }
    if (!activeCart.length) {
      toast('Kopyalanacak hareket yok', 'error');
      return;
    }
    setDayCarts((prev) => ({ ...prev, [targetDay]: cloneCartEntries(activeCart) }));
    setCopyTargetOpen(false);
    toast(
      `${weekdayFullLabel(selectedDay)} → ${weekdayFullLabel(targetDay)} kopyalandı`,
      'success',
    );
  };

  const handleRangeChange = ({ start, end }: { start: string; end: string }) => {
    if (dateMode === 'fixed14') {
      const bounds = getDateInputBounds(packageRange, {
        cycleLength: CYCLE_PLAN_LENGTH,
      });
      let s = start || rangeStart;
      if (bounds?.min && s < bounds.min) s = bounds.min;
      if (bounds?.max && s > bounds.max) s = bounds.max;
      setRangeStart(s);
      setRangeEnd(
        format(addDays(parseISO(`${s}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
      );
      return;
    }
    const clamped = clampRangeToBounds(start, end, customBounds);
    setRangeStart(clamped.start);
    setRangeEnd(clamped.end);
  };

  const switchDateMode = (mode: 'fixed14' | 'custom') => {
    setDateMode(mode);
    if (mode === 'fixed14') {
      const bounds = getDateInputBounds(packageRange, {
        cycleLength: CYCLE_PLAN_LENGTH,
      });
      let s = rangeStart;
      if (bounds?.min && s < bounds.min) s = bounds.min;
      if (bounds?.max && s > bounds.max) s = bounds.max;
      setRangeStart(s);
      setRangeEnd(
        format(addDays(parseISO(`${s}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
      );
    }
  };

  const goStep2 = () => {
    if (!canGoStep2) {
      toast(
        hasAvailability
          ? 'Seçilen aralıkta antrenman günü yok'
          : 'Danışan müsaitlik belirtmemiş',
        'error',
      );
      return;
    }
    setStep(2);
  };

  const goDayFlow = () => {
    if (!canGoStep3) {
      toast('En az bir güne hareket ekleyin', 'error');
      return;
    }
    setCartSheetOpen(false);
    setStep(3);
  };

  const goPreview = () => {
    if (!canGoStep3) {
      toast('En az bir güne hareket ekleyin', 'error');
      return;
    }
    setStep(4);
  };

  const openSend = () => {
    if (!canGoStep3) {
      toast('En az bir güne hareket ekleyin', 'error');
      return;
    }
    setSendOpen(true);
  };

  const persistPayload = async (
    data: ReturnType<typeof buildWeeklyCoachProgramPayload>,
  ) => {
    if (!member) return;

    const entryDays = [
      ...new Set(
        (data.entries || [])
          .map((e) => Number((e as { day?: number }).day))
          .filter((d) => !Number.isNaN(d)),
      ),
    ];
    const invalidDay = entryDays.find((d) => !workoutWeekdays.includes(d));
    if (invalidDay != null && memberWeekdays.length) {
      toast(`${weekdayFullLabel(invalidDay)} müsait gün değil`, 'error');
      return;
    }
    if (!relaxAvailability && !isEdit) {
      if (!memberHasWorkoutAvailability(member.availability as Record<string, unknown>)) {
        toast('Danışan antrenman günü belirtmemiş', 'error');
        return;
      }
      if (!memberHasProgramTypePackage(member, 'workout')) {
        toast('Üyenin aktif koç paketi yok', 'error');
        return;
      }
      if (availabilitySummary.activeCount === 0) {
        toast('Seçilen tarih aralığında danışanın antrenman günü yok', 'error');
        return;
      }
    }
    const outside = findEntriesOutsidePackage(
      data.entries || [],
      member,
      'workout',
    ) as unknown[];
    if (outside.length && !relaxAvailability) {
      toast('Program tarihleri paket süresi dışında', 'error');
      return;
    }
    if (!relaxAvailability) {
      const windows = getPackageWindowsForProgramType(member, 'workout');
      const start = data.cycleStartDate;
      const end = format(
        addDays(parseISO(`${start}T12:00:00`), (data.cycleLength || 1) - 1),
        'yyyy-MM-dd',
      );
      if (!isDateInPackageWindows(start, windows)) {
        toast('Başlangıç tarihi paket süresi içinde olmalı', 'error');
        return;
      }
      if (!isDateInPackageWindows(end, windows)) {
        toast('Program bitiş tarihi paket süresini aşıyor', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const ok = await onSubmit(data);
      if (!ok) {
        toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        return;
      }
      setSendOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFromModal = async (
    payload: ReturnType<typeof buildWeeklyCoachProgramPayload>,
  ) => {
    await persistPayload(payload);
  };

  if (!member) {
    return <EmptyState description="Üye bulunamadı." title="Danışan yok" />;
  }

  const activeFilterCount = [category, difficulty, location, requiresMachine].filter(
    Boolean,
  ).length;

  return (
    <View style={styles.root}>
      <Text style={styles.suffix}>
        {isEdit ? 'Programı düzenle · ' : ''}
        {titleSuffix}
      </Text>

      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <View key={s.id} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  done && styles.stepDotDone,
                ]}>
                {done ? (
                  <Ionicons color={colors.white} name="checkmark" size={14} />
                ) : (
                  <Text style={[styles.stepNum, active && styles.stepNumActive]}>
                    {s.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  active && styles.stepLabelActive,
                  done && styles.stepLabelDone,
                ]}>
                {s.label}
              </Text>
              {i < STEPS.length - 1 ? (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              ) : null}
            </View>
          );
        })}
      </View>

      {step === 1 ? (
        <View style={styles.block}>
          <View style={styles.durationCard}>
            <Text style={styles.blockTitle}>Program süresi</Text>
            <Text style={styles.blockSub}>14 günlük sabit plan veya özel aralık</Text>
            {packageRange ? (
              <Text style={styles.packageChip}>
                Paket: {packageRange.start}
                {packageRange.end ? ` — ${packageRange.end}` : ''}
              </Text>
            ) : null}

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
                    onPress={() => switchDateMode(m.id)}
                    style={[styles.segmentItem, on && styles.segmentItemOn]}>
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {dateMode === 'fixed14' ? (
              <View style={styles.gap}>
                <PlanDateField
                  label="Başlangıç tarihi"
                  max={dateBounds.max}
                  min={dateBounds.min}
                  onChange={(start) => handleRangeChange({ start, end: rangeEnd })}
                  value={rangeStart}
                />
                <Text style={styles.hint}>
                  Bitiş:{' '}
                  <Text style={styles.hintStrong}>
                    {format(parseISO(`${fixedEndDate}T12:00:00`), 'd MMMM yyyy', {
                      locale: tr,
                    })}
                  </Text>{' '}
                  ({CYCLE_PLAN_LENGTH} gün)
                </Text>
              </View>
            ) : (
              <View style={styles.gap}>
                <PlanDateField
                  label="Başlangıç"
                  max={customBounds.max}
                  min={customBounds.min}
                  onChange={(start) => handleRangeChange({ start, end: rangeEnd })}
                  value={rangeStart}
                />
                <PlanDateField
                  label="Bitiş"
                  max={customBounds.max}
                  min={rangeStart || customBounds.min}
                  onChange={(end) => handleRangeChange({ start: rangeStart, end })}
                  value={rangeEnd}
                />
                <Text style={styles.hint}>
                  {formatRangeSummary(activeStart, activeEnd)} ·{' '}
                  {cycleLengthFromRange(activeStart, activeEnd)} gün
                </Text>
              </View>
            )}
          </View>

          <View style={styles.availCard}>
            <Text style={styles.blockTitle}>Antrenman müsaitliği</Text>
            {hasAvailability ? (
              <>
                <View style={styles.chips}>
                  {orderedWorkoutDays.map((d) => (
                    <View key={d.value} style={styles.dayChip}>
                      <Text style={styles.dayChipText}>{d.label}</Text>
                    </View>
                  ))}
                </View>
                {availabilitySummary.activeCount === 0 &&
                !relaxAvailability &&
                !isEdit ? (
                  <View style={styles.warnAmber}>
                    <Ionicons color={colors.warm[500]} name="warning" size={16} />
                    <Text style={styles.warnText}>
                      Seçilen aralıkta antrenman günü yok.
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.warnAmber}>
                <Ionicons color={colors.warm[500]} name="warning" size={16} />
                <Text style={styles.warnText}>
                  Danışan müsaitlik belirtmemiş. İleri gidilemez.
                </Text>
              </View>
            )}
          </View>

          <Button
            disabled={!canGoStep2}
            label="İleri — Gün programları"
            onPress={goStep2}
            rightIcon="arrow-forward"
            size="md"
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.block, { paddingBottom: spacing.md }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayTabs}>
              {orderedWorkoutDays.map((d) => {
                const count = dayCarts[d.value]?.length || 0;
                const on = selectedDay === d.value;
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => setSelectedDay(d.value)}
                    style={[styles.dayTab, on && styles.dayTabOn]}>
                    <Text style={[styles.dayTabLabel, on && styles.dayTabLabelOn]}>
                      {d.short}
                    </Text>
                    <Text style={[styles.dayTabCount, on && styles.dayTabLabelOn]}>
                      {count > 0 ? `${count}` : '·'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actionsRow}>
            <Pressable
              disabled={!activeCart.length || !workoutWeekdays.length}
              onPress={() => setApplySameOpen(true)}
              style={[
                styles.miniBtn,
                (!activeCart.length || !workoutWeekdays.length) && styles.miniDisabled,
              ]}>
              <Ionicons color={colors.brand[700]} name="copy-outline" size={14} />
              <Text style={styles.miniBtnText}>Tüm günlere aynı</Text>
            </Pressable>
            <Pressable
              disabled={!activeCart.length || otherCopyTargets.length === 0}
              onPress={() => setCopyTargetOpen(true)}
              style={[
                styles.miniBtn,
                (!activeCart.length || otherCopyTargets.length === 0) &&
                  styles.miniDisabled,
              ]}>
              <Ionicons color={colors.brand[700]} name="git-branch-outline" size={14} />
              <Text style={styles.miniBtnText}>Günü kopyala</Text>
            </Pressable>
            <Pressable
              disabled={!activeCart.length}
              onPress={clearSelectedDay}
              style={[styles.miniBtn, !activeCart.length && styles.miniDisabled]}>
              <Ionicons color={colors.cream[800]} name="trash-outline" size={14} />
              <Text style={styles.miniBtnText}>Temizle</Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Ionicons color={colors.cream[800]} name="search" size={18} />
            <TextInput
              onChangeText={setSearch}
              placeholder="Hareket ara…"
              placeholderTextColor={colors.cream[300]}
              style={styles.searchInput}
              value={search}
            />
          </View>

          <Pressable
            onPress={() => setFiltersOpen((v) => !v)}
            style={styles.filterToggle}>
            <Text style={styles.filterToggleText}>
              Filtreler{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Text>
            <Ionicons
              color={colors.brand[600]}
              name={filtersOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
            />
          </Pressable>

          {filtersOpen ? (
            <View style={styles.filters}>
              {categories.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory((cur) => (cur === c ? '' : c))}
                  style={[styles.chip, category === c && styles.chipOn]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
              {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty((cur) => (cur === d ? '' : d))}
                  style={[styles.chip, difficulty === d && styles.chipOn]}>
                  <Text
                    style={[styles.chipText, difficulty === d && styles.chipTextOn]}>
                    {DIFFICULTY_LABELS[d]}
                  </Text>
                </Pressable>
              ))}
              {LOCATIONS.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setLocation((cur) => (cur === l.id ? '' : l.id))}
                  style={[styles.chip, location === l.id && styles.chipOn]}>
                  <Text
                    style={[
                      styles.chipText,
                      location === l.id && styles.chipTextOn,
                    ]}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() =>
                  setRequiresMachine((cur) => (cur === 'true' ? '' : 'true'))
                }
                style={[styles.chip, requiresMachine === 'true' && styles.chipOn]}>
                <Text
                  style={[
                    styles.chipText,
                    requiresMachine === 'true' && styles.chipTextOn,
                  ]}>
                  Makine
                </Text>
              </Pressable>
            </View>
          ) : null}

          {exLoading && exercises.length === 0 ? (
            <InlineSpinner fill />
          ) : exercises.length === 0 ? (
            <EmptyState description="Filtreleri temizleyip tekrar deneyin." title="Sonuç yok" />
          ) : (
            exercises.map((ex) => {
              const inCart = cartExerciseIds.has(String(ex.id));
              const meta = [
                String(ex.bodyPart || ''),
                DIFFICULTY_LABELS[String(ex.difficulty)] || '',
                ...formatExerciseLocations(ex.locations).slice(0, 1),
              ]
                .filter(Boolean)
                .join(' · ');
              const hasVideo = Boolean(ex.videoUrl || ex.videoPending);
              return (
                <View key={String(ex.id)} style={[styles.exRow, inCart && styles.exRowOn]}>
                  <Pressable
                    disabled={!hasVideo}
                    onPress={() => hasVideo && setActiveExercise(ex)}
                    style={styles.thumbBtn}>
                    <ExerciseVideoThumbnail
                      pending={Boolean(ex.videoPending)}
                      size={48}
                      videoUrl={ex.videoUrl as string | null}
                    />
                  </Pressable>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{String(ex.name)}</Text>
                    <Text style={styles.exMeta}>{meta}</Text>
                  </View>
                  <Pressable
                    onPress={() => toggleCart(ex)}
                    style={[styles.addBtn, inCart && styles.addBtnOn]}>
                    {inCart ? (
                      <Ionicons color={colors.white} name="close-circle" size={14} />
                    ) : null}
                    <Text style={[styles.addBtnText, inCart && styles.addBtnTextOn]}>
                      {inCart ? 'Bu günde' : 'Ekle'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}

          {totalPages > 1 ? (
            <View style={styles.pager}>
              <Pressable
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={[styles.pageBtn, page <= 1 && styles.miniDisabled]}>
                <Text style={styles.pageBtnText}>Önceki</Text>
              </Pressable>
              <Text style={styles.pageInfo}>
                {page}/{totalPages} · {total}
              </Text>
              <Pressable
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={[styles.pageBtn, page >= totalPages && styles.miniDisabled]}>
                <Text style={styles.pageBtnText}>Sonraki</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.step2Footer}>
            <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Geri</Text>
            </Pressable>
            <Pressable onPress={() => setCartSheetOpen(true)} style={styles.cartBtn}>
              <Ionicons color={colors.brand[700]} name="list" size={20} />
              <Text style={styles.cartBtnText}>
                {weekdayShortLabel(selectedDay ?? 1)} ({activeCart.length})
              </Text>
            </Pressable>
            <Button
              disabled={!canGoStep3}
              label="Gün akışı"
              onPress={goDayFlow}
              size="md"
              style={styles.ctaFlex}
            />
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <CoachProgramDayFlowEditor
          dayCarts={dayCarts}
          onBack={() => setStep(2)}
          onChange={setDayCarts}
          onContinue={goPreview}
          onOpenExercise={(entry) =>
            setActiveExercise({
              name: entry.exerciseName,
              videoUrl: entry.videoUrl,
              videoPending: entry.videoPending,
              description: entry.description,
            })
          }
        />
      ) : null}

      {step === 4 ? (
        <View style={styles.block}>
          <LinearGradient
            colors={[colors.brand[500], colors.brand[600], colors.sage[500]]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.previewHero}>
            <Text style={styles.heroEyebrow}>Önizleme</Text>
            <Text style={styles.heroTitle}>
              {totalExercises} hareket · {filledDays.length} dolu gün
            </Text>
          </LinearGradient>
          {filledDays.map((day) => (
            <View key={day} style={styles.previewDay}>
              <Text style={styles.previewDayTitle}>{weekdayFullLabel(day)}</Text>
              {(dayCarts[day] || []).map((entry, idx) => (
                <View key={entry.id} style={styles.previewRow}>
                  <Text style={styles.previewName}>
                    {idx + 1}. {entry.exerciseName}
                  </Text>
                  <Text style={styles.previewMeta}>{cartEntrySummary(entry)}</Text>
                </View>
              ))}
            </View>
          ))}
          <Button
            label={submitLabel}
            onPress={openSend}
            rightIcon="send"
            size="md"
          />
          <Button
            label="Geri — Gün akışı"
            onPress={() => setStep(3)}
            size="md"
            variant="secondary"
          />
        </View>
      ) : null}

      {/* Gün sepeti sheet */}
      <Modal
        animationType="slide"
        onRequestClose={() => setCartSheetOpen(false)}
        transparent
        visible={cartSheetOpen}>
        <Pressable onPress={() => setCartSheetOpen(false)} style={styles.sheetBackdrop}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.cartSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <Text style={styles.sheetTitle}>
              {selectedDay != null ? weekdayFullLabel(selectedDay) : 'Sepet'} akışı
            </Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {activeCart.length === 0 ? (
                <EmptyState
                  description="Kütüphaneden hareket ekleyin"
                  icon="barbell-outline"
                  title="Bu gün boş"
                />
              ) : (
                activeCart.map((entry, idx) => (
                  <View key={entry.id} style={styles.cartCard}>
                    <View>
                      <ExerciseVideoThumbnail
                        pending={Boolean(entry.videoPending)}
                        size={40}
                        videoUrl={entry.videoUrl || null}
                      />
                      <View style={styles.orderBadge}>
                        <Text style={styles.orderBadgeText}>{idx + 1}</Text>
                      </View>
                    </View>
                    <View style={styles.exInfo}>
                      <Text numberOfLines={1} style={styles.exName}>
                        {entry.exerciseName}
                      </Text>
                      <Text numberOfLines={2} style={styles.previewMeta}>
                        {cartEntrySummary(entry)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Günden çıkar"
                      hitSlop={8}
                      onPress={() => removeFromCart(entry.id)}
                      style={styles.iconBtn}>
                      <Ionicons color={colors.warm[500]} name="trash-outline" size={18} />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
            <Button
              disabled={!canGoStep3}
              label="Gün akışını düzenle"
              onPress={goDayFlow}
              size="md"
            />
            <Button
              label="Kapat"
              onPress={() => setCartSheetOpen(false)}
              size="md"
              variant="secondary"
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setCopyTargetOpen(false)}
        transparent
        visible={copyTargetOpen}>
        <Pressable
          onPress={() => setCopyTargetOpen(false)}
          style={styles.sheetBackdrop}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.copySheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <Text style={styles.sheetTitle}>
              {weekdayFullLabel(selectedDay ?? 0)} → hangi gün?
            </Text>
            {otherCopyTargets.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => copyDayTo(d.value)}
                style={styles.copyRow}>
                <Text style={styles.copyRowText}>{d.label}</Text>
                {(dayCarts[d.value]?.length || 0) > 0 ? (
                  <Text style={styles.overwrite}>üzerine yazılır</Text>
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <CoachApplySameProgramModal
        onApply={({ dayCarts: next }) => setDayCarts(next)}
        onClose={() => setApplySameOpen(false)}
        open={applySameOpen}
        sourceCart={activeCart}
        workoutWeekdays={workoutWeekdays}
      />

      <CoachProgramSendModal
        dateMode={dateMode}
        dayCarts={dayCarts}
        member={member}
        onClose={() => {
          setSendOpen(false);
        }}
        onDateModeChange={switchDateMode}
        onRangeChange={handleRangeChange}
        onSubmit={handleSendFromModal}
        open={sendOpen}
        packageRange={packageRange}
        rangeEnd={activeEnd}
        rangeStart={activeStart}
        submitLabel={submitting ? submittingLabel : submitLabel}
        submitting={submitting}
      />

      <ExerciseDetailModal
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
        visible={Boolean(activeExercise)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  suffix: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.7 },
  steps: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 6, position: 'relative' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.brand[600] },
  stepDotDone: { backgroundColor: colors.sage[500] },
  stepNum: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  stepNumActive: { color: colors.white },
  stepLabel: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.cream[800], opacity: 0.45 },
  stepLabelActive: { color: colors.brand[700], opacity: 1 },
  stepLabelDone: { color: colors.sage[700], opacity: 1 },
  stepLine: {
    position: 'absolute',
    right: -8,
    top: 15,
    width: 16,
    height: 2,
    backgroundColor: colors.cream[200],
  },
  stepLineDone: { backgroundColor: colors.sage[400] },
  block: { gap: spacing.md },
  durationCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[100],
    padding: spacing.md,
    gap: spacing.md,
  },
  availCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.sm,
  },
  blockTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  blockSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.65 },
  packageChip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800],
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
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
  gap: { gap: spacing.sm },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.7 },
  hintStrong: { fontFamily: fonts.sansSemi, color: colors.cream[900] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    borderRadius: radius.full,
    backgroundColor: colors.sage[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dayChipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.sage[700] },
  warnAmber: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.sm,
  },
  warnText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.cream[900] },
  dayTabs: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  dayTab: {
    minWidth: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayTabOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  dayTabLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900] },
  dayTabLabelOn: { color: colors.white },
  dayTabCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  miniBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[800] },
  miniDisabled: { opacity: 0.4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  filterToggleText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[700] },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  chipTextOn: { color: colors.white },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
  },
  exRowOn: { borderColor: colors.brand[200], backgroundColor: colors.brand[50] },
  thumbBtn: {},
  exInfo: { flex: 1, gap: 4 },
  exName: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  exMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  addBtnOn: { backgroundColor: colors.sage[500] },
  addBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  addBtnTextOn: { color: colors.white },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  pageBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  pageBtnText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  pageInfo: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  step2Footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  backBtn: {
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  backBtnText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[800] },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 8,
  },
  cartBtnText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  ctaFlex: { flex: 1 },
  previewHero: { borderRadius: radius.xl, padding: spacing.lg, gap: 6 },
  heroEyebrow: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.white },
  previewDay: {
    backgroundColor: colors.white,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: spacing.md,
  },
  previewDayTitle: {
    color: colors.brand[700],
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  previewRow: { gap: 2 },
  previewName: {
    color: colors.cream[900],
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  previewMeta: {
    color: colors.cream[800],
    fontFamily: fonts.sans,
    fontSize: 12,
    opacity: 0.75,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.5)',
    justifyContent: 'flex-end',
  },
  cartSheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
    gap: spacing.md,
  },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.sm,
    marginBottom: 8,
  },
  orderBadge: {
    position: 'absolute',
    left: -4,
    top: -4,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.white },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  miniSeg: {
    flexDirection: 'row',
    backgroundColor: colors.cream[100],
    borderRadius: radius.md,
    padding: 2,
  },
  miniSegItem: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.md },
  miniSegOn: { backgroundColor: colors.white },
  miniSegText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.cream[800] },
  miniSegTextOn: { color: colors.cream[900] },
  amountCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  amountBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  amountVal: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
    minWidth: 24,
    textAlign: 'center',
  },
  repsHint: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.5,
  },
  noteInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[900],
  },
  cartActions: { justifyContent: 'center', gap: 2 },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cream[100],
  },
  copySheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  copyRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyRowText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  overwrite: { fontFamily: fonts.sans, fontSize: 11, color: colors.warm[500] },
});
