import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  dedupeDailyNutritionEntries,
  formatEntrySchedule,
  mealContentText,
  mealLabel,
  usesLegacyCycleDayRotation,
} from '@/utils/programSchedule';
import { colors, fonts, radius, spacing } from '@/theme';

type ListCard = {
  id: string;
  memberId: string;
  title: string;
  memberName: string;
  createdAt: string | null;
  description: string;
  scheduleType: string;
  cycleSameDaily: boolean;
  mealCount: number;
  entries: Record<string, unknown>[];
  items: string[];
  program: Record<string, unknown>;
};

/** LOCK: docs/mobile/screens/staff/lists.md — web StaffListsPage parity */
export default function StaffLists() {
  const { staff } = useAuth();
  const { loading, programs, staffClients } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);

  const cards = useMemo(() => {
    const nameById = new Map(
      staffClients.map((c) => [String(c.id), String(c.name || 'Danışan')]),
    );
    const clientIds = new Set(staffClients.map((c) => String(c.id)));
    const staffId = staff?.id ? String(staff.id) : null;

    return programs
      .filter((p) => {
        if (String(p.type || '') !== 'nutrition') return false;
        const mid = String(p.memberId || '');
        if (clientIds.has(mid)) return true;
        if (staffId && String((p as { staffId?: string }).staffId || '') === staffId)
          return true;
        return false;
      })
      .map((p): ListCard => {
        const entries = Array.isArray(p.entries)
          ? (p.entries as Record<string, unknown>[])
          : [];
        const mealCount =
          p.scheduleType === 'cycle14' &&
          p.cycleSameDaily !== false &&
          !usesLegacyCycleDayRotation(p as never)
            ? dedupeDailyNutritionEntries(entries as never[]).length
            : new Set(
                entries.map(
                  (e) =>
                    `${e.cycleDay ?? e.date ?? e.day}_${e.mealType}`,
                ),
              ).size;
        return {
          id: String(p.id),
          memberId: String(p.memberId || ''),
          title: String(p.title || 'Beslenme'),
          memberName:
            nameById.get(String(p.memberId || '')) ||
            String((p as { memberName?: string }).memberName || 'Danışan'),
          createdAt: p.createdAt ? String(p.createdAt) : null,
          description: String(p.description || ''),
          scheduleType: String(p.scheduleType || ''),
          cycleSameDaily: p.cycleSameDaily !== false,
          mealCount,
          entries,
          items: Array.isArray(p.items) ? (p.items as string[]) : [],
          program: p as Record<string, unknown>,
        };
      });
  }, [programs, staffClients, staff?.id]);

  const renderList = useCallback(
    ({ item: l }: { item: ListCard }) => {
      const open = expanded === l.id;
      return (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Pressable
              onPress={() => setExpanded(open ? null : l.id)}
              style={styles.cardMain}>
              <View style={styles.iconWrap}>
                <Ionicons color={colors.sage[600]} name="nutrition-outline" size={22} />
              </View>
              <View style={styles.body}>
                <Text numberOfLines={1} style={styles.title}>
                  {l.title}
                </Text>
                {l.scheduleType === 'cycle14' ? (
                  <Text style={styles.cycleTag}>
                    {l.cycleSameDaily === false
                      ? '14 gün · güne göre'
                      : '14 gün · her gün aynı'}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Ionicons color={colors.cream[800]} name="person-outline" size={12} />
                  <Text style={styles.member}>
                    {l.memberName}
                    {l.createdAt
                      ? ` · ${format(new Date(l.createdAt), 'd MMM yyyy', {
                          locale: tr,
                        })}`
                      : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{l.mealCount} öğün</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(
                  `/(staff)/clients/${l.memberId}/list?programId=${l.id}` as Href,
                )
              }
              style={styles.editBtn}>
              <Ionicons color={colors.sage[700]} name="pencil-outline" size={14} />
              <Text style={styles.editText}>Düzenle</Text>
            </Pressable>
          </View>

          {open ? (
            <View style={styles.expanded}>
              {l.description ? (
                <Text style={styles.description}>{l.description}</Text>
              ) : null}
              {l.entries.length > 0 ? (
                l.entries.map((entry) => (
                  <View
                    key={String(
                      entry.id || `${entry.mealType}-${entry.day}-${entry.date}`,
                    )}
                    style={styles.entry}>
                    <Text style={styles.entrySchedule}>
                      {formatEntrySchedule(entry as never, l.program as never)}
                    </Text>
                    <Text style={styles.entryMeal}>
                      {mealLabel(entry.mealType as string)}
                    </Text>
                    <Text style={styles.entryContentLabel}>Öğün içeriği</Text>
                    <Text style={styles.entryContent}>
                      {String(entry.name || '') ||
                        mealContentText([entry] as never[])}
                    </Text>
                    {entry.note ? (
                      <Text style={styles.entryNote}>Not: {String(entry.note)}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                l.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.dot} />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
      );
    },
    [expanded],
  );

  return (
    <PanelScaffold
      scroll={false}
      subtitle={`${cards.length} liste · danışan takviminde görünür`}
      title="Beslenme Listelerim">
      {loading && cards.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <FlatList
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 16, flexGrow: 1 }}
          data={cards}
          extraData={expanded}
          initialNumToRender={8}
          keyExtractor={(l) => l.id}
          ListEmptyComponent={
            <EmptyState
              description="Danışanlarım sayfasından bir danışan seçip beslenme listesi oluşturabilirsiniz."
              title="Henüz liste oluşturulmadı"
            />
          }
          maxToRenderPerBatch={6}
          removeClippedSubviews
          renderItem={renderList}
          style={{ flex: 1 }}
          windowSize={7}
        />
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.sage[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  title: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  cycleTag: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.sage[700],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  member: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  countBadge: {
    borderRadius: radius.full,
    backgroundColor: colors.sage[50],
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sage[200],
    backgroundColor: colors.sage[50],
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.cream[100],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.7,
    marginBottom: 4,
  },
  entry: {
    backgroundColor: colors.sage[50],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  entrySchedule: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.sage[700],
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entryMeal: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.sage[700],
  },
  entryContentLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  entryContent: {
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
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.cream[50],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage[400],
    marginTop: 6,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
  },
});
