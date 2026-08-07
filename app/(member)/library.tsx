import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn as ReFadeIn, FadeOut as ReFadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { PANEL_IMAGES } from '@/constants/panelImages';
import { useData, useMember } from '@/context/DataContext';
import { DIFFICULTY_LABELS } from '@/data/exerciseLabels';
import { hasFullVideoAccess as planHasFullVideo } from '@/data/membershipPlans';
import {
  EXERCISE_PAGE_SIZE,
  fetchDistinctExerciseCategories,
  fetchExercisesPage,
} from '@/services/exerciseLibrary';
import { prefetchExerciseVideo } from '@/services/exerciseMedia';
import { collectProgramExerciseIds } from '@/utils/coachProgram';
import { memberHasFullVideoAccess } from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

const LOCATIONS = [
  { id: '', label: 'Konum' },
  { id: 'home', label: 'Ev' },
  { id: 'gym', label: 'Salon' },
  { id: 'office', label: 'Ofis' },
];

const ITEM_HEIGHT = 98; // padding 16*2 + thumbnail 64 + border 2
const ITEM_MARGIN = 8; // marginBottom spacing.sm

/** LOCK: docs/mobile/screens/member/library.md — web: program-scoped exercise ids */
export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { myPrograms } = useData();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [location, setLocation] = useState('');
  const [requiresMachine, setRequiresMachine] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Record<string, unknown> | null>(null);

  const fullAccess =
    memberHasFullVideoAccess(member) || planHasFullVideo(String(member?.membership || 'free'));

  // Web parity: üye kütüphanesi yalnızca program hareketleri
  const programExerciseIds = useMemo(
    () => collectProgramExerciseIds(myPrograms as Record<string, unknown>[]),
    [myPrograms],
  );

  const activeFilterCount = [
    search.trim(),
    category,
    difficulty,
    location,
    requiresMachine,
  ].filter(Boolean).length;

  // 300ms arama debounce — istek mantığı aynı
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
          pageSize: EXERCISE_PAGE_SIZE,
          filters: {
            search: debouncedSearch,
            category,
            difficulty,
            location,
            requiresMachine,
            ids: programExerciseIds,
          },
        });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(res.page);
        setTotalPages(res.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, category, difficulty, location, requiresMachine, programExerciseIds],
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  useEffect(() => {
    void fetchDistinctExerciseCategories().then(setCategories);
  }, []);

  const openExercise = (ex: Record<string, unknown>) => {
    if (ex.videoUrl && !ex.videoPending && fullAccess) {
      prefetchExerciseVideo(ex.videoUrl);
    }
    setActive(ex);
  };

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <Pressable
        onPress={() => openExercise(item)}
        onPressIn={() => {
          if (item.videoUrl && !item.videoPending && fullAccess) {
            prefetchExerciseVideo(item.videoUrl);
          }
        }}
        style={styles.row}>
        <ExerciseVideoThumbnail
          pending={Boolean(item.videoPending)}
          size={64}
          videoUrl={item.videoUrl as string}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{String(item.name)}</Text>
          <Text style={styles.rowMeta}>
            {String(item.bodyPart || item.category || '')}
            {item.difficulty
              ? ` · ${DIFFICULTY_LABELS[String(item.difficulty)] || String(item.difficulty)}`
              : ''}
          </Text>
        </View>
        <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
      </Pressable>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullAccess],
  );

  return (
    <MeshBackground style={styles.root}>
      <FlatList
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        data={items}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT + ITEM_MARGIN,
          offset: (ITEM_HEIGHT + ITEM_MARGIN) * index,
          index,
        })}
        initialNumToRender={15}
        keyExtractor={(item) => String(item.id)}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <FadeIn>
              <View style={styles.header}>
                <Image
                  contentFit="cover"
                  source={{ uri: PANEL_IMAGES.library.url }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['rgba(26,69,92,0.2)', 'rgba(26,69,92,0.85)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.title}>Hareket Kütüphanesi</Text>
                <Text style={styles.sub}>
                  Programınızdaki hareket videolarını doğru formla izleyin
                </Text>
              </View>
            </FadeIn>

            {!fullAccess ? (
              <View style={styles.gate}>
                <Text style={styles.gateText}>
                  Tam video kütüphanesi Spor ve Vip paketlerinde açılır. Liste önizlemesi
                  görüntülenir.
                </Text>
              </View>
            ) : null}

            {programExerciseIds.length > 0 ? (
              <Text style={styles.scopeInfo}>
                Yalnızca size atanan antrenman programındaki hareketler listelenir.
              </Text>
            ) : null}

            {programExerciseIds.length > 0 ? (
              <>
                <Pressable
                  accessibilityLabel={filtersOpen ? 'Filtreleri kapat' : 'Filtreleri aç'}
                  accessibilityRole="button"
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
                  <Animated.View entering={ReFadeIn.duration(180)} exiting={ReFadeOut.duration(140)} style={styles.filters}>
                <View style={styles.searchRow}>
                  <Ionicons color={colors.cream[800]} name="search" size={18} />
                  <TextInput
                    onChangeText={setSearch}
                    placeholder="Hareket adı ara..."
                    placeholderTextColor={colors.cream[300]}
                    style={styles.searchInput}
                    value={search}
                  />
                </View>
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory((cur) => (cur === item ? '' : item))}
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
                {LOCATIONS.filter((l) => l.id).map((l) => (
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
                <Pressable
                  onPress={() =>
                    setRequiresMachine((cur) => (cur === 'false' ? '' : 'false'))
                  }
                  style={[styles.chip, requiresMachine === 'false' && styles.chipOn]}>
                  <Text
                    style={[
                      styles.chipText,
                      requiresMachine === 'false' && styles.chipTextOn,
                    ]}>
                    Makinasız
                  </Text>
                </Pressable>
                  </Animated.View>
                ) : null}
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
          ) : programExerciseIds.length === 0 ? (
            <EmptyState
              description="Koçunuzun veya yapay zekanın oluşturduğu antrenman programındaki hareketler burada görünür."
              title="Henüz program hareketi yok"
            />
          ) : (
            <EmptyState description="Arama veya filtreleri değiştirin." title="Hareket bulunamadı" />
          )
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator
              color={colors.brand[600]}
              size="small"
              style={styles.footerSpinner}
            />
          ) : null
        }
        onEndReached={() => {
          if (!loading && page < totalPages) void load(page + 1, true);
        }}
        onEndReachedThreshold={0.4}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <ExerciseDetailModal
        canPlay={fullAccess}
        exercise={active}
        onClose={() => setActive(null)}
        visible={Boolean(active)}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  header: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.white },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  gate: {
    backgroundColor: colors.warm[50],
    borderColor: colors.warm[200],
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  gateText: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], lineHeight: 19 },
  scopeInfo: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.7,
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterToggleText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[600] },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchRow: {
    width: '100%',
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
  footerSpinner: { marginVertical: spacing.md },
});
