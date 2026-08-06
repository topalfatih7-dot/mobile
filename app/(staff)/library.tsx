import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn as ReFadeIn, FadeOut as ReFadeOut } from 'react-native-reanimated';

import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { fetchExercisesPage } from '@/services/exerciseLibrary';
import { colors, fonts, radius, spacing } from '@/theme';

const LOCATIONS = [
  { id: 'home', label: 'Ev' },
  { id: 'gym', label: 'Salon' },
  { id: 'office', label: 'Ofis' },
];

/** Görünen etiket TR — filtre/veri değerleri İngilizce kalır (member paritesi). */
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const ITEM_HEIGHT = 90; // padding 16*2 + thumbnail 64 - some margin

/** LOCK: docs/mobile/screens/staff/library.md */
export default function StaffLibrary() {
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [location, setLocation] = useState('');
  const [requiresMachine, setRequiresMachine] = useState('');
  const [active, setActive] = useState<Record<string, unknown> | null>(null);
  const [exercises, setExercises] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFilterCount = [difficulty, location, requiresMachine].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExercisesPage({
        page: 1,
        pageSize: 200,
        filters: { search, difficulty, location, requiresMachine },
      });
      setExercises(res.items);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, location, requiresMachine]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const s = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (s && !String(ex.name || '').toLowerCase().includes(s)) return false;
      if (difficulty && String(ex.difficulty) !== difficulty) return false;
      if (location && !(ex.locations as string[] | undefined)?.includes(location))
        return false;
      if (requiresMachine === 'true' && !ex.requiresMachine) return false;
      return true;
    });
  }, [search, difficulty, location, requiresMachine, exercises]);

  return (
    <PanelScaffold subtitle="Egzersiz kütüphanesi" title="Kütüphane">
      <View style={styles.searchRow}>
        <Ionicons color={colors.cream[800]} name="search" size={18} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Ara…"
          placeholderTextColor={colors.cream[300]}
          style={styles.searchInput}
          value={search}
        />
      </View>

      <Pressable onPress={() => setFiltersOpen((v) => !v)} style={styles.filterToggle}>
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
        <Animated.View
          entering={ReFadeIn.duration(180)}
          exiting={ReFadeOut.duration(140)}
          style={styles.filters}>
          {['beginner', 'intermediate', 'advanced'].map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty((cur) => (cur === d ? '' : d))}
              style={[styles.chip, difficulty === d && styles.chipOn]}>
              <Text style={[styles.chipText, difficulty === d && styles.chipTextOn]}>
                {DIFFICULTY_LABELS[d] || d}
              </Text>
            </Pressable>
          ))}
          {LOCATIONS.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => setLocation((cur) => (cur === l.id ? '' : l.id))}
              style={[styles.chip, location === l.id && styles.chipOn]}>
              <Text style={[styles.chipText, location === l.id && styles.chipTextOn]}>
                {l.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setRequiresMachine((cur) => (cur === 'true' ? '' : 'true'))}
            style={[styles.chip, requiresMachine === 'true' && styles.chipOn]}>
            <Text
              style={[styles.chipText, requiresMachine === 'true' && styles.chipTextOn]}>
              Makine
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <FlatList
        data={items}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialNumToRender={15}
        keyExtractor={(ex) => String(ex.id)}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        windowSize={5}
        ListEmptyComponent={
          loading ? (
            <InlineSpinner fill />
          ) : (
            <EmptyState description="Filtreleri temizleyip tekrar deneyin." title="Sonuç yok" />
          )
        }
        renderItem={({ item: ex, index: i }) => (
          <FadeIn delay={40 + i * 30}>
            <Pressable onPress={() => setActive(ex)} style={styles.row}>
              <ExerciseVideoThumbnail
                pending={Boolean(ex.videoPending)}
                size={64}
                videoUrl={ex.videoUrl as string}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{String(ex.name)}</Text>
                <Text style={styles.rowMeta}>
                  {String(ex.bodyPart || '')}
                  {ex.difficulty
                    ? ` · ${DIFFICULTY_LABELS[String(ex.difficulty)] || String(ex.difficulty)}`
                    : ''}
                  {ex.requiresMachine ? ' · Makine' : ''}
                </Text>
              </View>
              <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
            </Pressable>
          </FadeIn>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <Modal animationType="slide" transparent visible={Boolean(active)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{String(active?.name || '')}</Text>
            <Text style={styles.modalMeta}>
              {String(active?.bodyPart || '')}
              {active?.requiresMachine ? ' · Makine' : ''}
            </Text>
            <View style={styles.player}>
              <Text style={styles.noVideo}>
                {active?.videoPending ? 'Video hazırlanıyor…' : 'Video yok'}
              </Text>
            </View>
            <Pressable onPress={() => setActive(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterToggleText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[600] },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.sage[600], borderColor: colors.sage[600] },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  chipTextOn: { color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
  },
  rowTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.cream[900] },
  modalMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  player: {
    height: 220,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideo: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], textAlign: 'center' },
  closeBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  closeText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  list: { flex: 1 },
});
