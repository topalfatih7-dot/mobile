/**
 * Web parity: Adsız `src/components/chat/MemberProgramsPanel.jsx`
 * MOBILE DIFF: violet gradient yok — brand/sage tokenları.
 */
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/theme';
import { AVAILABILITY_WEEKDAYS } from '@/utils/memberAvailability';
import { mealLabel } from '@/utils/programSchedule';

type ProgramEntry = {
  id?: string;
  date?: string;
  day?: number | string;
  exerciseName?: string;
  name?: string;
  note?: string;
  start?: string;
  end?: string;
  amount?: number | string;
  amountType?: string;
  durationUnit?: string;
  mealType?: string;
};

type Program = {
  id: string;
  type?: string;
  title?: string;
  staffName?: string;
  entries?: ProgramEntry[];
};

function dayName(v: number | string) {
  return AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || '';
}

function groupKey(e: ProgramEntry) {
  if (e.date) return `date:${e.date}`;
  if (e.day != null && e.day !== '') return `day:${e.day}`;
  return 'other';
}

function groupLabel(key: string) {
  if (key.startsWith('date:')) {
    const d = key.slice(5);
    try {
      return format(new Date(`${d}T12:00:00`), 'd MMM yyyy', { locale: tr });
    } catch {
      return d;
    }
  }
  if (key.startsWith('day:')) return dayName(key.slice(4));
  return 'Diğer';
}

function groupEntries(entries: ProgramEntry[] = []) {
  const groups: Record<string, ProgramEntry[]> = {};
  entries.forEach((e) => {
    const key = groupKey(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.keys(groups)
    .sort()
    .map((key) => ({ key, label: groupLabel(key), items: groups[key] }));
}

function amountText(e: ProgramEntry) {
  return e.amountType === 'duration'
    ? `${e.amount} ${e.durationUnit || 'sn'}`
    : `${e.amount} tekrar`;
}

function ProgramBlock({ program }: { program: Program }) {
  const groups = useMemo(
    () => groupEntries(program.entries || []),
    [program.entries],
  );
  const isWorkout = program.type === 'workout';

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.cardHeader,
          { backgroundColor: isWorkout ? colors.brand[500] : colors.sage[500] },
        ]}>
        <Ionicons
          color={colors.white}
          name={isWorkout ? 'barbell-outline' : 'nutrition-outline'}
          size={16}
        />
        <View style={styles.cardHeaderMeta}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {program.title ||
              (isWorkout ? 'Antrenman Programı' : 'Beslenme Listesi')}
          </Text>
          <Text style={styles.cardSub}>
            {isWorkout ? 'Koç' : 'Diyetisyen'}: {program.staffName || '—'}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        {groups.length === 0 ? (
          <Text style={styles.emptyInline}>Henüz içerik eklenmemiş.</Text>
        ) : (
          groups.map((g) => (
            <View key={g.key} style={styles.group}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              {g.items.map((item, idx) => (
                <View key={String(item.id || idx)} style={styles.item}>
                  {isWorkout ? (
                    <>
                      <Text style={styles.itemTitle}>
                        {item.exerciseName || item.name}
                      </Text>
                      {(item.start || item.amount) && (
                        <Text style={styles.itemMeta}>
                          {item.start && item.end
                            ? `${item.start}–${item.end}`
                            : amountText(item)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={[styles.itemTitle, { color: colors.sage[700] }]}>
                        {mealLabel(item.mealType)}
                      </Text>
                      <Text style={styles.itemMeta}>{item.name || item.note}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

type Props = {
  programs?: Program[];
  memberName?: string;
  compact?: boolean;
  roleFilter?: string | null;
};

export function MemberProgramsPanel({
  programs = [],
  memberName,
  compact = false,
  roleFilter,
}: Props) {
  const workouts = programs.filter((p) => p.type === 'workout');
  const nutrition = programs.filter((p) => p.type === 'nutrition');
  const showWorkouts = roleFilter !== 'dietitian';
  const showNutrition = roleFilter !== 'coach';
  const visible = [
    ...(showWorkouts ? workouts : []),
    ...(showNutrition ? nutrition : []),
  ];

  if (!visible.length) {
    const emptyLabel =
      roleFilter === 'coach'
        ? 'Henüz antrenman programı yok'
        : roleFilter === 'dietitian'
          ? 'Henüz beslenme listesi yok'
          : 'Henüz program veya liste yok';
    return (
      <View style={styles.emptyBox}>
        <Ionicons color={colors.cream[300]} name="clipboard-outline" size={22} />
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={compact ? styles.stackCompact : styles.stack}>
      {memberName && !compact ? (
        <Text style={styles.memberBanner}>{memberName} — program özeti</Text>
      ) : null}
      {showWorkouts
        ? workouts.map((p) => <ProgramBlock key={p.id} program={p} />)
        : null}
      {showNutrition
        ? nutrition.map((p) => <ProgramBlock key={p.id} program={p} />)
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  stackCompact: { gap: spacing.sm },
  memberBanner: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardHeaderMeta: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.white,
  },
  cardSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  cardBody: { padding: 10, gap: 10, maxHeight: 220 },
  group: { gap: 6 },
  groupLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  item: {
    borderRadius: radius.lg,
    backgroundColor: colors.cream[50],
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
  },
  itemMeta: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.7,
  },
  emptyInline: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
  },
  emptyBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
    gap: 6,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
    textAlign: 'center',
  },
});
