import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn as EnteringFadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { PANEL_IMAGES } from '@/constants/panelImages';
import { UnpaidMemberGate } from '@/components/membership/UnpaidMemberGate';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { fetchExerciseById } from '@/services/exerciseLibrary';
import { prefetchExerciseVideo } from '@/services/exerciseMedia';
import { AVAILABILITY_WEEKDAYS } from '@/utils/memberAvailability';
import { enteringNative } from '@/utils/reanimatedEntering';
import { amountText } from '@/utils/programGroups';
import {
  completionKey,
  getProgramEntriesForDate,
  groupEntriesByMeal,
  isMealCompleted,
  mealContentText,
  mealLabel,
  splitEntriesByType,
} from '@/utils/programSchedule';
import { colors, fonts, radius, spacing } from '@/theme';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const AVAILABILITY_DAY_START = 8;
const AVAILABILITY_DAY_END = 22;
const AVAILABILITY_DEFAULT_RANGE = { start: 9, end: 17 };
const AVAILABILITY_START_OPTIONS = Array.from(
  { length: AVAILABILITY_DAY_END - AVAILABILITY_DAY_START },
  (_, index) => AVAILABILITY_DAY_START + index,
);

function formatAvailabilityHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function availabilityHoursToRange(hours?: string[]) {
  if (!hours?.length) return null;
  const values = hours
    .map((hour) => Number.parseInt(hour, 10))
    .filter((hour) => !Number.isNaN(hour))
    .sort((a, b) => a - b);
  if (!values.length) return null;
  return { start: values[0], end: values[values.length - 1] + 1 };
}

function availabilityRangeToHours(start: number, end: number) {
  const hours: string[] = [];
  for (let hour = start; hour < end; hour += 1) {
    hours.push(formatAvailabilityHour(hour));
  }
  return hours;
}

function ProgressBar({ pct }: { pct: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 500 });
  }, [pct, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

/** LOCK: docs/mobile/screens/member/calendar.md */
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ avail?: string }>();
  const member = useMember();
  const { myPrograms, refreshData, isUnpaidMember } = useData();
  const { toggleActivityCompletion, toggleMealCompletion, updateProfile } = useActions();
  const { toast } = useToast();

  // Realtime programs + pull-to-refresh — no full refreshData on every tab focus

  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    isToday(new Date()) ? new Date() : null,
  );
  const [saving, setSaving] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [availOpen, setAvailOpen] = useState(false);
  const [availForm, setAvailForm] = useState<Record<string, string[]>>(
    (member?.availability as Record<string, string[]>) || {},
  );
  const [availSaving, setAvailSaving] = useState(false);
  const [availabilityPicker, setAvailabilityPicker] = useState<{
    day: number;
    field: 'start' | 'end';
  } | null>(null);
  const [activeEntry, setActiveEntry] = useState<Record<string, unknown> | null>(null);

  const openCalendarEntry = useCallback(async (entry: Record<string, unknown>) => {
    setActiveEntry(entry);
    let resolvedEntry = entry;
    if (entry.exerciseId) {
      const exercise = await fetchExerciseById(entry.exerciseId);
      if (exercise) {
        resolvedEntry = {
          ...entry,
          ...exercise,
          name: exercise.name || entry.exerciseName || entry.name,
          exerciseName: exercise.name || entry.exerciseName || entry.name,
          videoUrl: entry.videoUrl || exercise.videoUrl,
          videoPending: entry.videoPending ?? exercise.videoPending,
        };
        setActiveEntry(resolvedEntry);
      }
    }
    if (resolvedEntry.videoUrl && !resolvedEntry.videoPending) {
      prefetchExerciseVideo(resolvedEntry.videoUrl);
    }
  }, []);

  useEffect(() => {
    if (params.avail === '1') {
      setAvailOpen(true);
      router.setParams({ avail: undefined });
    }
  }, [params.avail]);

  const completedActivities =
    (member?.completedActivities as Record<string, string[]>) || {};

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  /** Per-day meta once per month — avoids O(programs×entries) per cell render */
  const dayMetaByDate = useMemo(() => {
    const map = new Map<
      string,
      { dots: string[]; total: number; done: number; allDone: boolean }
    >();
    days.forEach((day) => {
      if (!isSameMonth(day, current)) return;
      const dateStr = format(day, 'yyyy-MM-dd');
      const entries = getProgramEntriesForDate(myPrograms, day, member as never);
      const dots: string[] = [];
      if (
        entries.some(
          (e: { programType?: string; mealType?: string }) =>
            e.programType === 'workout' && !e.mealType,
        )
      ) {
        dots.push('workout');
      }
      if (
        entries.some(
          (e: { programType?: string; mealType?: string }) =>
            e.programType === 'nutrition' || e.mealType,
        )
      ) {
        dots.push('nutrition');
      }
      const { workout: w, nutrition: n } = splitEntriesByType(entries);
      const groups = groupEntriesByMeal(n);
      const total = w.length + groups.length;
      if (total === 0) {
        map.set(dateStr, { dots, total: 0, done: 0, allDone: false });
        return;
      }
      const keys = completedActivities[dateStr] || [];
      const done =
        w.filter((e: { id: string }) => keys.includes(completionKey(dateStr, e.id)))
          .length +
        groups.filter((g: { mealType: string; entries: unknown[] }) =>
          isMealCompleted(completedActivities, dateStr, g.mealType, g.entries),
        ).length;
      map.set(dateStr, { dots, total, done, allDone: done === total });
    });
    return map;
  }, [days, current, myPrograms, member, completedActivities]);

  const daysWithPrograms = useMemo(() => {
    const set = new Set<string>();
    dayMetaByDate.forEach((meta, dateStr) => {
      if (meta.dots.length > 0 || meta.total > 0) set.add(dateStr);
    });
    return set;
  }, [dayMetaByDate]);

  const selectedEntries = useMemo(() => {
    if (!selectedDate) return [];
    return getProgramEntriesForDate(myPrograms, selectedDate, member as never);
  }, [myPrograms, selectedDate, member]);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { workout, nutrition } = splitEntriesByType(selectedEntries);
  const mealGroups = groupEntriesByMeal(nutrition);

  const dayCompletionCount = useMemo(() => {
    if (!selectedDateStr) return { done: 0, total: 0 };
    const meta = dayMetaByDate.get(selectedDateStr);
    if (meta) return { done: meta.done, total: meta.total };
    return { done: 0, total: 0 };
  }, [selectedDateStr, dayMetaByDate]);

  const progressPct =
    dayCompletionCount.total > 0
      ? Math.round((dayCompletionCount.done / dayCompletionCount.total) * 100)
      : 0;

  const monthStats = useMemo(() => {
    let total = 0;
    let done = 0;
    dayMetaByDate.forEach((stats) => {
      total += stats.total;
      done += stats.done;
    });
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [dayMetaByDate]);

  const getDotsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dayMetaByDate.get(dateStr)?.dots || [];
  };

  const getDayStats = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dayMetaByDate.get(dateStr) || { total: 0, done: 0, allDone: false };
  };

  const toggleActivity = useCallback(
    async (entryId: string) => {
      if (!selectedDateStr || saving) return;
      setSaving(true);
      setSavingKey(`activity:${entryId}`);
      try {
        await toggleActivityCompletion(selectedDateStr, entryId);
      } finally {
        setSaving(false);
        setSavingKey(null);
      }
    },
    [selectedDateStr, saving, toggleActivityCompletion],
  );

  const toggleMeal = useCallback(
    async (mealType: string, entryIds: string[]) => {
      if (!selectedDateStr || saving) return;
      setSaving(true);
      setSavingKey(`meal:${mealType}`);
      try {
        await toggleMealCompletion(selectedDateStr, mealType, entryIds);
      } finally {
        setSaving(false);
        setSavingKey(null);
      }
    },
    [selectedDateStr, saving, toggleMealCompletion],
  );

  const saveAvailability = async () => {
    setAvailSaving(true);
    try {
      await updateProfile({ availability: availForm });
      toast('Müsaitlik bilgileriniz kaydedildi', 'success');
      setAvailOpen(false);
    } finally {
      setAvailSaving(false);
    }
  };

  const toggleAvailDay = (dayValue: number) => {
    const key = String(dayValue);
    setAvailForm((prev) => {
      const hours = prev[key];
      if (hours?.length) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: availabilityRangeToHours(
          AVAILABILITY_DEFAULT_RANGE.start,
          AVAILABILITY_DEFAULT_RANGE.end,
        ),
      };
    });
  };

  const setAvailabilityRange = (
    dayValue: number,
    patch: { start?: number; end?: number },
  ) => {
    const key = String(dayValue);
    setAvailForm((prev) => {
      const current =
        availabilityHoursToRange(prev[key]) || AVAILABILITY_DEFAULT_RANGE;
      const start = patch.start ?? current.start;
      let end = patch.end ?? current.end;
      if (end <= start) end = start + 1;
      return {
        ...prev,
        [key]: availabilityRangeToHours(start, end),
      };
    });
  };

  const applyAvailabilityPreset = (daysToSet: number[], start: number, end: number) => {
    setAvailForm((prev) => {
      const next = { ...prev };
      daysToSet.forEach((day) => {
        next[String(day)] = availabilityRangeToHours(start, end);
      });
      return next;
    });
  };

  const availDayCount = Object.values(
    (member?.availability as Record<string, string[]>) || {},
  ).filter((v) => v?.length > 0).length;
  const availabilityHoursTotal = Object.values(availForm).reduce(
    (total, hours) => total + (hours?.length || 0),
    0,
  );

  if (isUnpaidMember) {
    return (
      <MeshBackground style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}>
          <FadeIn>
            <View style={styles.header}>
              <Image
                contentFit="cover"
                source={{ uri: PANEL_IMAGES.calendar.url }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(26,69,92,0.15)', 'rgba(26,69,92,0.8)']}
                style={StyleSheet.absoluteFill}
              />
              <Text numberOfLines={1} style={styles.title}>Program Takvimi</Text>
              <Text numberOfLines={2} style={styles.sub}>
                Koçunuzun günlük programları
              </Text>
            </View>
          </FadeIn>
          <UnpaidMemberGate
            description="Bu sayfayı gezebilirsiniz. Program takvimi ve tamamlamalar bu pakette yer almaz."
            title="Takvim paket gerektirir"
          />
        </ScrollView>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={styles.header}>
            <Image
              contentFit="cover"
              source={{ uri: PANEL_IMAGES.calendar.url }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(26,69,92,0.15)', 'rgba(26,69,92,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <Text numberOfLines={1} style={styles.title}>Program Takvimi</Text>
            <Text numberOfLines={2} style={styles.sub}>
              Koçunuzun günlük programları
            </Text>
            {monthStats.total > 0 ? (
              <View style={styles.statBadge}>
                <Ionicons color={colors.gold[400]} name="trophy" size={15} />
                <View>
                  <Text style={styles.statLabel}>Bu Ay</Text>
                  <Text style={styles.statValue}>
                    {monthStats.done}/{monthStats.total} tamamlandı
                  </Text>
                </View>
                <View style={styles.statRing}>
                  <Text style={styles.statPct}>{monthStats.pct}%</Text>
                </View>
              </View>
            ) : null}
          </View>
        </FadeIn>

        {/* ANTRENMAN MÜSAİTLİĞİ — web paritesi açılır kart */}
        <FadeIn delay={40}>
          <View style={styles.availWrap}>
            <LinearGradient
              colors={[colors.brand[50], colors.white]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              accessibilityLabel={
                availOpen ? 'Antrenman müsaitliğini kapat' : 'Antrenman müsaitliğini aç'
              }
              accessibilityRole="button"
              onPress={() => {
                setAvailOpen((v) => {
                  const next = !v;
                  if (next) {
                    setAvailForm(
                      (member?.availability as Record<string, string[]>) || {},
                    );
                  }
                  return next;
                });
              }}
              style={styles.availHead}>
              <View style={styles.availIconBox}>
                <Ionicons color={colors.white} name="calendar" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.availTitle}>Antrenman Müsaitliğim</Text>
                <Text style={styles.availSub}>
                  {availDayCount > 0
                    ? `${availDayCount} antrenman günü seçili`
                    : 'Antrenman yapabileceğiniz gün ve saatleri belirleyin'}
                </Text>
              </View>
              <View style={styles.availPill}>
                <Text style={styles.availPillText}>Koç programı için</Text>
              </View>
              <Ionicons
                color={colors.cream[300]}
                name={availOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
              />
            </Pressable>

            {availOpen ? (
              <Animated.View
                entering={enteringNative(EnteringFadeIn.duration(250))}
                exiting={enteringNative(FadeOut.duration(200))}
                style={styles.availBody}>
                <View style={styles.availPresets}>
                  <Pressable
                    onPress={() =>
                      applyAvailabilityPreset([1, 2, 3, 4, 5], 9, 17)
                    }
                    style={styles.availPreset}>
                    <Text style={styles.availPresetText}>Hafta içi 09:00–17:00</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      applyAvailabilityPreset([1, 2, 3, 4, 5, 6, 0], 18, 22)
                    }
                    style={styles.availPreset}>
                    <Text style={styles.availPresetText}>Her gün akşam 18:00–22:00</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAvailForm({})}
                    style={styles.availClear}>
                    <Ionicons color={colors.danger[600]} name="trash-outline" size={14} />
                    <Text style={styles.availClearText}>Temizle</Text>
                  </Pressable>
                </View>
                <View style={styles.availDays}>
                  {AVAILABILITY_WEEKDAYS.map((d) => {
                    const range = availabilityHoursToRange(
                      availForm[String(d.value)],
                    );
                    const on = Boolean(range);
                    return (
                      <View
                        key={d.value}
                        style={[styles.availDayRow, on && styles.availDayRowOn]}>
                        <Pressable
                          onPress={() => toggleAvailDay(d.value)}
                          style={styles.availDayToggle}>
                          <View style={[styles.availCheck, on && styles.availCheckOn]}>
                            {on ? (
                              <Ionicons color={colors.white} name="checkmark" size={13} />
                            ) : null}
                          </View>
                          <Text style={styles.availDayLabel}>{d.label}</Text>
                        </Pressable>
                        {range ? (
                          <View style={styles.availRange}>
                            <Pressable
                              onPress={() =>
                                setAvailabilityPicker({
                                  day: d.value,
                                  field: 'start',
                                })
                              }
                              style={styles.availTime}>
                              <Text style={styles.availTimeText}>
                                {formatAvailabilityHour(range.start)}
                              </Text>
                            </Pressable>
                            <Text style={styles.availRangeDash}>—</Text>
                            <Pressable
                              onPress={() =>
                                setAvailabilityPicker({
                                  day: d.value,
                                  field: 'end',
                                })
                              }
                              style={styles.availTime}>
                              <Text style={styles.availTimeText}>
                                {formatAvailabilityHour(range.end)}
                              </Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Text style={styles.availUnavailable}>
                            Bu gün uygun değilim
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                <View style={styles.availSummary}>
                  <Ionicons color={colors.brand[500]} name="calendar-outline" size={15} />
                  <Text style={styles.availSummaryText}>
                    Antrenman yapabileceğiniz gün ve saatleri seçin; koçunuz
                    programı yalnızca bu günlere yazar.
                  </Text>
                  {availabilityHoursTotal > 0 ? (
                    <Text style={styles.availSummaryCount}>
                      {availabilityHoursTotal} saat
                    </Text>
                  ) : null}
                </View>
                <View style={styles.availActions}>
                  <Pressable
                    onPress={() => setAvailOpen(false)}
                    style={styles.availCancel}>
                    <Text style={styles.availCancelText}>İptal</Text>
                  </Pressable>
                  <Button
                    label="Kaydet"
                    loading={availSaving}
                    onPress={() => void saveAvailability()}
                    size="md"
                    style={{ flex: 1 }}
                  />
                </View>
              </Animated.View>
            ) : null}
          </View>
        </FadeIn>

        <View style={styles.monthRow}>
          <Pressable
            accessibilityLabel="Önceki ay"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setCurrent((d) => subMonths(d, 1))}>
            <Ionicons color={colors.cream[900]} name="chevron-back" size={22} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {format(current, 'MMMM yyyy', { locale: tr })}
          </Text>
          <Pressable
            accessibilityLabel="Sonraki ay"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setCurrent((d) => addMonths(d, 1))}>
            <Ionicons color={colors.cream[900]} name="chevron-forward" size={22} />
          </Pressable>
        </View>

        <View style={styles.weekHead}>
          {DAY_NAMES.map((d) => (
            <Text key={d} style={styles.weekHeadText}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.calCard}>
          <View style={styles.grid}>
            {days.map((day) => {
              const inMonth = isSameMonth(day, current);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const dots = inMonth ? getDotsForDay(day) : [];
              const stats = inMonth
                ? getDayStats(day)
                : { total: 0, done: 0, allDone: false };
              const partial = stats.total > 0 && stats.done > 0 && !stats.allDone;
              return (
                <Pressable
                  key={day.toISOString()}
                  disabled={!inMonth}
                  onPress={() => setSelectedDate(day)}
                  style={[
                    styles.dayCell,
                    selected && styles.daySelected,
                    isToday(day) && !selected && styles.dayToday,
                  ]}>
                  <Text
                    style={[
                      styles.dayNum,
                      !inMonth && styles.dayMuted,
                      selected && styles.dayNumOn,
                    ]}>
                    {format(day, 'd')}
                  </Text>
                  {stats.allDone && !selected ? (
                    <Ionicons
                      color={colors.sage[500]}
                      name="checkmark-circle"
                      size={13}
                      style={{ marginTop: 2 }}
                    />
                  ) : (
                    <View style={styles.dots}>
                      {dots.includes('workout') ? (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: selected ? 'rgba(255,255,255,0.8)' : colors.brand[400] },
                          ]}
                        />
                      ) : null}
                      {dots.includes('nutrition') ? (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: selected ? 'rgba(255,255,255,0.8)' : colors.sage[400] },
                          ]}
                        />
                      ) : null}
                    </View>
                  )}
                  {partial ? (
                    <View style={styles.miniBarTrack}>
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${(stats.done / stats.total) * 100}%`,
                            backgroundColor: selected
                              ? 'rgba(255,255,255,0.6)'
                              : colors.brand[400],
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Renk açıklamaları */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.brand[400] }]} />
              <Text style={styles.legendText}>Antrenman</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.sage[400] }]} />
              <Text style={styles.legendText}>Beslenme</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons color={colors.sage[500]} name="checkmark-circle" size={12} />
              <Text style={styles.legendText}>Tamamlanan gün</Text>
            </View>
          </View>
        </View>

        {myPrograms.length === 0 ? (
          <FadeIn delay={80}>
            <View style={styles.noPrograms}>
              <Ionicons color={colors.cream[300]} name="clipboard-outline" size={44} />
              <Text style={styles.noProgramsTitle}>Henüz program yok</Text>
              <Text style={styles.noProgramsText}>
                Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada
                takvimde görünecek.
              </Text>
            </View>
          </FadeIn>
        ) : null}

        {selectedDateStr ? (
          <FadeIn key={selectedDateStr} delay={40} style={styles.detail}>
            <View style={styles.detailHead}>
              <Text style={styles.sectionTitle}>
                {format(selectedDate!, 'd MMMM yyyy, EEEE', { locale: tr })}
              </Text>
              {isToday(selectedDate!) ? (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Bugün</Text>
                </View>
              ) : null}
            </View>

            {dayCompletionCount.total > 0 ? (
              <View style={styles.progressBlock}>
                <View style={styles.progressMetaRow}>
                  <Text style={styles.progressMeta}>
                    {dayCompletionCount.done}/{dayCompletionCount.total} görev tamamlandı
                  </Text>
                  <Text style={styles.progressPct}>{progressPct}%</Text>
                </View>
                <ProgressBar pct={progressPct} />
              </View>
            ) : null}

            {/* DİYET LİSTESİ */}
            <View style={styles.block}>
              <View style={styles.blockHead}>
                <Ionicons color={colors.brand[700]} name="nutrition" size={14} />
                <Text style={styles.blockHeadTitle}>Diyet Listesi</Text>
                <Text style={styles.blockHeadCount}>{mealGroups.length} öğün</Text>
              </View>
              {mealGroups.length === 0 ? (
                <Text style={styles.blockEmpty}>Bu gün için diyet listesi yok</Text>
              ) : (
                mealGroups.map((g: { mealType: string; label: string; entries: Record<string, unknown>[] }) => {
                  const done = isMealCompleted(
                    completedActivities,
                    selectedDateStr,
                    g.mealType,
                    g.entries as never,
                  );
                  return (
                    <Pressable
                      key={g.mealType}
                      onPress={() =>
                        void toggleMeal(
                          g.mealType,
                          g.entries.map((e) => String(e.id)),
                        )
                      }
                      style={[styles.entryRow, done && styles.entryRowDone]}>
                      {savingKey === `meal:${g.mealType}` ? (
                        <View style={styles.checkSlot}>
                          <BrandLoader mark={false} size="xs" />
                        </View>
                      ) : (
                        <Animated.View
                          key={done ? 'done' : 'undone'}
                          entering={enteringNative(ZoomIn.duration(220))}>
                          <Ionicons
                            color={done ? colors.sage[500] : colors.cream[300]}
                            name={done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                          />
                        </Animated.View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.entryTitle, done && styles.entryTitleDone]}>
                          {mealLabel(g.mealType) || g.label}
                        </Text>
                        <Text style={styles.entryMeta}>
                          {mealContentText(g.entries as never)}
                        </Text>
                        {g.entries.find((e) => e.note)?.note ? (
                          <Text style={styles.entryMeta}>
                            {String(g.entries.find((e) => e.note)?.note)}
                          </Text>
                        ) : null}
                        {done ? (
                          <View style={styles.celebrateRow}>
                            <Ionicons color={colors.mint[400]} name="flash" size={12} />
                            <Text style={styles.celebrateText}>Öğün tamamlandı</Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* KOÇ PROGRAMI */}
            <View style={styles.block}>
              <View style={styles.blockHead}>
                <Ionicons color={colors.brand[800]} name="barbell" size={14} />
                <Text style={styles.blockHeadTitle}>Koç Programı</Text>
                <Text style={styles.blockHeadCount}>{workout.length} hareket</Text>
              </View>
              {workout.length === 0 ? (
                <Text style={styles.blockEmpty}>Bu gün için antrenman yok</Text>
              ) : (
                workout.map((entry: Record<string, unknown>) => {
                  const done = (completedActivities[selectedDateStr] || []).includes(
                    completionKey(selectedDateStr, String(entry.id)),
                  );
                  const canWatch = Boolean(entry.videoUrl || entry.exerciseId);
                  return (
                    <Pressable
                      key={String(entry.id)}
                      onPress={() => void toggleActivity(String(entry.id))}
                      style={[styles.entryRow, done && styles.entryRowDone]}>
                      {savingKey === `activity:${String(entry.id)}` ? (
                        <View style={styles.checkSlot}>
                          <BrandLoader mark={false} size="xs" />
                        </View>
                      ) : (
                        <Animated.View
                          key={done ? 'done' : 'undone'}
                          entering={enteringNative(ZoomIn.duration(220))}>
                          <Ionicons
                            color={done ? colors.sage[500] : colors.cream[300]}
                            name={done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                          />
                        </Animated.View>
                      )}
                      <ExerciseVideoThumbnail
                        pending={Boolean(entry.videoPending)}
                        size={44}
                        videoUrl={entry.videoUrl as string}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.entryTitle, done && styles.entryTitleDone]}>
                          {String(entry.name || entry.exerciseName || 'Egzersiz')}
                        </Text>
                        {entry.amount || entry.sets ? (
                          <Text style={styles.entryMeta}>
                            {entry.sets != null && entry.sets !== ''
                              ? `${entry.sets} set × ${amountText(entry as never)}`
                              : amountText(entry as never)}
                          </Text>
                        ) : null}
                        {done ? (
                          <View style={styles.celebrateRow}>
                            <Ionicons color={colors.mint[400]} name="flash" size={12} />
                            <Text style={styles.celebrateText}>
                              Harika! Bu aktiviteyi tamamladınız.
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {canWatch ? (
                        <Pressable
                          hitSlop={6}
                          onPress={() => void openCalendarEntry(entry)}
                          onPressIn={() => {
                            if (entry.videoUrl && !entry.videoPending) {
                              prefetchExerciseVideo(entry.videoUrl);
                            }
                          }}
                          style={styles.watchBtn}>
                          <Ionicons
                            color={colors.brand[700]}
                            name="play-circle"
                            size={14}
                          />
                          <Text style={styles.watchBtnText}>İzle</Text>
                        </Pressable>
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </FadeIn>
        ) : null}
      </ScrollView>

      <ExerciseDetailModal
        exercise={activeEntry}
        onClose={() => setActiveEntry(null)}
        visible={Boolean(activeEntry)}
      />

      <SelectSheet
        onClose={() => setAvailabilityPicker(null)}
        onSelect={(value) => {
          if (!availabilityPicker) return;
          setAvailabilityRange(availabilityPicker.day, {
            [availabilityPicker.field]: Number(value),
          });
        }}
        options={(() => {
          if (!availabilityPicker) return [];
          const range =
            availabilityHoursToRange(
              availForm[String(availabilityPicker.day)],
            ) || AVAILABILITY_DEFAULT_RANGE;
          const hours =
            availabilityPicker.field === 'start'
              ? AVAILABILITY_START_OPTIONS
              : AVAILABILITY_START_OPTIONS.filter(
                  (hour) => hour >= range.start,
                ).map((hour) => hour + 1);
          return hours.map((hour) => ({
            value: String(hour),
            label: formatAvailabilityHour(hour),
          }));
        })()}
        title={
          availabilityPicker?.field === 'end'
            ? 'Bitiş saati'
            : 'Başlangıç saati'
        }
        value={(() => {
          if (!availabilityPicker) return undefined;
          const range =
            availabilityHoursToRange(
              availForm[String(availabilityPicker.day)],
            ) || AVAILABILITY_DEFAULT_RANGE;
          return String(range[availabilityPicker.field]);
        })()}
        visible={Boolean(availabilityPicker)}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: {
    height: 140,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.white,
    flexShrink: 1,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    flexShrink: 1,
  },
  statBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  statRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPct: { fontFamily: fonts.sansSemi, fontSize: 8.5, color: colors.white },
  availWrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[100],
    overflow: 'hidden',
  },
  availHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  availIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  availTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  availSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 1,
  },
  availPill: {
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  availPillText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.brand[700] },
  availBody: {
    borderTopWidth: 1,
    borderTopColor: colors.brand[100],
    padding: spacing.md,
    gap: spacing.md,
  },
  availPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availPreset: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  availPresetText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
  },
  availClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  availClearText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.danger[600],
  },
  availDays: { gap: 8 },
  availDayRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  availDayRowOn: {
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  availDayToggle: {
    minWidth: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cream[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  availCheckOn: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[500],
  },
  availDayLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
  },
  availRange: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  availTime: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  availTimeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
  },
  availRangeDash: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
  },
  availUnavailable: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
    textAlign: 'right',
  },
  availSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.cream[50],
    padding: 10,
  },
  availSummaryText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    color: colors.cream[800],
    opacity: 0.65,
  },
  availSummaryCount: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
  },
  availActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availCancel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availCancelText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[800] },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  monthLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: colors.cream[900],
    textTransform: 'capitalize',
  },
  weekHead: { flexDirection: 'row' },
  weekHeadText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
  },
  calCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  daySelected: { backgroundColor: colors.brand[600] },
  dayToday: { borderWidth: 1, borderColor: colors.brand[300] },
  dayNum: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  dayNumOn: { color: colors.white },
  dayMuted: { opacity: 0.25 },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  miniBarTrack: {
    position: 'absolute',
    bottom: 5,
    left: '18%',
    right: '18%',
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    overflow: 'hidden',
  },
  miniBarFill: { height: 2, borderRadius: radius.full },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cream[100],
    backgroundColor: colors.cream[50],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], opacity: 0.6 },
  noPrograms: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cream[300],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl + spacing.md,
    gap: 6,
  },
  noProgramsTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: colors.cream[900],
    marginTop: spacing.sm,
  },
  noProgramsText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.55,
    textAlign: 'center',
    lineHeight: 19,
  },
  detail: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.md,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.cream[900] },
  todayBadge: {
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  todayBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  progressBlock: { gap: 6 },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
  },
  progressPct: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[600] },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.brand[500],
  },
  block: { gap: 8 },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brand[50],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  blockHeadTitle: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[700],
  },
  blockHeadCount: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    opacity: 0.75,
  },
  blockEmpty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.45,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.md,
  },
  entryRowDone: { backgroundColor: colors.sage[50] },
  entryTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  entryTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.sage[700],
  },
  entryMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  celebrateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  celebrateText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.sage[600] },
  checkSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  watchBtnText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
});
