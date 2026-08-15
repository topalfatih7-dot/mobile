import { Ionicons } from '@expo/vector-icons';
import { addDays, format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PlanDateField } from '@/components/staff/PlanDateField';
import { Button } from '@/components/ui/Button';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { useToast } from '@/context/ToastContext';
import {
  CYCLE_PLAN_LENGTH,
  MEAL_TYPES,
  dedupeDailyNutritionEntries,
  mealLabel,
} from '@/utils/programSchedule';
import { getDateInputBounds } from '@/utils/programPackageScope';
import { colors, fonts, radius, spacing } from '@/theme';

const STEPS = [
  { id: 1, label: 'Süre' },
  { id: 2, label: 'Liste' },
  { id: 3, label: 'Gönder' },
] as const;

/** Web supportScheduleConstants.WEEKDAYS — Pzt→Paz, value = getDay() */
const WEEKDAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
] as const;

const SELECTABLE_MEALS = MEAL_TYPES.filter((m: { id: string }) => m.id !== 'note');

const SCHEDULE_OPTIONS = [
  { id: 'cycle14' as const, label: '14 Günlük Liste' },
  { id: 'weekly' as const, label: 'Güne özel (haftalık)' },
  { id: 'date' as const, label: 'Tarihe özel' },
];

const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

export const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: '08:00',
  snack_morning: '10:30',
  lunch: '13:00',
  snack_afternoon: '16:00',
  dinner: '19:00',
  snack_evening: '21:30',
};

type MealUi = {
  icon: keyof typeof Ionicons.glyphMap;
  accentBg: string;
  accentText: string;
  btn: string;
};

const MEAL_UI: Record<string, MealUi> = {
  breakfast: {
    icon: 'cafe-outline',
    accentBg: colors.warm[100],
    accentText: colors.warm[500],
    btn: colors.warm[500],
  },
  snack_morning: {
    icon: 'nutrition-outline',
    accentBg: colors.gold[400] + '22',
    accentText: colors.gold[500],
    btn: colors.gold[500],
  },
  lunch: {
    icon: 'sunny-outline',
    accentBg: colors.sage[100],
    accentText: colors.sage[700],
    btn: colors.sage[500],
  },
  snack_afternoon: {
    icon: 'leaf-outline',
    accentBg: colors.mint[50],
    accentText: colors.sage[700],
    btn: colors.mint[400],
  },
  dinner: {
    icon: 'moon-outline',
    accentBg: colors.brand[100],
    accentText: colors.brand[700],
    btn: colors.brand[500],
  },
  snack_evening: {
    icon: 'restaurant-outline',
    accentBg: colors.cream[100],
    accentText: colors.cream[800],
    btn: colors.brand[600],
  },
  note: {
    icon: 'document-text-outline',
    accentBg: colors.cream[100],
    accentText: colors.cream[800],
    btn: colors.cream[800],
  },
};

export type NutritionEntry = {
  id: string;
  mealType: string;
  name: string;
  note: string;
  exerciseName: string;
  start: string;
  day?: number;
  date?: string;
  cycleDay?: number | null;
};

export type NutritionProgramPayload = {
  title: string;
  description: string;
  entries: NutritionEntry[];
  items: string[];
  scheduleType?: 'cycle14' | 'weekly' | 'date';
  cycleStartDate?: string;
  cycleLength?: number;
  cycleLoop?: boolean;
  cycleSameDaily?: boolean;
};

type PackageRange = { start: string; end: string | null } | null;

type Props = {
  onCreate?: (payload: NutritionProgramPayload) => Promise<void>;
  onUpdate?: (payload: NutritionProgramPayload) => Promise<void>;
  initialData?: Record<string, unknown> | null;
  packageRange?: PackageRange;
  memberName?: string;
  submitLabel?: string;
};

function entryToText(
  e: NutritionEntry,
  scheduleMode: string,
  cycleSameDaily = true,
) {
  const schedule =
    scheduleMode === 'cycle14' && cycleSameDaily
      ? '14 gün boyunca her gün'
      : e.date
        ? format(new Date(`${e.date}T12:00:00`), 'd MMM', { locale: tr })
        : e.day != null
          ? WEEKDAYS.find((d) => d.value === Number(e.day))?.label || ''
          : 'Her gün';
  const time = e.start ? ` ${e.start}` : '';
  return `${schedule}${time} ${mealLabel(e.mealType)}: ${e.name}${e.note ? ` (${e.note})` : ''}`;
}

function sortEntries(list: NutritionEntry[]) {
  return [...list].sort((a, b) => {
    const dateCmp = (a.date || '9999').localeCompare(b.date || '9999');
    if (dateCmp !== 0) return dateCmp;
    const dayCmp = (a.day ?? 99) - (b.day ?? 99);
    if (dayCmp !== 0) return dayCmp;
    const ai = MEAL_TYPES.findIndex((m: { id: string }) => m.id === a.mealType);
    const bi = MEAL_TYPES.findIndex((m: { id: string }) => m.id === b.mealType);
    if (ai !== bi) return ai - bi;
    return (a.start || '').localeCompare(b.start || '');
  });
}

function entryKey(entry: Partial<NutritionEntry>) {
  if (entry.date) return `date:${entry.date}:${entry.mealType}:${entry.start || ''}`;
  return `day:${entry.day}:${entry.mealType}:${entry.start || ''}`;
}

function isSameDailyCycle(mode: string, cycleSameDaily: boolean) {
  return mode === 'cycle14' && cycleSameDaily;
}

function usesWeekdayPicker(mode: string, cycleSameDaily: boolean) {
  return mode === 'weekly' || (mode === 'cycle14' && !cycleSameDaily);
}

function scopedEntries(entries: NutritionEntry[], scheduleMode: string) {
  if (scheduleMode === 'date') {
    return entries.filter((e) => e.date);
  }
  return entries.filter((e) => e.day != null && !e.date && e.cycleDay == null);
}

function newEntryId(day?: number) {
  return `n-${Date.now()}-${day ?? 'x'}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Web NutritionProgramBuilder — 3 adım: Süre / Liste / Gönder */
export function NutritionProgramBuilder({
  onCreate,
  onUpdate,
  initialData = null,
  packageRange = null,
  memberName = 'Danışan',
  submitLabel,
}: Props) {
  const { toast } = useToast();
  const isEdit = Boolean(initialData) && typeof onUpdate === 'function';

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(() => String(initialData?.title || ''));
  const [description, setDescription] = useState(() =>
    String(initialData?.description || ''),
  );
  const [entries, setEntries] = useState<NutritionEntry[]>(() =>
    Array.isArray(initialData?.entries)
      ? (initialData!.entries as NutritionEntry[])
      : [],
  );
  const [scheduleMode, setScheduleMode] = useState<'cycle14' | 'weekly' | 'date'>(
    () => {
      const t = initialData?.scheduleType;
      if (t === 'everyday') return 'cycle14';
      if (t === 'cycle14' || t === 'weekly' || t === 'date') return t;
      if (
        Array.isArray(initialData?.entries) &&
        (initialData!.entries as NutritionEntry[]).some((e) => e.date)
      ) {
        return 'date';
      }
      return 'cycle14';
    },
  );
  const [cycleSameDaily, setCycleSameDaily] = useState(() => {
    if (
      initialData?.scheduleType === 'cycle14' ||
      initialData?.scheduleType === 'everyday'
    ) {
      return initialData?.cycleSameDaily !== false;
    }
    return true;
  });
  const [selectedDay, setSelectedDay] = useState(1);
  const [copyOpen, setCopyOpen] = useState(false);
  const [cycleStartDate, setCycleStartDate] = useState(() =>
    String(initialData?.cycleStartDate || format(new Date(), 'yyyy-MM-dd')),
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const dated = Array.isArray(initialData?.entries)
      ? (initialData!.entries as NutritionEntry[]).find((e) => e.date)?.date
      : null;
    return dated || format(new Date(), 'yyyy-MM-dd');
  });
  const [mealType, setMealType] = useState('breakfast');
  const [draft, setDraft] = useState({
    content: '',
    note: '',
    start: DEFAULT_MEAL_TIMES.breakfast,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH }),
    [packageRange],
  );
  const singleDateBounds = useMemo(
    () => getDateInputBounds(packageRange),
    [packageRange],
  );

  const cycleEndDate = useMemo(
    () =>
      format(
        addDays(new Date(`${cycleStartDate}T12:00:00`), CYCLE_PLAN_LENGTH - 1),
        'yyyy-MM-dd',
      ),
    [cycleStartDate],
  );

  const sameDaily = isSameDailyCycle(scheduleMode, cycleSameDaily);
  const weekdayPicker = usesWeekdayPicker(scheduleMode, cycleSameDaily);

  const activeEntries = useMemo(() => {
    if (sameDaily) {
      return dedupeDailyNutritionEntries(
        entries.filter((e) => !e.date && e.cycleDay == null) as never[],
      ) as NutritionEntry[];
    }
    if (scheduleMode === 'date') {
      return sortEntries(entries.filter((e) => e.date === selectedDate));
    }
    return sortEntries(entries.filter((e) => e.day === selectedDay && !e.date));
  }, [entries, selectedDay, selectedDate, scheduleMode, sameDaily]);

  const allScoped = useMemo(
    () => sortEntries(scopedEntries(entries, scheduleMode)),
    [entries, scheduleMode],
  );

  const displayEntries = useMemo(
    () =>
      (sameDaily
        ? dedupeDailyNutritionEntries(allScoped as never[])
        : allScoped) as NutritionEntry[],
    [allScoped, sameDaily],
  );

  const mealCount = displayEntries.length;

  const datesWithMeals = useMemo(() => {
    const set = new Set(entries.filter((e) => e.date).map((e) => e.date as string));
    return Array.from(set).sort();
  }, [entries]);

  const daysWithMeals = useMemo(() => {
    const set = new Set(
      entries.filter((e) => e.day != null && !e.date).map((e) => e.day as number),
    );
    return WEEKDAYS.map((d) => d.value).filter((v) => set.has(v));
  }, [entries]);

  const missingWeekdays = useMemo(() => {
    if (!(scheduleMode === 'cycle14' && !cycleSameDaily)) return [];
    return WEEKDAYS.filter(
      (d) =>
        !entries.some((e) => e.day === d.value && !e.date && e.cycleDay == null),
    );
  }, [scheduleMode, cycleSameDaily, entries]);

  const canGoStep2 = useMemo(() => {
    if (scheduleMode === 'cycle14') {
      if (!cycleStartDate) return false;
      if (dateBounds.min && cycleStartDate < dateBounds.min) return false;
      if (dateBounds.max && cycleStartDate > dateBounds.max) return false;
      return true;
    }
    if (scheduleMode === 'date') {
      if (!selectedDate) return false;
      if (singleDateBounds.min && selectedDate < singleDateBounds.min) return false;
      if (singleDateBounds.max && selectedDate > singleDateBounds.max) return false;
      return true;
    }
    return true;
  }, [scheduleMode, cycleStartDate, selectedDate, dateBounds, singleDateBounds]);

  const canGoStep3 =
    scheduleMode === 'cycle14' && !cycleSameDaily
      ? missingWeekdays.length === 0
      : mealCount > 0;

  const activeMeal =
    SELECTABLE_MEALS.find((m: { id: string }) => m.id === mealType) ||
    SELECTABLE_MEALS[0];
  const activeUi = MEAL_UI[mealType] || MEAL_UI.breakfast;
  const scheduleModeLabel =
    SCHEDULE_OPTIONS.find((m) => m.id === scheduleMode)?.label || '';

  const scheduleSummary =
    scheduleMode === 'cycle14'
      ? `${format(new Date(`${cycleStartDate}T12:00:00`), 'd MMM', { locale: tr })} — ${format(new Date(`${cycleEndDate}T12:00:00`), 'd MMM yyyy', { locale: tr })} · ${CYCLE_PLAN_LENGTH} gün${cycleSameDaily ? ' · her gün aynı' : ' · güne göre'}`
      : scheduleMode === 'date'
        ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', {
            locale: tr,
          })
        : daysWithMeals.length
          ? `Haftalık · ${daysWithMeals.map((d) => WEEKDAYS.find((w) => w.value === d)?.label?.slice(0, 3)).join(', ')}`
          : 'Haftalık tekrar';

  const scheduleLabel = sameDaily
    ? `Günlük menü · ${CYCLE_PLAN_LENGTH} gün geçerli`
    : scheduleMode === 'date'
      ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', {
          locale: tr,
        })
      : scheduleMode === 'cycle14'
        ? `${WEEKDAYS.find((d) => d.value === selectedDay)?.label || '—'} (14 gün içinde her hafta)`
        : `${WEEKDAYS.find((d) => d.value === selectedDay)?.label || '—'} (haftalık tekrar)`;

  const selectMealType = (id: string) => {
    setMealType(id);
    if (!editingId) {
      setDraft((d) => ({ ...d, start: DEFAULT_MEAL_TIMES[id] || '08:00' }));
    }
  };

  const applyCycleSameDaily = (nextSameDaily: boolean) => {
    if (nextSameDaily === cycleSameDaily) return;
    if (nextSameDaily) {
      const sourceDay = entries.some((e) => e.day === selectedDay && !e.date)
        ? selectedDay
        : (entries.find((e) => e.day != null && !e.date)?.day ?? selectedDay);
      const template = dedupeDailyNutritionEntries(
        entries.filter(
          (e) => e.day === sourceDay && !e.date && e.cycleDay == null,
        ) as never[],
      ) as NutritionEntry[];
      const stamped: NutritionEntry[] = [];
      template.forEach((e) => {
        for (let day = 0; day <= 6; day += 1) {
          stamped.push({ ...e, id: newEntryId(day), day });
        }
      });
      setEntries((list) => [
        ...list.filter((e) => e.date || e.cycleDay != null),
        ...stamped,
      ]);
    } else {
      const hasWeekday = entries.some((e) => e.day != null && !e.date);
      if (!hasWeekday) {
        const template = dedupeDailyNutritionEntries(
          entries.filter((e) => !e.date && e.cycleDay == null) as never[],
        ) as NutritionEntry[];
        const stamped: NutritionEntry[] = [];
        template.forEach((e) => {
          for (let day = 0; day <= 6; day += 1) {
            stamped.push({ ...e, id: newEntryId(day), day });
          }
        });
        setEntries((list) => [
          ...list.filter((e) => e.date || e.cycleDay != null),
          ...stamped,
        ]);
      }
    }
    setCycleSameDaily(nextSameDaily);
    setCopyOpen(false);
  };

  const copySelectedDayTo = (targetDays: number[]) => {
    const source = entries.filter(
      (e) => e.day === selectedDay && !e.date && e.cycleDay == null,
    );
    if (!source.length) {
      toast('Önce bu güne öğün ekleyin', 'error');
      return;
    }
    const targets = targetDays.filter((d) => d !== selectedDay);
    if (!targets.length) {
      toast('Kopyalanacak başka gün seçin', 'error');
      return;
    }
    setEntries((list) => {
      let next = list.filter(
        (e) => !(targets.includes(e.day as number) && !e.date && e.cycleDay == null),
      );
      targets.forEach((day) => {
        source.forEach((e) => {
          next.push({ ...e, id: newEntryId(day), day });
        });
      });
      return next;
    });
    setCopyOpen(false);
    toast(
      `${WEEKDAYS.find((w) => w.value === selectedDay)?.label || 'Gün'} menüsü ${targets.length} güne kopyalandı`,
      'success',
    );
  };

  const buildEntry = (
    schedulePatch: Partial<NutritionEntry>,
    id?: string,
  ): NutritionEntry => ({
    id: id || newEntryId(),
    mealType,
    name: draft.content.trim(),
    note: draft.note.trim(),
    exerciseName: draft.content.trim(),
    start: draft.start,
    ...schedulePatch,
  });

  const clearDraft = () => {
    setEditingId(null);
    setDraft({
      content: '',
      note: '',
      start: DEFAULT_MEAL_TIMES[mealType] || '08:00',
    });
  };

  const startEdit = (entry: NutritionEntry) => {
    setEditingId(entry.id);
    setMealType(entry.mealType || 'breakfast');
    setDraft({
      content: entry.name || '',
      note: entry.note || '',
      start: entry.start || DEFAULT_MEAL_TIMES[entry.mealType] || '08:00',
    });
    if (entry.date) {
      setSelectedDate(entry.date);
    } else if (entry.day != null && !sameDaily) {
      setSelectedDay(Number(entry.day));
    }
  };

  const cancelEdit = () => {
    clearDraft();
    toast('Düzenleme iptal edildi', 'info');
  };

  const saveEntry = () => {
    if (!draft.content.trim()) {
      toast('Öğün içeriği girin', 'error');
      return;
    }

    if (editingId) {
      setEntries((list) => {
        const target = list.find((e) => e.id === editingId);
        if (!target) return list;

        const patch = {
          mealType,
          name: draft.content.trim(),
          note: draft.note.trim(),
          exerciseName: draft.content.trim(),
          start: draft.start,
        };

        if (sameDaily) {
          const oldKey = `${target.mealType}:${target.start}:${target.name}`;
          return list.map((e) =>
            `${e.mealType}:${e.start}:${e.name}` === oldKey ? { ...e, ...patch } : e,
          );
        }

        const updated = { ...target, ...patch };
        const newKey = entryKey(updated);
        return [
          ...list.filter((e) => e.id !== editingId && entryKey(e) !== newKey),
          updated,
        ];
      });
      clearDraft();
      toast('Öğün güncellendi', 'success');
      return;
    }

    setEntries((list) => {
      let next = [...list];
      const upsert = (patch: Partial<NutritionEntry>) => {
        const key = entryKey({ ...patch, mealType, start: draft.start });
        next = next.filter((e) => entryKey(e) !== key);
        next.push(buildEntry(patch));
      };

      if (sameDaily) {
        for (let day = 0; day <= 6; day += 1) {
          upsert({ day });
        }
      } else if (scheduleMode === 'date') {
        upsert({ date: selectedDate });
      } else {
        upsert({ day: selectedDay });
      }
      return next;
    });
    setDraft((d) => ({ ...d, content: '', note: '' }));
    toast(`${mealLabel(mealType)} eklendi`, 'success');
  };

  const removeEntry = (id: string) => {
    setEntries((list) => {
      const target = list.find((e) => e.id === id);
      if (!target || !sameDaily) {
        return list.filter((e) => e.id !== id);
      }
      const key = `${target.mealType}:${target.start}:${target.name}`;
      return list.filter((e) => `${e.mealType}:${e.start}:${e.name}` !== key);
    });
    if (editingId === id) clearDraft();
  };

  const goStep2 = () => {
    if (!canGoStep2) {
      toast('Geçerli bir zamanlama seçin', 'error');
      return;
    }
    setStep(2);
  };

  const goStep3 = () => {
    if (scheduleMode === 'cycle14' && !cycleSameDaily && missingWeekdays.length > 0) {
      toast(
        `Tüm günlere öğün ekleyin: ${missingWeekdays.map((d) => d.label).join(', ')}`,
        'error',
      );
      return;
    }
    if (!canGoStep3) {
      toast('En az bir öğün ekleyin', 'error');
      return;
    }
    clearDraft();
    setCopyOpen(false);
    setStep(3);
  };

  const submit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast('Liste başlığı girin', 'error');
      return;
    }
    const scoped = scopedEntries(entries, scheduleMode);
    if (scoped.length === 0) {
      toast('En az bir öğün ekleyin', 'error');
      return;
    }
    if (scheduleMode === 'cycle14' && !cycleSameDaily) {
      const missing = WEEKDAYS.filter((d) => !scoped.some((e) => e.day === d.value));
      if (missing.length) {
        toast(
          `Tüm günlere öğün ekleyin: ${missing.map((d) => d.label).join(', ')}`,
          'error',
        );
        return;
      }
    }

    const ordered = sortEntries(scoped);
    const forItems = sameDaily
      ? (dedupeDailyNutritionEntries(ordered as never[]) as NutritionEntry[])
      : ordered;

    const payload: NutritionProgramPayload = {
      title: trimmedTitle,
      description: description.trim(),
      entries: ordered,
      items: forItems.map((e) => entryToText(e, scheduleMode, cycleSameDaily)),
    };

    if (scheduleMode === 'cycle14') {
      payload.scheduleType = 'cycle14';
      payload.cycleStartDate = cycleStartDate;
      payload.cycleLength = CYCLE_PLAN_LENGTH;
      payload.cycleLoop = false;
      payload.cycleSameDaily = cycleSameDaily;
    } else if (scheduleMode === 'weekly') {
      payload.scheduleType = 'weekly';
    } else if (scheduleMode === 'date') {
      payload.scheduleType = 'date';
    }

    if (isEdit) {
      setSubmitting(true);
      try {
        await onUpdate?.(payload);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await onCreate?.(payload);
      setTitle('');
      setDescription('');
      setEntries([]);
      setCycleSameDaily(true);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, step === 2 && styles.rootStep2]}>
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
        <View style={styles.gap}>
          <View style={styles.durationCard}>
            <Text style={styles.blockTitle}>Liste süresi</Text>
            <Text style={styles.blockSub}>
              Zamanlama seçin — tarihler paket penceresi içinde kalmalıdır
            </Text>
            {packageRange ? (
              <Text style={styles.packageChip}>
                Paket: {packageRange.start}
                {packageRange.end ? ` — ${packageRange.end}` : ' (süresiz)'}
              </Text>
            ) : null}

            <Text style={styles.fieldLabel}>Zamanlama</Text>
            <View style={styles.segmentCol}>
              {SCHEDULE_OPTIONS.map((m) => {
                const on = scheduleMode === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setScheduleMode(m.id)}
                    style={[styles.segmentItem, on && styles.segmentItemOn]}>
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {scheduleMode === 'cycle14' ? (
              <View style={styles.innerCard}>
                <Text style={styles.fieldLabelUpper}>Menü tipi</Text>
                <View style={styles.twoCol}>
                  <Pressable
                    onPress={() => applyCycleSameDaily(true)}
                    style={[
                      styles.menuTypeBtn,
                      cycleSameDaily && styles.menuTypeBtnOn,
                    ]}>
                    <Text
                      style={[
                        styles.menuTypeTitle,
                        cycleSameDaily && styles.menuTypeTitleOn,
                      ]}>
                      Her gün aynı
                    </Text>
                    <Text
                      style={[
                        styles.menuTypeSub,
                        cycleSameDaily && styles.menuTypeSubOn,
                      ]}>
                      14 gün boyunca tek menü
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => applyCycleSameDaily(false)}
                    style={[
                      styles.menuTypeBtn,
                      !cycleSameDaily && styles.menuTypeBtnOn,
                    ]}>
                    <Text
                      style={[
                        styles.menuTypeTitle,
                        !cycleSameDaily && styles.menuTypeTitleOn,
                      ]}>
                      Güne göre
                    </Text>
                    <Text
                      style={[
                        styles.menuTypeSub,
                        !cycleSameDaily && styles.menuTypeSubOn,
                      ]}>
                      Her Pzt / Salı / … ayrı menü
                    </Text>
                  </Pressable>
                </View>
                <PlanDateField
                  label="Liste başlangıç tarihi"
                  max={dateBounds.max}
                  min={dateBounds.min}
                  onChange={setCycleStartDate}
                  value={cycleStartDate}
                />
                <Text style={styles.hint}>
                  {cycleSameDaily ? (
                    <Text style={styles.hintStrong}>Her gün aynı menü </Text>
                  ) : (
                    <Text style={styles.hintStrong}>
                      Haftanın gününe göre{' '}
                    </Text>
                  )}
                  {format(parseISO(`${cycleStartDate}T12:00:00`), 'd MMMM', {
                    locale: tr,
                  })}
                  {' — '}
                  {format(parseISO(`${cycleEndDate}T12:00:00`), 'd MMMM yyyy', {
                    locale: tr,
                  })}{' '}
                  tarihleri arasında geçerli ({CYCLE_PLAN_LENGTH} gün).
                </Text>
              </View>
            ) : scheduleMode === 'date' ? (
              <View style={styles.innerCard}>
                <PlanDateField
                  label="İlk tarih (adım 2'de başka tarihler de ekleyebilirsiniz)"
                  max={singleDateBounds.max}
                  min={singleDateBounds.min}
                  onChange={setSelectedDate}
                  value={selectedDate}
                />
              </View>
            ) : (
              <Text style={styles.weeklyHint}>
                Sonraki adımda haftanın günlerine özel öğünler ekleyeceksiniz. Aynı
                gün her hafta tekrarlanır.
              </Text>
            )}
          </View>

          <Button
            disabled={!canGoStep2}
            label="İleri — Liste hazırla"
            onPress={goStep2}
            rightIcon="arrow-forward"
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.gap}>
          {weekdayPicker ? (
            <View style={styles.dayPickerCard}>
              <View style={styles.dayPickerHeader}>
                <Text style={styles.fieldLabelUpper}>Gün seç</Text>
                <Pressable
                  onPress={() => setCopyOpen(true)}
                  style={styles.copyBtn}>
                  <Ionicons color={colors.sage[700]} name="copy-outline" size={14} />
                  <Text style={styles.copyBtnText}>Kopyala</Text>
                </Pressable>
              </View>
              <View style={styles.dayGrid}>
                {WEEKDAYS.map((d) => {
                  const count = entries.filter(
                    (e) => e.day === d.value && !e.date,
                  ).length;
                  const missing =
                    scheduleMode === 'cycle14' && !cycleSameDaily && count === 0;
                  const on = selectedDay === d.value;
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => {
                        setSelectedDay(d.value);
                        setCopyOpen(false);
                      }}
                      style={[
                        styles.dayChip,
                        on && styles.dayChipOn,
                        missing && !on && styles.dayChipMissing,
                      ]}>
                      <Text
                        style={[
                          styles.dayChipLabel,
                          on && styles.dayChipLabelOn,
                          missing && !on && styles.dayChipLabelMissing,
                        ]}>
                        {d.label.slice(0, 3)}
                      </Text>
                      <Text
                        style={[
                          styles.dayChipCount,
                          on && styles.dayChipCountOn,
                          missing && !on && styles.dayChipCountMissing,
                        ]}>
                        {count > 0 ? `${count} öğün` : 'boş'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {scheduleMode === 'cycle14' &&
              !cycleSameDaily &&
              missingWeekdays.length > 0 ? (
                <Text style={styles.missingHint}>
                  Eksik günler: {missingWeekdays.map((d) => d.label).join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {scheduleMode === 'date' ? (
            <View style={styles.innerCard}>
              <PlanDateField
                label="Tarih seç"
                max={singleDateBounds.max}
                min={singleDateBounds.min}
                onChange={setSelectedDate}
                value={selectedDate}
              />
              {datesWithMeals.length > 0 ? (
                <View style={styles.chipRow}>
                  {datesWithMeals.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setSelectedDate(d)}
                      style={[
                        styles.miniChip,
                        d === selectedDate && styles.miniChipOn,
                      ]}>
                      <Text
                        style={[
                          styles.miniChipText,
                          d === selectedDate && styles.miniChipTextOn,
                        ]}>
                        {format(new Date(`${d}T12:00:00`), 'd MMM', { locale: tr })}:{' '}
                        {entries.filter((e) => e.date === d).length}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId ? 'Öğünü düzenle' : 'Öğün ekle'}
              </Text>
              {editingId ? (
                <Pressable onPress={cancelEdit} style={styles.cancelEdit}>
                  <Ionicons color={colors.cream[800]} name="close" size={14} />
                  <Text style={styles.cancelEditText}>İptal</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.mealGrid}>
              {SELECTABLE_MEALS.map((m: { id: string; short: string }) => {
                const ui = MEAL_UI[m.id] || MEAL_UI.breakfast;
                const selected = mealType === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => selectMealType(m.id)}
                    style={[
                      styles.mealTypeBtn,
                      selected && { backgroundColor: ui.btn, borderColor: ui.btn },
                    ]}>
                    <Ionicons
                      color={selected ? colors.white : colors.cream[800]}
                      name={ui.icon}
                      size={16}
                    />
                    <Text
                      style={[
                        styles.mealTypeText,
                        selected && styles.mealTypeTextOn,
                      ]}>
                      {m.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.activeMealBanner,
                { backgroundColor: activeUi.accentBg },
              ]}>
              <Ionicons
                color={activeUi.accentText}
                name={activeUi.icon}
                size={18}
              />
              <Text style={[styles.activeMealText, { color: activeUi.accentText }]}>
                {activeMeal.label}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Öğün saati</Text>
            <Pressable
              onPress={() => setTimeSheetOpen(true)}
              style={styles.timeBtn}>
              <Text style={styles.timeBtnText}>{draft.start}</Text>
              <Ionicons color={colors.cream[800]} name="chevron-down" size={16} />
            </Pressable>

            <Text style={styles.inputLabel}>Öğün içeriği</Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={(content) => setDraft((d) => ({ ...d, content }))}
              placeholder="Örn. Yulaf lapası, muz, 10 badem, yeşil çay"
              placeholderTextColor={colors.cream[300]}
              style={[styles.input, styles.textarea]}
              value={draft.content}
            />
            <TextInput
              onChangeText={(note) => setDraft((d) => ({ ...d, note }))}
              placeholder="Dikkat edilecekler (opsiyonel)"
              placeholderTextColor={colors.cream[300]}
              style={styles.input}
              value={draft.note}
            />
            <Pressable
              onPress={saveEntry}
              style={[styles.saveMealBtn, { backgroundColor: activeUi.btn }]}>
              <Ionicons
                color={colors.white}
                name={editingId ? 'pencil' : 'add'}
                size={16}
              />
              <Text style={styles.saveMealText}>
                {editingId
                  ? `${mealLabel(mealType)} Güncelle`
                  : `${mealLabel(mealType)} Ekle`}
              </Text>
            </Pressable>
          </View>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>
              {scheduleLabel}
              <Text style={styles.listCount}> · {activeEntries.length} öğün</Text>
            </Text>
            {activeEntries.length === 0 ? (
              <Text style={styles.emptyList}>Öğün ekleyin — formdan başlayın</Text>
            ) : (
              activeEntries.map((e) => {
                const ui = MEAL_UI[e.mealType] || MEAL_UI.breakfast;
                const isEditing = editingId === e.id;
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.entryCard,
                      { backgroundColor: ui.accentBg },
                      isEditing && styles.entryCardEditing,
                    ]}>
                    <View style={styles.entryRow}>
                      <View
                        style={[styles.entryIcon, { backgroundColor: ui.btn }]}>
                        <Ionicons color={colors.white} name={ui.icon} size={18} />
                      </View>
                      <View style={styles.entryBody}>
                        <View style={styles.entryMeta}>
                          <Text style={styles.entryMeal}>
                            {mealLabel(e.mealType)}
                          </Text>
                          {e.start ? (
                            <View style={styles.timePill}>
                              <Text style={styles.timePillText}>{e.start}</Text>
                            </View>
                          ) : null}
                          {isEditing ? (
                            <View style={styles.editingPill}>
                              <Text style={styles.editingPillText}>
                                Düzenleniyor
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.entryName}>{e.name}</Text>
                        {e.note ? (
                          <Text style={styles.entryNote}>Not: {e.note}</Text>
                        ) : null}
                      </View>
                      <View style={styles.entryActions}>
                        <Pressable
                          hitSlop={8}
                          onPress={() => startEdit(e)}
                          style={styles.iconBtn}>
                          <Ionicons
                            color={colors.sage[700]}
                            name="pencil-outline"
                            size={16}
                          />
                        </Pressable>
                        <Pressable
                          hitSlop={8}
                          onPress={() => removeEntry(e.id)}
                          style={styles.iconBtn}>
                          <Ionicons
                            color={colors.danger[600]}
                            name="trash-outline"
                            size={16}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.stepNav}>
            <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Geri</Text>
            </Pressable>
            <Pressable
              disabled={!canGoStep3}
              onPress={goStep3}
              style={[styles.nextBtn, !canGoStep3 && styles.nextBtnDisabled]}>
              <Text style={styles.nextBtnText}>Önizlemeye geç</Text>
              <Ionicons color={colors.white} name="arrow-forward" size={16} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.gap}>
          <View style={styles.titleCard}>
            <Text style={styles.titleCardLabel}>Liste başlığı</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder={`${memberName} için beslenme listesi`}
              placeholderTextColor={colors.cream[300]}
              style={styles.titleInput}
              value={title}
            />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Liste özeti</Text>
              <Text style={styles.summaryMeta}>
                {scheduleModeLabel} · {scheduleSummary} · {mealCount} öğün
              </Text>
            </View>

            {weekdayPicker
              ? daysWithMeals.map((day) => {
                  const dayEntries = sortEntries(
                    allScoped.filter((e) => e.day === day),
                  );
                  return (
                    <View key={day} style={styles.summaryBlock}>
                      <View style={styles.summaryDayRow}>
                        <View style={styles.dayBadge}>
                          <Text style={styles.dayBadgeText}>
                            {WEEKDAYS.find((w) => w.value === day)?.label || 'Gün'}
                          </Text>
                        </View>
                        <Text style={styles.summaryCount}>
                          {dayEntries.length} öğün
                        </Text>
                      </View>
                      {dayEntries.map((entry, idx) => {
                        const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast;
                        return (
                          <View key={entry.id} style={styles.summaryItem}>
                            <View
                              style={[
                                styles.summaryNum,
                                { backgroundColor: ui.btn },
                              ]}>
                              <Text style={styles.summaryNumText}>{idx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.summaryMeal}>
                                {mealLabel(entry.mealType)}
                                {entry.start ? ` · ${entry.start}` : ''}
                              </Text>
                              <Text style={styles.summaryContent}>
                                {entry.name}
                                {entry.note ? ` · ${entry.note}` : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              : scheduleMode === 'date'
                ? datesWithMeals.map((date) => {
                    const dateEntries = sortEntries(
                      allScoped.filter((e) => e.date === date),
                    );
                    return (
                      <View key={date} style={styles.summaryBlock}>
                        <View style={styles.summaryDayRow}>
                          <View style={styles.dayBadge}>
                            <Text style={styles.dayBadgeText}>
                              {format(
                                new Date(`${date}T12:00:00`),
                                'd MMMM yyyy, EEEE',
                                { locale: tr },
                              )}
                            </Text>
                          </View>
                          <Text style={styles.summaryCount}>
                            {dateEntries.length} öğün
                          </Text>
                        </View>
                        {dateEntries.map((entry, idx) => {
                          const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast;
                          return (
                            <View key={entry.id} style={styles.summaryItem}>
                              <View
                                style={[
                                  styles.summaryNum,
                                  { backgroundColor: ui.btn },
                                ]}>
                                <Text style={styles.summaryNumText}>{idx + 1}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.summaryMeal}>
                                  {mealLabel(entry.mealType)}
                                  {entry.start ? ` · ${entry.start}` : ''}
                                </Text>
                                <Text style={styles.summaryContent}>
                                  {entry.name}
                                  {entry.note ? ` · ${entry.note}` : ''}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                : (
                  <View style={styles.summaryBlock}>
                    <View style={styles.summaryDayRow}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Günlük menü</Text>
                      </View>
                      <Text style={styles.summaryCount}>
                        {displayEntries.length} öğün
                      </Text>
                    </View>
                    {displayEntries.map((entry, idx) => {
                      const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast;
                      return (
                        <View
                          key={entry.id || `${entry.mealType}-${idx}`}
                          style={styles.summaryItem}>
                          <View
                            style={[
                              styles.summaryNum,
                              { backgroundColor: ui.btn },
                            ]}>
                            <Text style={styles.summaryNumText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.summaryMeal}>
                              {mealLabel(entry.mealType)}
                              {entry.start ? ` · ${entry.start}` : ''}
                            </Text>
                            <Text style={styles.summaryContent}>
                              {entry.name}
                              {entry.note ? ` · ${entry.note}` : ''}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
          </View>

          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setDescription}
            placeholder="Son notlar (su tüketimi, alerjiler vb.)"
            placeholderTextColor={colors.cream[300]}
            style={[styles.input, styles.textarea]}
            value={description}
          />

          <View style={styles.stepNav}>
            <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Geri</Text>
            </Pressable>
            <Pressable
              disabled={submitting}
              onPress={() => void submit()}
              style={[styles.sendBtn, submitting && styles.nextBtnDisabled]}>
              <Ionicons color={colors.white} name="send" size={16} />
              <Text style={styles.nextBtnText}>
                {submitting
                  ? 'Gönderiliyor…'
                  : submitLabel ||
                    (isEdit
                      ? 'Beslenme Listesini Kaydet'
                      : 'Beslenme Listesini Gönder')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <SelectSheet
        onClose={() => setTimeSheetOpen(false)}
        onSelect={(v) => setDraft((d) => ({ ...d, start: v }))}
        options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
        title="Öğün saati"
        value={draft.start}
        visible={timeSheetOpen}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setCopyOpen(false)}
        transparent
        visible={copyOpen}>
        <Pressable onPress={() => setCopyOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.copySheet}>
            <Text style={styles.copySheetTitle}>Seçili günü kopyala</Text>
            <Pressable
              onPress={() => copySelectedDayTo(WEEKDAYS.map((d) => d.value))}
              style={styles.copyRow}>
              <Text style={styles.copyRowText}>Tüm günlere kopyala</Text>
            </Pressable>
            {WEEKDAYS.filter((d) => d.value !== selectedDay).map((d) => (
              <Pressable
                key={d.value}
                onPress={() => copySelectedDayTo([d.value])}
                style={styles.copyRow}>
                <Text style={styles.copyRowText}>→ {d.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  rootStep2: { paddingBottom: spacing.xl },
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
  stepDotActive: { backgroundColor: colors.sage[500] },
  stepDotDone: { backgroundColor: colors.sage[500] },
  stepNum: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  stepNumActive: { color: colors.white },
  stepLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
  },
  stepLabelActive: { color: colors.sage[700], opacity: 1 },
  stepLabelDone: { color: colors.sage[700], opacity: 1 },
  stepLine: {
    position: 'absolute',
    right: -8,
    top: 15,
    width: 16,
    height: 2,
    backgroundColor: colors.cream[100],
  },
  stepLineDone: { backgroundColor: colors.sage[400] },
  gap: { gap: spacing.md },
  durationCard: {
    backgroundColor: colors.sage[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sage[200],
    padding: spacing.lg,
    gap: spacing.md,
  },
  blockTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    color: colors.cream[900],
  },
  blockSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.65,
  },
  packageChip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cream[100],
  },
  fieldLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  fieldLabelUpper: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.sage[700],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  segmentCol: { gap: 8 },
  segmentItem: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  segmentItemOn: {
    backgroundColor: colors.sage[500],
    borderColor: colors.sage[500],
  },
  segmentText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
  },
  segmentTextOn: { color: colors.white },
  innerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage[200],
    padding: spacing.md,
    gap: spacing.md,
  },
  twoCol: { gap: 8 },
  menuTypeBtn: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  menuTypeBtnOn: {
    backgroundColor: colors.sage[500],
    borderColor: colors.sage[500],
  },
  menuTypeTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
  },
  menuTypeTitleOn: { color: colors.white },
  menuTypeSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
    marginTop: 2,
  },
  menuTypeSubOn: { color: colors.white, opacity: 0.85 },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.sage[700],
    lineHeight: 20,
  },
  hintStrong: { fontFamily: fonts.sansSemi },
  weeklyHint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.sage[700],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage[100],
    padding: spacing.md,
  },
  dayPickerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[100],
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sage[50],
    borderWidth: 1,
    borderColor: colors.sage[200],
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayChipOn: {
    backgroundColor: colors.sage[500],
    borderColor: colors.sage[500],
  },
  dayChipMissing: {
    backgroundColor: colors.warm[50],
    borderColor: colors.warm[200],
  },
  dayChipLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
  },
  dayChipLabelOn: { color: colors.white },
  dayChipLabelMissing: { color: colors.warm[500] },
  dayChipCount: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
    marginTop: 4,
  },
  dayChipCountOn: { color: colors.white, opacity: 0.85 },
  dayChipCountMissing: { color: colors.warm[500], opacity: 0.8 },
  missingHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.warm[500],
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniChip: {
    borderRadius: radius.full,
    backgroundColor: colors.sage[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  miniChipOn: { backgroundColor: colors.sage[500] },
  miniChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.sage[700],
  },
  miniChipTextOn: { color: colors.white },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage[100],
    padding: spacing.md,
    gap: spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.sage[700],
  },
  cancelEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelEditText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
  },
  mealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypeBtn: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  mealTypeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
    flex: 1,
  },
  mealTypeTextOn: { color: colors.white },
  activeMealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  activeMealText: { fontFamily: fonts.sansSemi, fontSize: 15 },
  inputLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timeBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
    backgroundColor: colors.white,
  },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  saveMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  saveMealText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.white,
  },
  listCard: {
    backgroundColor: colors.cream[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.sm,
  },
  listTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  listCount: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.5,
  },
  emptyList: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.4,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  entryCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  entryCardEditing: { borderColor: colors.sage[400] },
  entryRow: { flexDirection: 'row', gap: 12 },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBody: { flex: 1, gap: 4 },
  entryMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  entryMeal: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  timePill: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timePillText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.7,
  },
  editingPill: {
    backgroundColor: colors.sage[500],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editingPillText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.white,
  },
  entryName: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    lineHeight: 18,
  },
  entryNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  entryActions: { gap: 4 },
  iconBtn: { padding: 6 },
  stepNav: { flexDirection: 'row', gap: 8 },
  backBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.sage[500],
    paddingVertical: 14,
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.white,
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.sage[500],
    paddingVertical: 14,
  },
  titleCard: {
    backgroundColor: colors.sage[500],
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titleCardLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleInput: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream[900],
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[100],
    overflow: 'hidden',
  },
  summaryHead: {
    backgroundColor: colors.cream[50],
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
    gap: 4,
  },
  summaryTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  summaryMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.65,
  },
  summaryBlock: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
    gap: spacing.sm,
  },
  summaryDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dayBadge: {
    backgroundColor: colors.sage[100],
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  summaryCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
  },
  summaryItem: { flexDirection: 'row', gap: 10 },
  summaryNum: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  summaryNumText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.white,
  },
  summaryMeal: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  summaryContent: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  copySheet: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4,
  },
  copySheetTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  copyRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  copyRowText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
});
