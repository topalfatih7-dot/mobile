import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { fetchStaffNutritionLists, type DbProgram } from '@/services/db/programs';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Ara öğün',
  brunch: 'Brunch',
};

/** Web `StaffListsPage` — personelin nutrition program listeleri. */
export default function StaffListsScreen() {
  const { staff } = useApp();
  const [lists, setLists] = useState<DbProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!staff?.id) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setLists(await fetchStaffNutritionLists(staff.id));
    } finally {
      setLoading(false);
    }
  }, [staff?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader
        showBack
        subtitle={lists.length ? `${lists.length} liste · danışan takviminde görünür` : 'Beslenme listeleri'}
        title="Listeler"
      />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.teal[600]} size="large" style={styles.loader} />
        ) : lists.length === 0 ? (
          <EmptyState
            subtitle="Danışanlarım sayfasından bir danışan seçip beslenme listesi oluşturabilirsiniz."
            title="Henüz liste oluşturulmadı"
          />
        ) : (
          lists.map((p) => {
            const open = expanded === p.id;
            const mealCount = new Set(
              (p.entries || []).map((e) => `${e.date ?? e.day}_${e.mealType}`),
            ).size;
            return (
              <View key={p.id} style={styles.card}>
                <Pressable onPress={() => setExpanded(open ? null : p.id)} style={styles.cardHead}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{p.title || 'Beslenme listesi'}</Text>
                    <Text style={styles.meta}>
                      {p.memberName || 'Danışan'}
                      {p.createdAt
                        ? ` · ${new Date(p.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{mealCount || p.items.length} öğün</Text>
                  </View>
                </Pressable>
                {open ? (
                  <View style={styles.detail}>
                    {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
                    {p.entries?.length > 0
                      ? p.entries.map((entry) => (
                          <View key={entry.id} style={styles.entry}>
                            <Text style={styles.meal}>
                              {MEAL_LABELS[String(entry.mealType || '')] || entry.mealType || 'Öğün'}
                            </Text>
                            <Text style={styles.entryName}>{entry.name || '—'}</Text>
                            {entry.note ? (
                              <Text style={styles.note}>Not: {String(entry.note)}</Text>
                            ) : null}
                          </View>
                        ))
                      : (p.items || []).map((item, i) => (
                          <Text key={i} style={styles.item}>
                            · {String(item)}
                          </Text>
                        ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  loader: { marginTop: spacing.xxl },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  flex: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text.muted, marginTop: 4 },
  badge: {
    backgroundColor: colors.teal[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.teal[700] },
  detail: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  desc: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  entry: {
    backgroundColor: colors.teal[50],
    borderRadius: radius.md,
    padding: spacing.md,
  },
  meal: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.teal[700],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  entryName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.primary, marginTop: 4 },
  note: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: 4 },
  item: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.secondary, lineHeight: 22 },
});
