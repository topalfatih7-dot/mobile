import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { addDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { SafeWebView } from '@/components/ui/SafeWebView';
import { PANEL_IMAGES } from '@/constants/panelImages';
import { useData } from '@/context/DataContext';
import { resolveExerciseVideoUrl } from '@/services/exerciseMedia';
import { amountText, groupBySchedule } from '@/utils/programGroups';
import { CYCLE_PLAN_LENGTH } from '@/utils/programSchedule';
import { colors, fonts, radius, spacing } from '@/theme';

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'workout', label: 'Antrenman' },
  { id: 'nutrition', label: 'Beslenme' },
] as const;

/** LOCK: docs/mobile/screens/member/programs.md */
export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const { myPrograms } = useData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [active, setActive] = useState<Record<string, unknown> | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const filtered = useMemo(
    () =>
      filter === 'all' ? myPrograms : myPrograms.filter((p) => p.type === filter),
    [filter, myPrograms],
  );

  const openEntry = async (entry: Record<string, unknown>) => {
    setActive(entry);
    setVideoUrl(null);
    if (entry.videoPending || !entry.videoUrl) return;
    setLoadingVideo(true);
    try {
      const url = await resolveExerciseVideoUrl(entry.videoUrl);
      setVideoUrl(url);
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={styles.header}>
            <Image
              contentFit="cover"
              source={{ uri: PANEL_IMAGES.programs.url }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(26,69,92,0.2)', 'rgba(26,69,92,0.82)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.title}>Programlarım</Text>
            <Text style={styles.sub}>
              Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar
            </Text>
          </View>
        </FadeIn>

        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              accessibilityLabel={`${f.label} filtresi`}
              accessibilityRole="button"
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.chip, filter === f.id && styles.chipOn]}>
              <Text style={[styles.chipText, filter === f.id && styles.chipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {!filtered.length ? (
          <EmptyState
            description="Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada görünecek ve bildirim alacaksınız."
            title="Henüz program yok"
          />
        ) : (
          filtered.map((p, i) => {
            const isNutrition = p.type === 'nutrition';
            const entries = (p.entries as Record<string, unknown>[]) || [];
            return (
              <FadeIn key={String(p.id)} delay={80 + i * 40} style={styles.card}>
                <View style={styles.cardHead}>
                  <View
                    style={[
                      styles.typeIcon,
                      {
                        backgroundColor: isNutrition ? colors.sage[50] : colors.brand[50],
                      },
                    ]}>
                    <Ionicons
                      color={isNutrition ? colors.sage[600] : colors.brand[600]}
                      name={isNutrition ? 'nutrition' : 'barbell'}
                      size={20}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{String(p.title || 'Program')}</Text>
                    <Text style={styles.cardMeta}>
                      {isNutrition ? 'Beslenme' : 'Antrenman'}
                      {p.staffName ? ` · ${String(p.staffName)}` : ''}
                      {p.sessionDuration ? ` · ${String(p.sessionDuration)} dk` : ''}
                      {p.createdAt
                        ? ` · ${format(new Date(String(p.createdAt)), 'd MMMM yyyy', {
                            locale: tr,
                          })}`
                        : ''}
                    </Text>
                    {p.description ? (
                      <Text numberOfLines={3} style={styles.cardDesc}>
                        {String(p.description)}
                      </Text>
                    ) : null}
                    <View style={styles.badgeRow}>
                      {p.scheduleType === 'cycle14' ? (
                        <Text style={styles.badge}>14 Gün · Her Gün Aynı</Text>
                      ) : null}
                      {p.scheduleType === 'dateRange' && p.cycleStartDate ? (
                        <Text style={styles.badge}>
                          {Number(p.cycleLength) || 0} Gün
                          {p.cycleSameDaily === false
                            ? ' · Haftalık Rotasyon'
                            : ' · Her Gün Aynı'}
                        </Text>
                      ) : null}
                    </View>
                    {(p.scheduleType === 'cycle14' || p.scheduleType === 'dateRange') &&
                    p.cycleStartDate ? (
                      <Text style={styles.cardSchedule}>
                        {format(
                          new Date(`${String(p.cycleStartDate)}T12:00:00`),
                          'd MMMM yyyy',
                          { locale: tr },
                        )}
                        {' — '}
                        {format(
                          addDays(
                            new Date(`${String(p.cycleStartDate)}T12:00:00`),
                            (Number(p.cycleLength) || CYCLE_PLAN_LENGTH) - 1,
                          ),
                          'd MMMM yyyy',
                          { locale: tr },
                        )}
                        {p.cycleSameDaily === false
                          ? ' · antrenman günlerinde geçerli'
                          : ' · her gün aynı program'}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {entries.length > 0
                  ? groupBySchedule(entries, p).map((g) => (
                      <View key={g.key} style={styles.group}>
                        <Text style={styles.groupLabel}>{g.label}</Text>
                        {g.items.map((e: Record<string, unknown>) => {
                          const title = String(e.name || e.exerciseName || 'Madde');
                          const setsLabel =
                            e.sets != null && e.sets !== ''
                              ? `${e.sets} set × ${amountText(e as never)}`
                              : e.amount
                                ? amountText(e as never)
                                : '';
                          return (
                            <Pressable
                              key={String(e.id || `${g.key}-${title}`)}
                              onPress={() => void openEntry(e)}
                              style={styles.entry}>
                              <ExerciseVideoThumbnail
                                pending={Boolean(e.videoPending)}
                                size={48}
                                videoUrl={e.videoUrl as string}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.entryTitle}>
                                  {title}
                                  {!isNutrition && setsLabel ? ` · ${setsLabel}` : ''}
                                </Text>
                                {e.note ? (
                                  <Text numberOfLines={2} style={styles.entryNote}>
                                    {String(e.note)}
                                  </Text>
                                ) : null}
                                {e.start ? (
                                  <Text style={styles.entryNote}>
                                    {String(e.start)}
                                    {e.end ? `–${String(e.end)}` : ''}
                                  </Text>
                                ) : null}
                              </View>
                              <Ionicons color={colors.brand[500]} name="play-circle" size={22} />
                            </Pressable>
                          );
                        })}
                      </View>
                    ))
                  : Array.isArray(p.items) && (p.items as unknown[]).length > 0
                    ? (p.items as unknown[]).map((item, idx) => (
                        <Text key={`item-${idx}`} style={styles.legacyItem}>
                          • {typeof item === 'string' ? item : String((item as { text?: string })?.text || item)}
                        </Text>
                      ))
                    : null}
              </FadeIn>
            );
          })
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(active)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {String(active?.name || active?.exerciseName || 'Egzersiz')}
            </Text>
            {active?.amount ? (
              <Text style={styles.modalMeta}>{amountText(active as never)}</Text>
            ) : null}
            <View style={styles.player}>
              {loadingVideo ? (
                <ActivityIndicator color={colors.brand[600]} />
              ) : videoUrl ? (
                <SafeWebView
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  source={{ uri: videoUrl }}
                  style={styles.webview}
                />
              ) : (
                <Text style={styles.noVideo}>
                  {active?.videoPending
                    ? 'Video hazırlanıyor…'
                    : 'Bu madde için video yok.'}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityLabel="Kapat"
              accessibilityRole="button"
              onPress={() => setActive(null)}
              style={styles.closeBtn}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: {
    height: 150,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.white },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  chipTextOn: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  cardMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  cardDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.cream[800],
    opacity: 0.75,
    marginTop: 6,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.brand[700],
    backgroundColor: colors.brand[50],
    overflow: 'hidden',
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardSchedule: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
    opacity: 0.65,
  },
  legacyItem: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.cream[800],
    marginTop: 4,
  },
  group: { gap: 8 },
  groupLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  entryTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  entryNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '80%',
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
  webview: { width: '100%', height: '100%' },
  noVideo: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
});
