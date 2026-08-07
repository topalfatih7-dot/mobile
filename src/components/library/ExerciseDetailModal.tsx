import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VideoPlayer } from '@/components/ui/VideoPlayer';
import {
  DIFFICULTY_LABELS,
  formatExerciseLocations,
  normalizeInstructionSteps,
  stripEmbeddedInstructionBlock,
} from '@/data/exerciseLabels';
import { resolveExerciseVideoUrl } from '@/services/exerciseMedia';
import { amountText } from '@/utils/programGroups';
import { colors, fonts, radius, spacing } from '@/theme';

export type ExerciseDetailExercise = Record<string, unknown>;

type Props = {
  visible: boolean;
  exercise: ExerciseDetailExercise | null;
  onClose: () => void;
  /** Üyelik kapısı — false ise oynatma yok. Varsayılan true. */
  canPlay?: boolean;
  gatedMessage?: string;
};

function Badge({ label, tone }: { label: string; tone: 'brand' | 'sage' | 'warm' | 'cream' | 'mint' }) {
  const toneStyle = {
    brand: styles.badgeBrand,
    sage: styles.badgeSage,
    warm: styles.badgeWarm,
    cream: styles.badgeCream,
    mint: styles.badgeMint,
  }[tone];
  const textStyle = {
    brand: styles.badgeTextBrand,
    sage: styles.badgeTextSage,
    warm: styles.badgeTextWarm,
    cream: styles.badgeTextCream,
    mint: styles.badgeTextMint,
  }[tone];
  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

/**
 * Ortalanmış detay modal — video (16:9) + rozetler + set/rep + açıklama.
 * Web ExerciseDetailModal davranışının RN/cross-platform uyarlaması.
 */
export function ExerciseDetailModal({
  visible,
  exercise,
  onClose,
  canPlay = true,
  gatedMessage = 'Oynatma için Spor veya Vip paket gerekli',
}: Props) {
  const insets = useSafeAreaInsets();
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const name = String(exercise?.name || exercise?.exerciseName || '');
  const videoRef = exercise?.videoUrl;
  const videoPending = Boolean(exercise?.videoPending);
  const description = useMemo(
    () => stripEmbeddedInstructionBlock(exercise?.description),
    [exercise?.description],
  );
  const steps = useMemo(
    () => normalizeInstructionSteps(exercise?.instructions),
    [exercise?.instructions],
  );

  const loadUrl = useCallback(async () => {
    if (!exercise || !visible) return;
    setPlayUrl(null);
    if (!canPlay || videoPending || !videoRef) return;
    setLoadingVideo(true);
    try {
      const url = await resolveExerciseVideoUrl(videoRef);
      setPlayUrl(url);
    } finally {
      setLoadingVideo(false);
    }
  }, [exercise, visible, canPlay, videoPending, videoRef]);

  useEffect(() => {
    void loadUrl();
  }, [loadUrl]);

  const hasScheduleMeta =
    exercise?.amount != null &&
    exercise?.amount !== '' &&
    !Number.isNaN(Number(exercise.amount));
  const hasSets = exercise?.sets != null && exercise?.sets !== '';
  const note = exercise?.note ? String(exercise.note) : '';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <Pressable accessibilityLabel="Kapat" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
            {name ? <Text style={styles.title}>{name}</Text> : null}

            <VideoPlayer
              emptyMessage={
                !canPlay
                  ? gatedMessage
                  : videoPending
                    ? 'Video hazırlanıyor…'
                    : 'Bu madde için video yok.'
              }
              loading={loadingVideo && canPlay && !videoPending}
              onRetry={() => void loadUrl()}
              title={name}
              url={canPlay && !videoPending ? playUrl : null}
              videoPending={videoPending && canPlay}
              videoRef={videoRef}
            />

            <View style={styles.badges}>
              {exercise?.category ? (
                <Badge label={String(exercise.category)} tone="brand" />
              ) : null}
              {exercise?.equipment ? (
                <Badge label={String(exercise.equipment)} tone="sage" />
              ) : null}
              {exercise?.difficulty ? (
                <Badge
                  label={
                    DIFFICULTY_LABELS[String(exercise.difficulty)] || String(exercise.difficulty)
                  }
                  tone="cream"
                />
              ) : null}
              {formatExerciseLocations(exercise?.locations).map((loc) => (
                <Badge key={loc} label={loc} tone="warm" />
              ))}
              {exercise?.requiresMachine ? <Badge label="Makinalı" tone="cream" /> : null}
              {exercise?.targetMuscle || exercise?.bodyPart ? (
                <Badge
                  label={String(exercise.targetMuscle || exercise.bodyPart)}
                  tone="mint"
                />
              ) : null}
            </View>

            {(hasSets || hasScheduleMeta || note) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Program</Text>
                {hasSets ? (
                  <Text style={styles.sectionBody}>
                    {String(exercise?.sets)} set
                    {hasScheduleMeta ? ` × ${amountText(exercise as never)}` : ''}
                  </Text>
                ) : hasScheduleMeta ? (
                  <Text style={styles.sectionBody}>{amountText(exercise as never)}</Text>
                ) : null}
                {note ? <Text style={styles.note}>{note}</Text> : null}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Açıklama</Text>
              <Text style={styles.sectionBody}>
                {description || 'Açıklama eklenmemiş.'}
              </Text>
            </View>

            {steps.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Nasıl yapılır</Text>
                {steps.map((step, i) => (
                  <Text key={`${i}-${step.slice(0, 24)}`} style={styles.step}>
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            accessibilityLabel="Kapat"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeBtn}>
            <Text style={styles.closeText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    maxHeight: '92%',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(26, 35, 50, 0.22)',
  },
  scroll: { flexGrow: 0 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeBrand: { backgroundColor: colors.brand[50] },
  badgeSage: { backgroundColor: colors.sage[50] },
  badgeWarm: { backgroundColor: colors.warm[50] },
  badgeCream: { backgroundColor: colors.cream[100] },
  badgeMint: { backgroundColor: colors.mint[50] },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 12 },
  badgeTextBrand: { color: colors.brand[700] },
  badgeTextSage: { color: colors.sage[700] },
  badgeTextWarm: { color: colors.warm[500] },
  badgeTextCream: { color: colors.cream[800], opacity: 0.75 },
  badgeTextMint: { color: colors.sage[700] },
  section: { gap: 6 },
  sectionLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.cream[800],
    opacity: 0.45,
  },
  sectionBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    opacity: 0.85,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.7,
    marginTop: 2,
  },
  step: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    opacity: 0.85,
  },
  closeBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  closeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.brand[600],
  },
});
