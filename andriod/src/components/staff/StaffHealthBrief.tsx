/**
 * Web parity: Adsız `src/components/staff/StaffHealthBrief.jsx`
 * Koç / diyetisyen / doktor — GPT sağlık skoru + staffBrief (üyeye gösterilmez).
 */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  HEALTH_SCORE_KEYS,
  HEALTH_SCORE_META,
  STAFF_BRIEF_KEYS,
  STAFF_BRIEF_META,
  type HealthScoreAnalysis,
  type StaffBriefKey,
} from '@/services/healthScoreAnalysis';
import { normalizeStaffRole } from '@/utils/staffClients';
import { colors, fonts, radius, spacing } from '@/theme';

/** Brief alanları — role göre (web MemberHealthProfilePanel.briefKeysForRole) */
export function briefKeysForRole(viewerRole: string | null | undefined): StaffBriefKey[] {
  const role = normalizeStaffRole(viewerRole);
  if (!viewerRole || String(viewerRole).toLowerCase() === 'admin') {
    return ['general', 'nutrition', 'movement', 'risks', 'actions'];
  }
  if (role === 'coach') return ['general', 'movement', 'risks', 'actions'];
  if (role === 'dietitian') return ['general', 'nutrition', 'risks', 'actions'];
  if (role === 'doctor') return ['general', 'nutrition', 'movement', 'risks', 'actions'];
  return ['general', 'risks', 'actions'];
}

function scoreTone(score: number) {
  if (score >= 75) {
    return {
      bar: colors.sage[500],
      ring: colors.sage[300],
      text: colors.sage[700],
      chipBg: colors.sage[100],
      chipText: colors.sage[700],
      track: colors.sage[100],
      glow: colors.sage[400],
    };
  }
  if (score >= 55) {
    return {
      bar: colors.brand[500],
      ring: colors.brand[300],
      text: colors.brand[800],
      chipBg: colors.brand[100],
      chipText: colors.brand[800],
      track: colors.brand[100],
      glow: colors.brand[400],
    };
  }
  if (score >= 40) {
    return {
      bar: colors.warm[500],
      ring: colors.warm[200],
      text: colors.gold[500],
      chipBg: colors.warm[100],
      chipText: colors.gold[500],
      track: colors.warm[100],
      glow: colors.warm[400],
    };
  }
  return {
    bar: colors.danger[500],
    ring: colors.danger[100],
    text: colors.danger[800],
    chipBg: colors.danger[100],
    chipText: colors.danger[800],
    track: colors.danger[50],
    glow: colors.danger[500],
  };
}

function CategoryScoreCard({
  scoreKey,
  score,
}: {
  scoreKey: (typeof HEALTH_SCORE_KEYS)[number];
  score: number | null | undefined;
}) {
  const meta = HEALTH_SCORE_META[scoreKey];
  const tone = scoreTone(score ?? 0);
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <View style={[styles.catCard, { borderColor: tone.ring }]}>
      <View style={styles.catHead}>
        <Text numberOfLines={1} style={styles.catLabel}>
          {meta.emoji} {meta.label}
        </Text>
        <View style={[styles.catChip, { backgroundColor: tone.chipBg }]}>
          <Text style={[styles.catChipText, { color: tone.chipText }]}>
            {score != null ? score : '—'}
          </Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: tone.track }]}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: tone.glow }]}
        />
      </View>
    </View>
  );
}

type Props = {
  analysis?: HealthScoreAnalysis | null;
  stale?: boolean;
  onRerun?: (() => void) | null;
  rerunning?: boolean;
  rerunError?: string | null;
  showBrief?: boolean;
  briefKeys?: StaffBriefKey[];
};

export function StaffHealthBrief({
  analysis,
  stale = false,
  onRerun = null,
  rerunning = false,
  rerunError = null,
  showBrief = true,
  briefKeys = [...STAFF_BRIEF_KEYS],
}: Props) {
  const brief = analysis?.staffBrief;
  const visibleBriefKeys = (briefKeys?.length ? briefKeys : [...STAFF_BRIEF_KEYS]).filter(
    (k): k is StaffBriefKey => (STAFF_BRIEF_KEYS as readonly string[]).includes(k),
  );
  const hasBrief = Boolean(
    showBrief && brief && visibleBriefKeys.some((k) => brief[k]),
  );
  const scores = analysis?.scores || {};
  const overall = analysis?.overallScore;
  const hasScores =
    HEALTH_SCORE_KEYS.some((k) => scores[k] != null) || overall != null;
  const tone = scoreTone(overall ?? 0);
  const canRerun = showBrief && typeof onRerun === 'function';

  if (!hasBrief && !hasScores && !(stale && canRerun)) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.titleRow}>
          <Ionicons color={colors.brand[500]} name="document-text-outline" size={16} />
          <Text style={styles.title}>
            {showBrief ? 'Detaylı sağlık analizi' : 'Sağlık skorları'}
          </Text>
        </View>
        {overall != null ? (
          <View style={[styles.overall, { borderColor: tone.ring }]}>
            <Text style={styles.overallLabel}>Genel skor</Text>
            <Text style={[styles.overallVal, { color: tone.text }]}>
              {overall}
              <Text style={styles.overallMax}>/100</Text>
            </Text>
            <View style={[styles.overallGlow, { backgroundColor: tone.glow }]} />
          </View>
        ) : null}
      </View>

      {!showBrief && hasScores ? (
        <Text style={styles.lockedHint}>
          Detaylı personel brief’i üye ücretli paket aldığında görünür.
        </Text>
      ) : null}

      {stale && canRerun ? (
        <View style={styles.staleBox}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.staleTitleRow}>
              <Ionicons color={colors.gold[500]} name="warning-outline" size={16} />
              <Text style={styles.staleTitle}>Analiz güncel değil</Text>
            </View>
            <Text style={styles.staleBody}>
              Sağlık testi veya profil bilgileri güncellendi. Güncel skor ve brief için
              yeniden analiz edin.
            </Text>
            {rerunError ? <Text style={styles.rerunError}>{rerunError}</Text> : null}
          </View>
          <Pressable
            accessibilityLabel="Yeniden analiz et"
            accessibilityRole="button"
            disabled={rerunning}
            onPress={onRerun || undefined}
            style={[styles.rerunBtn, rerunning && { opacity: 0.6 }]}>
            {rerunning ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons color={colors.white} name="refresh" size={14} />
            )}
            <Text style={styles.rerunBtnText}>Yeniden analiz et</Text>
          </Pressable>
        </View>
      ) : null}

      {hasScores ? (
        <View>
          <Text style={styles.sectionLabel}>Kategori puanları</Text>
          <View style={styles.catGrid}>
            {HEALTH_SCORE_KEYS.map((key) => (
              <View key={key} style={styles.catCell}>
                <CategoryScoreCard score={scores[key]} scoreKey={key} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hasBrief
        ? visibleBriefKeys.map((key) => {
            const text = brief?.[key];
            if (!text) return null;
            return (
              <View key={key} style={styles.briefCard}>
                <Text style={styles.briefLabel}>
                  {STAFF_BRIEF_META[key]?.label || key}
                </Text>
                <Text style={styles.briefText}>{text}</Text>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[100],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  overall: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  overallLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.cream[300],
    textTransform: 'uppercase',
  },
  overallVal: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26 },
  overallMax: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[300],
  },
  overallGlow: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    height: 3,
    borderRadius: radius.full,
    opacity: 0.8,
  },
  lockedHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  staleBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  staleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staleTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.gold[500] },
  staleBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
  },
  rerunError: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.danger[700],
    marginTop: 4,
  },
  rerunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warm[500],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rerunBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  sectionLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[300],
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCell: { width: '47%', flexGrow: 1 },
  catCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.white,
    padding: 12,
    gap: 8,
  },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  catLabel: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
  },
  catChip: {
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catChipText: { fontFamily: fonts.sansSemi, fontSize: 13 },
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  briefCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[100],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  briefLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    textTransform: 'uppercase',
  },
  briefText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[800],
  },
});
