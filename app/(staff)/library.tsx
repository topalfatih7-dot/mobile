import { Ionicons } from '@expo/vector-icons';
import { Redirect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn as ReFadeIn, FadeOut as ReFadeOut } from 'react-native-reanimated';

import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import {
  DIFFICULTY_LABELS,
  EXERCISE_CATEGORY_ALL,
  formatExerciseLocations,
} from '@/data/exerciseLabels';
import { fetchDistinctExerciseCategories, fetchExercisesPage } from '@/services/exerciseLibrary';
import { prefetchExerciseVideo } from '@/services/exerciseMedia';
import { normalizeStaffRole } from '@/utils/staffClients';
import { colors, fonts, radius, spacing } from '@/theme';

/** Web CoachProgramEditor / staff library browse pageSize. */
const STAFF_LIBRARY_PAGE_SIZE = 20;

const LOCATIONS = [
  { id: 'home', label: 'Ev' },
  { id: 'gym', label: 'Salon' },
  { id: 'office', label: 'Ofis' },
];

const ITEM_HEIGHT = 98;
const ITEM_MARGIN = 8;

/** LOCK: docs/mobile/screens/staff/library.md — web StaffLibraryGate + ExerciseLibraryPage staffMode */
export default function StaffLibrary() {
  const { staff } = useAuth();
  const role = normalizeStaffRole(staff?.role as string);

  if (role === 'dietitian') {
    return <Redirect href={'/(staff)/lists' as Href} />;
  }
  if (role !== 'coach') {
    return <Redirect href={'/(staff)' as Href} />;
  }

  return <StaffLibraryScreen />;
}

function StaffLibraryScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState(EXERCISE_CATEGORY_ALL);
  const [difficulty, setDifficulty] = useState('');
  const [location, setLocation] = useState('');
  const [requiresMachine, setRequiresMachine] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Record<string, unknown> | null>(null);

  const activeFilterCount = [
    search.trim(),
    category !== EXERCISE_CATEGORY_ALL ? category : '',
    difficulty,
    location,
    requiresMachine,
  ].filter(Boolean).length;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      try {
        const res = await fetchExercisesPage({
          page: pageNum,
          pageSize: STAFF_LIBRARY_PAGE_SIZE,
          filters: {
            search: debouncedSearch,
            category: category === EXERCISE_CATEGORY_ALL ? '' : category,
            difficulty,
            location,
            requiresMachine,
          },
        });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        if (!append) setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, category, difficulty, location, requiresMachine],
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  useEffect(() => {
    void fetchDistinctExerciseCategories().then(setCategories);
  }, []);

  const openExercise = useCallback((ex: Record<string, unknown>) => {
    if (ex.videoUrl && !ex.videoPending) {
      prefetchExerciseVideo(ex.videoUrl);
    }
    setActive(ex);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Record<string, unknown>; index: number }) => {
      const locLabels = formatExerciseLocations(item.locations).slice(0, 2);
      return (
        <FadeIn delay={Math.min(40 + index * 20, 200)}>
          <Pressable
            onPress={() => openExercise(item)}
            onPressIn={() => {
              if (item.videoUrl && !item.videoPending) {
                prefetchExerciseVideo(item.videoUrl);
              }
            }}
            style={styles.row}>
            <ExerciseVideoThumbnail
              pending={Boolean(item.videoPending)}
              size={64}
              videoUrl={item.videoUrl as string}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.rowTitle}>{String(item.name)}</Text>
              <Text style={styles.rowMeta}>
                {String(item.bodyPart || item.category || '')}
                {item.difficulty
                  ? ` · ${DIFFICULTY_LABELS[String(item.difficulty)] || String(item.difficulty)}`
                  : ''}
                {item.requiresMachine ? ' · Makinalı' : ''}
              </Text>
              {locLabels.length > 0 ? (
                <View style={styles.locRow}>
                  {locLabels.map((label) => (
                    <View key={label} style={styles.locChip}>
                      <Text style={styles.locChipText}>{label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
          </Pressable>
        </FadeIn>
      );
    },
    [openExercise],
  );

  return (
    <PanelScaffold
      scroll={false}
      subtitle="Tüm hareket videolarını inceleyin ve programlara ekleyin"
      title="Hareket Kütüphanesi">
      <View style={styles.searchRow}>
        <Ionicons color={colors.cream[800]} name="search" size={18} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Hareket adı ara…"
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
          <Pressable
            onPress={() => setCategory(EXERCISE_CATEGORY_ALL)}
            style={[
              styles.chip,
              category === EXERCISE_CATEGORY_ALL && styles.chipOn,
            ]}>
            <Text
              style={[
                styles.chipText,
                category === EXERCISE_CATEGORY_ALL && styles.chipTextOn,
              ]}>
              Tüm tipler
            </Text>
          </Pressable>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() =>
                setCategory((cur) => (cur === item ? EXERCISE_CATEGORY_ALL : item))
              }
              style={[styles.chip, category === item && styles.chipOn]}>
              <Text style={[styles.chipText, category === item && styles.chipTextOn]}>
                {item}
              </Text>
            </Pressable>
          ))}
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
          <Pressable
            onPress={() => setRequiresMachine((cur) => (cur === 'false' ? '' : 'false'))}
            style={[styles.chip, requiresMachine === 'false' && styles.chipOn]}>
            <Text
              style={[styles.chipText, requiresMachine === 'false' && styles.chipTextOn]}>
              Makinasız
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <FlatList
        data={items}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT + ITEM_MARGIN,
          offset: (ITEM_HEIGHT + ITEM_MARGIN) * index,
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
            <EmptyState
              description="Arama veya filtreleri değiştirin."
              title="Hareket bulunamadı"
            />
          )
        }
        ListFooterComponent={
          loading && page > 1 ? <InlineSpinner size="sm" /> : null
        }
        onEndReached={() => {
          if (!loading && page < totalPages) void load(page + 1, true);
        }}
        onEndReachedThreshold={0.4}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <ExerciseDetailModal
        canPlay
        exercise={active}
        onClose={() => setActive(null)}
        visible={Boolean(active)}
      />
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
    marginBottom: spacing.sm,
  },
  rowTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  locRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  locChip: {
    borderRadius: radius.full,
    backgroundColor: colors.warm[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  locChipText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.warm[500] },
  list: { flex: 1 },
});
