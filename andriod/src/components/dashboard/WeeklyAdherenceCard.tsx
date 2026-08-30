import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/theme';

type Day = {
  dateStr: string;
  isFuture?: boolean;
  workout?: { planned: number; done: number };
  meal?: { planned: number; done: number };
};

export function WeeklyAdherenceCard({
  title,
  icon,
  metric,
  accent,
  data,
  emptyMessage,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  metric: 'workout' | 'meal';
  accent: 'brand' | 'sage';
  data: { thisWeek?: { days?: Day[]; workout?: { planned: number; done: number }; meal?: { planned: number; done: number } } };
  emptyMessage: string;
}) {
  const week = data?.thisWeek;
  const days = week?.days || [];
  const totals = metric === 'workout' ? week?.workout : week?.meal;
  const planned = totals?.planned || 0;
  const accentColor = accent === 'brand' ? colors.brand[500] : colors.sage[500];

  if (!planned) {
    return (
      <View style={styles.card}>
        <View style={styles.head}>
          <Ionicons color={accentColor} name={icon} size={18} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons color={colors.cream[300]} name="stats-chart-outline" size={28} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons color={accentColor} name={icon} size={18} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {totals?.done || 0}/{planned}
        </Text>
      </View>
      <View style={styles.bars}>
        {days.map((d) => {
          const cell = metric === 'workout' ? d.workout : d.meal;
          const p = cell?.planned || 0;
          const done = cell?.done || 0;
          const ratio = p ? Math.min(1, done / p) : 0;
          return (
            <View key={d.dateStr} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.max(ratio * 100, p ? 8 : 0)}%`,
                      backgroundColor: d.isFuture ? colors.cream[300] : accentColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{d.dateStr.slice(8)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    minHeight: 180,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  meta: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  empty: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.5,
    textAlign: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    width: '70%',
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.cream[100],
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800], opacity: 0.55 },
});
