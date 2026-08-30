import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ExerciseVideoThumbnail } from '@/components/library/ExerciseVideoThumbnail';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { revealFocusedFormInput } from '@/components/ui/FormKeyboardScroll';
import {
  cartEntrySummary,
  filledWeekdaysFromDayCarts,
  weekdayFullLabel,
  type CartEntry,
  type DayCarts,
} from '@/utils/coachProgram';
import { MAX_FONT_SIZE_MULTIPLIER, colors, fonts, radius, spacing } from '@/theme';

function digitsOnly(raw: string, max: number) {
  return raw.replace(/\D/g, '').slice(0, String(max).length);
}

type Props = {
  dayCarts: DayCarts;
  onChange: (next: DayCarts) => void;
  onBack: () => void;
  onContinue: () => void;
  onOpenExercise?: (entry: CartEntry) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    const next = Number.isFinite(n) ? clamp(n, min, max) : min;
    onChange(next);
    setDraft(String(next));
  };

  const bump = (delta: number) => {
    const next = clamp(value + delta, min, max);
    onChange(next);
    setDraft(String(next));
  };

  const keepVisible = () => {
    revealFocusedFormInput();
    requestAnimationFrame(() => revealFocusedFormInput());
    setTimeout(() => revealFocusedFormInput(), 280);
  };

  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View
        collapsable={false}
        style={[styles.stepperRow, focused && styles.stepperRowFocus]}>
        <Pressable
          accessibilityLabel={`${label} azalt`}
          hitSlop={6}
          onPress={() => bump(-1)}
          style={styles.stepperBtn}>
          <Ionicons color={colors.cream[800]} name="remove" size={18} />
        </Pressable>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          allowFontScaling={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          blurOnSubmit
          keyboardType={Platform.OS === 'android' ? 'numeric' : 'number-pad'}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          maxLength={String(max).length}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          onChangeText={(t) => {
            setDraft(digitsOnly(t, max));
          }}
          onFocus={() => {
            setFocused(true);
            setDraft(String(value));
            keepVisible();
            if (Platform.OS === 'web') {
              requestAnimationFrame(() => {
                (inputRef.current as unknown as { scrollIntoView?: (o: object) => void })
                  ?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
              });
            }
          }}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="done"
          scrollEnabled={false}
          spellCheck={false}
          style={styles.stepperVal}
          underlineColorAndroid="transparent"
          value={focused ? draft : String(value)}
        />
        <Pressable
          accessibilityLabel={`${label} artır`}
          hitSlop={6}
          onPress={() => bump(1)}
          style={styles.stepperBtn}>
          <Ionicons color={colors.cream[800]} name="add" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Wizard adım 3 — dolu günlerdeki hareketleri düzenler (set / tekrar / süre / not / sıra).
 * Kütüphaneden ekleme yok; ekleme adım 2’de kalır.
 */
export function CoachProgramDayFlowEditor({
  dayCarts,
  onChange,
  onBack,
  onContinue,
  onOpenExercise,
}: Props) {
  const filledDays = filledWeekdaysFromDayCarts(dayCarts);

  const patchDay = (day: number, updater: (list: CartEntry[]) => CartEntry[]) => {
    const current = dayCarts[day] || [];
    onChange({ ...dayCarts, [day]: updater(current) });
  };

  const patchEntry = (day: number, id: string, patch: Partial<CartEntry>) => {
    patchDay(day, (list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const moveEntry = (day: number, id: string, dir: number) => {
    patchDay(day, (list) => {
      const i = list.findIndex((e) => e.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const removeEntry = (day: number, id: string) => {
    patchDay(day, (list) => list.filter((e) => e.id !== id));
  };

  return (
    <View style={styles.root}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Gün akışını düzenle</Text>
        <Text style={styles.introBody}>
          Set, tekrar veya süre ve notları buradan ayarlayın. Yeni hareket eklemek için Günler
          adımına dönün.
        </Text>
      </View>

      {filledDays.length === 0 ? (
        <EmptyState
          description="Önce kütüphaneden en az bir güne hareket ekleyin."
          icon="barbell-outline"
          title="Düzenlenecek hareket yok"
        />
      ) : (
        filledDays.map((day) => {
          const list = dayCarts[day] || [];
          return (
            <View key={day} style={styles.dayBlock}>
              <Text style={styles.dayTitle}>{weekdayFullLabel(day)}</Text>
              {list.map((entry, idx) => (
                <View key={entry.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Pressable
                      onPress={() =>
                        (entry.videoUrl || entry.videoPending) && onOpenExercise?.(entry)
                      }
                      style={styles.thumbWrap}>
                      <ExerciseVideoThumbnail
                        pending={Boolean(entry.videoPending)}
                        size={52}
                        videoUrl={entry.videoUrl || null}
                      />
                      <View style={styles.orderBadge}>
                        <Text style={styles.orderBadgeText}>{idx + 1}</Text>
                      </View>
                    </Pressable>
                    <Text style={styles.exName}>{entry.exerciseName}</Text>
                    <View style={styles.headActions}>
                      <Pressable
                        disabled={idx === 0}
                        onPress={() => moveEntry(day, entry.id, -1)}
                        style={[styles.iconBtn, idx === 0 && styles.iconDisabled]}>
                        <Ionicons color={colors.cream[800]} name="chevron-up" size={18} />
                      </Pressable>
                      <Pressable
                        disabled={idx === list.length - 1}
                        onPress={() => moveEntry(day, entry.id, 1)}
                        style={[
                          styles.iconBtn,
                          idx === list.length - 1 && styles.iconDisabled,
                        ]}>
                        <Ionicons color={colors.cream[800]} name="chevron-down" size={18} />
                      </Pressable>
                      <Pressable
                        onPress={() => removeEntry(day, entry.id)}
                        style={styles.iconBtn}>
                        <Ionicons color={colors.warm[500]} name="trash-outline" size={18} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.seg}>
                    {(
                      [
                        { id: 'reps' as const, label: 'Tekrar' },
                        { id: 'duration' as const, label: 'Süre' },
                      ] as const
                    ).map((m) => (
                      <Pressable
                        key={m.id}
                        onPress={() => patchEntry(day, entry.id, { amountType: m.id })}
                        style={[styles.segItem, entry.amountType === m.id && styles.segOn]}>
                        <Text
                          style={[
                            styles.segText,
                            entry.amountType === m.id && styles.segTextOn,
                          ]}>
                          {m.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.controls}>
                    <Stepper
                      label="Set"
                      max={20}
                      onChange={(sets) => patchEntry(day, entry.id, { sets })}
                      value={Number(entry.sets) || 1}
                    />
                    <Stepper
                      label={entry.amountType === 'duration' ? 'Süre' : 'Tekrar'}
                      max={999}
                      onChange={(amount) => patchEntry(day, entry.id, { amount })}
                      value={Number(entry.amount) || 1}
                    />
                    {entry.amountType === 'duration' ? (
                      <View style={styles.unitCol}>
                        <Text style={styles.stepperLabel}>Birim</Text>
                        <View style={styles.seg}>
                          {(['sn', 'dk'] as const).map((u) => (
                            <Pressable
                              key={u}
                              onPress={() =>
                                patchEntry(day, entry.id, { durationUnit: u })
                              }
                              style={[
                                styles.segItem,
                                (entry.durationUnit || 'sn') === u && styles.segOn,
                              ]}>
                              <Text
                                style={[
                                  styles.segText,
                                  (entry.durationUnit || 'sn') === u && styles.segTextOn,
                                ]}>
                                {u}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <TextInput
                    onChangeText={(note) => patchEntry(day, entry.id, { note })}
                    placeholder="Not (tempo, dinlenme…)"
                    placeholderTextColor={colors.cream[300]}
                    style={styles.note}
                    value={entry.note}
                  />
                  <Text style={styles.summary}>{cartEntrySummary(entry)}</Text>
                </View>
              ))}
            </View>
          );
        })
      )}

      <View style={styles.footer}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri — Günler</Text>
        </Pressable>
        <Button
          disabled={filledDays.length === 0}
          label="Önizleme"
          onPress={onContinue}
          size="md"
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  intro: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[100],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 6,
    padding: spacing.md,
  },
  introTitle: {
    color: colors.cream[900],
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  introBody: {
    color: colors.cream[800],
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  dayBlock: { gap: spacing.sm },
  dayTitle: {
    color: colors.brand[700],
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardHead: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  thumbWrap: { position: 'relative' },
  orderBadge: {
    alignItems: 'center',
    backgroundColor: colors.brand[600],
    borderRadius: radius.full,
    height: 20,
    justifyContent: 'center',
    left: -6,
    position: 'absolute',
    top: -6,
    width: 20,
  },
  orderBadgeText: { color: colors.white, fontFamily: fonts.sansSemi, fontSize: 10 },
  exName: {
    color: colors.cream[900],
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 15,
  },
  headActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconDisabled: { opacity: 0.35 },
  seg: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 3,
  },
  segItem: { borderRadius: radius.md, flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  segOn: { backgroundColor: colors.white },
  segText: {
    color: colors.cream[800],
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    textAlign: 'center',
  },
  segTextOn: { color: colors.cream[900] },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: { gap: 4, minWidth: 112 },
  stepperLabel: {
    color: colors.cream[800],
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    opacity: 0.7,
  },
  stepperRow: {
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderColor: colors.cream[200],
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
  },
  stepperRowFocus: {
    borderColor: colors.brand[400],
  },
  stepperBtn: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  stepperVal: {
    color: colors.cream[900],
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    height: 44,
    minWidth: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  unitCol: { flex: 1, gap: 4, minWidth: 120 },
  note: {
    backgroundColor: colors.cream[50],
    borderColor: colors.cream[200],
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.cream[900],
    fontFamily: fonts.sans,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summary: {
    color: colors.brand[700],
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  backBtn: {
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  backBtnText: { color: colors.cream[800], fontFamily: fonts.sansSemi, fontSize: 13 },
  cta: { flex: 1 },
});
