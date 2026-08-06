import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn as ReFadeIn,
  FadeOut as ReFadeOut,
  Keyframe,
  LinearTransition,
  SlideInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { fetchExercisesPage } from '@/services/exerciseLibrary';
import { colors, fonts, radius, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Görünen etiket TR — veri değerleri İngilizce kalır (library paritesi). */
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type CartEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  videoPending: boolean;
  amountType: 'reps' | 'duration'; // LOCK varsayılanı: reps
  amount: number; // LOCK varsayılanı: 12
  durationUnit: 'sn'; // LOCK
  sets: number;
  rest: number;
  note: string;
};

function createCartEntry(ex: Record<string, unknown>): CartEntry {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: String(ex.id),
    exerciseName: String(ex.name),
    videoPending: Boolean(ex.videoPending),
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    sets: 3,
    rest: 60,
    note: '',
  };
}

function entrySummary(entry: CartEntry) {
  const amountText =
    entry.amountType === 'reps' ? `${entry.amount} tekrar` : `${entry.amount} sn`;
  return `${entry.sets} set × ${amountText} · ${entry.rest} sn dinlenme`;
}

/** Rozet bounce: scale 1 → 1.25 → 1 */
const badgeBounce = new Keyframe({
  0: { transform: [{ scale: 0.9 }] },
  50: { transform: [{ scale: 1.25 }] },
  100: { transform: [{ scale: 1 }] },
}).duration(300);

function StepperField({
  label,
  value,
  onChange,
  min = 1,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepCtrl}>
        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.stepBtn}>
          <Ionicons color={colors.brand[600]} name="remove" size={18} />
        </Pressable>
        <Text style={styles.stepValue}>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => onChange(value + step)}
          style={styles.stepBtn}>
          <Ionicons color={colors.brand[600]} name="add" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

/** LOCK: docs/mobile/screens/staff/client-program.md — sadeleştirilmiş mobil akış */
export default function ClientProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, staffClients } = useData();
  const client = staffClients.find((c) => String(c.id) === String(id));
  const clientName = client ? String(client.name) : 'Danışan';
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Record<string, unknown>[]>([]);
  const [exLoading, setExLoading] = useState(true);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setExLoading(true);
      try {
        const res = await fetchExercisesPage({ page: 1, pageSize: 200 });
        if (!cancelled) {
          setExercises(res.items);
        }
      } catch {
        if (!cancelled) setExercises([]);
      } finally {
        if (!cancelled) setExLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    if (!q) return exercises;
    return exercises.filter((ex) =>
      String(ex.name).toLocaleLowerCase('tr-TR').includes(q),
    );
  }, [search, exercises]);

  const editing = cart.find((c) => c.id === editingId) ?? null;

  const addToCart = (ex: Record<string, unknown>) => {
    if (cart.some((c) => c.exerciseId === String(ex.id))) return;
    setCart((prev) => [...prev, createCartEntry(ex)]);
  };

  const removeEntry = (entryId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== entryId));
  };

  const patchEntry = (entryId: string, patch: Partial<CartEntry>) => {
    setCart((prev) => prev.map((c) => (c.id === entryId ? { ...c, ...patch } : c)));
  };

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const closeSheet = () => {
    setEditingId(null);
    setCartOpen(false);
  };

  const send = () => {
    if (cart.length === 0) {
      toast('En az bir hareket ekleyin', 'warning');
      return;
    }
    toast(`Program ${clientName} adlı danışana gönderildi.`, 'success');
    setCart([]);
    setDays([]);
    closeSheet();
  };

  return (
    <View style={styles.root}>
      <PanelScaffold showBack subtitle={clientName} title="Program oluştur">
        {loading && !client ? (
          <InlineSpinner fill />
        ) : (
          <>
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

        {exLoading && filtered.length === 0 ? (
          <InlineSpinner fill />
        ) : filtered.length === 0 ? (
          <EmptyState description="Filtreleri temizleyip tekrar deneyin." title="Sonuç yok" />
        ) : (
          filtered.map((ex) => {
            const added = cart.some((c) => c.exerciseId === String(ex.id));
            const meta = [
              String(ex.bodyPart || ''),
              DIFFICULTY_LABELS[String(ex.difficulty)] || '',
              ex.requiresMachine ? 'Makine' : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable key={String(ex.id)} onPress={() => addToCart(ex)} style={styles.exRow}>
                <ExerciseVideoThumbnail
                  pending={Boolean(ex.videoPending)}
                  size={48}
                  videoUrl={ex.videoUrl as string | null}
                />
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{String(ex.name)}</Text>
                  <Text style={styles.exMeta}>{meta}</Text>
                </View>
                {added ? (
                  <Animated.View entering={ZoomIn.duration(220)}>
                    <Ionicons color={colors.sage[500]} name="checkmark-circle" size={26} />
                  </Animated.View>
                ) : (
                  <Text style={styles.addLabel}>Ekle</Text>
                )}
              </Pressable>
            );
          })
        )}

        <View style={styles.barSpacer} />
          </>
        )}
      </PanelScaffold>

      {/* Alt sabit bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCartOpen(true)}
          style={styles.cartBtn}>
          <Ionicons color={colors.brand[700]} name="cart-outline" size={22} />
          <Text style={styles.cartBtnText}>Sepet</Text>
          {cart.length > 0 ? (
            <Animated.View entering={badgeBounce} key={cart.length} style={styles.badge}>
              <Text style={styles.badgeText}>{cart.length}</Text>
            </Animated.View>
          ) : null}
        </Pressable>
        <Button
          disabled={cart.length === 0}
          label="Programı Gönder"
          onPress={send}
          size="md"
          style={cart.length === 0 ? styles.ctaDisabled : styles.cta}
        />
      </View>

      {/* Sepet + set/tekrar bottom sheet */}
      <Modal
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
        transparent
        visible={cartOpen}>
        <View style={styles.sheetRoot}>
          <AnimatedPressable
            entering={ReFadeIn.duration(250)}
            onPress={closeSheet}
            style={styles.backdrop}
          />
          <Animated.View
            entering={SlideInDown.duration(250)}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            {editing ? (
              <View style={styles.sheetInner}>
                <Text style={styles.sheetTitle}>{editing.exerciseName}</Text>

                <View style={styles.segment}>
                  {(
                    [
                      { key: 'reps', label: 'Tekrar' },
                      { key: 'duration', label: 'Süre (sn)' },
                    ] as const
                  ).map((opt) => {
                    const on = editing.amountType === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => patchEntry(editing.id, { amountType: opt.key })}
                        style={[styles.segmentItem, on && styles.segmentItemOn]}>
                        <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <StepperField
                  label="Set"
                  onChange={(v) => patchEntry(editing.id, { sets: v })}
                  value={editing.sets}
                />
                <StepperField
                  label={editing.amountType === 'reps' ? 'Tekrar' : 'Süre'}
                  onChange={(v) => patchEntry(editing.id, { amount: v })}
                  step={editing.amountType === 'reps' ? 1 : 5}
                  suffix={editing.amountType === 'reps' ? undefined : 'sn'}
                  value={editing.amount}
                />
                <StepperField
                  label="Dinlenme"
                  min={0}
                  onChange={(v) => patchEntry(editing.id, { rest: v })}
                  step={15}
                  suffix="sn"
                  value={editing.rest}
                />

                <Button label="Tamam" onPress={() => setEditingId(null)} size="md" />
              </View>
            ) : (
              <View style={styles.sheetInner}>
                <Text style={styles.sheetTitle}>Sepet</Text>

                <View style={styles.daysRow}>
                  {DAY_LABELS.map((label, i) => {
                    const on = days.includes(i);
                    return (
                      <Pressable
                        key={label}
                        onPress={() => toggleDay(i)}
                        style={[styles.dayChip, on && styles.dayChipOn]}>
                        <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.daysHint}>
                  {days.length === 0 ? 'Gün seçilmezse program her gün uygulanır.' : ' '}
                </Text>

                {cart.length === 0 ? (
                  <EmptyState icon="barbell-outline" title="En az bir hareket ekleyin" />
                ) : (
                  cart.map((entry) => (
                    <Animated.View
                      exiting={ReFadeOut.duration(200)}
                      key={entry.id}
                      layout={LinearTransition.duration(200)}
                      style={styles.cartCard}>
                      <ExerciseVideoThumbnail pending={entry.videoPending} size={40} />
                      <View style={styles.exInfo}>
                        <Text numberOfLines={1} style={styles.exName}>
                          {entry.exerciseName}
                        </Text>
                        <Text style={styles.exMeta}>{entrySummary(entry)}</Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={6}
                        onPress={() => setEditingId(entry.id)}
                        style={styles.cardAction}>
                        <Ionicons color={colors.brand[600]} name="pencil" size={18} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={6}
                        onPress={() => removeEntry(entry.id)}
                        style={styles.cardAction}>
                        <Ionicons color={colors.warm[500]} name="trash" size={18} />
                      </Pressable>
                    </Animated.View>
                  ))
                )}

                <Button label="Programı Gönder" onPress={send} size="md" />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    minHeight: 44,
  },
  exInfo: { flex: 1, gap: 2 },
  exName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  exMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.65 },
  addLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[600] },
  barSpacer: { height: 72 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  cartBtnText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[700] },
  badge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.warm[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
  cta: { flex: 1 },
  ctaDisabled: { flex: 1, opacity: 0.45 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,35,50,0.5)',
  },
  sheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '85%',
  },
  sheetInner: { gap: spacing.md },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.cream[900] },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  dayChipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  dayChipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  dayChipTextOn: { color: colors.white },
  daysHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: -spacing.sm,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
  },
  cardAction: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cream[100],
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemOn: { backgroundColor: colors.brand[600] },
  segmentText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  segmentTextOn: { color: colors.white },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  stepCtrl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
    minWidth: 64,
    textAlign: 'center',
  },
});
