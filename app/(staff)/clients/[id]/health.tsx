/**
 * LOCK: docs/mobile/screens/staff/client-health.md
 * Web: MemberHealthProfilePage audience=staff — answers + clinical notes only
 */
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '@/data/coreHealthTest';
import {
  describeHealthTest,
  isDetailedHealthTestComplete,
} from '@/data/healthTest';
import {
  appendHealthStaffNote,
  normalizeHealthStaffNotes,
  sortHealthStaffNotes,
  HEALTH_NOTE_ROLE_META,
} from '@/data/healthStaffNotes';
import { getDefaultPackageForPlan, getPlanLabel } from '@/data/membershipPlans';
import {
  getHealthTestLockState,
  needsInitialHealthAnalysis,
  type HealthScoreAnalysis,
} from '@/services/healthScoreAnalysis';
import { staffPatchMember } from '@/services/staffDb';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_BG: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  diyet: colors.sage[500],
};

const PLAN_BADGE: Record<string, { bg: string; fg: string }> = {
  vip: { bg: colors.gold[400], fg: colors.white },
  spor: { bg: colors.brand[100], fg: colors.brand[700] },
  diyet: { bg: colors.sage[100], fg: colors.sage[700] },
};

const GENDER_TR: Record<string, string> = { female: 'Kadın', male: 'Erkek' };

export default function ClientHealth() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, staffClients, refreshData } = useData();
  const { staff } = useAuth();
  const client = staffClients.find((c) => String(c.id) === String(id));
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const plan = String(client?.membership || '');
  const badge = PLAN_BADGE[plan] || { bg: colors.cream[100], fg: colors.cream[800] };
  const genderTr = GENDER_TR[String(client?.gender || '')] || '—';

  const packageConfig = useMemo(() => {
    if (!client) return getDefaultPackageForPlan('free');
    return (
      resolveMemberEntitlements(client as never).packageConfig ||
      getDefaultPackageForPlan(plan || 'free')
    );
  }, [client, plan]);

  const sections = useMemo(
    () =>
      describeHealthTest(
        (client?.healthTest as Record<string, unknown>) || {},
        client?.gender ? String(client.gender) : null,
        packageConfig as Record<string, unknown>,
      ),
    [client, packageConfig],
  );

  const notes = useMemo(
    () =>
      sortHealthStaffNotes(
        normalizeHealthStaffNotes(client?.healthStaffNotes),
      ),
    [client?.healthStaffNotes],
  );

  const lockMeta = useMemo(() => {
    if (!client) return null;
    const gender = client.gender ? String(client.gender) : null;
    const ht = (client.healthTest as Record<string, unknown>) || {};
    const analysis = (client.healthAnalysis as HealthScoreAnalysis) || null;
    const coreComplete = Boolean(
      gender && isCoreHealthTestComplete(ht, gender),
    );
    const coreKeys = getCoreHealthTestKeySet(gender);
    const detailedComplete = Boolean(
      coreComplete &&
        isDetailedHealthTestComplete(
          ht,
          gender,
          packageConfig as Record<string, unknown>,
          coreKeys,
        ),
    );
    const lockState = getHealthTestLockState({
      healthAnalysis: analysis,
      detailedComplete,
      optionalCompletedAt: ht.optionalCompletedAt
        ? String(ht.optionalCompletedAt)
        : null,
    });
    const stage = analysis?.analysisStage || null;
    const analysisReady = Boolean(
      analysis && !needsInitialHealthAnalysis(analysis),
    );
    return { lockState, stage, coreComplete, detailedComplete, analysisReady };
  }, [client, packageConfig]);

  const saveNote = async () => {
    if (!client?.id || !note.trim()) return;
    setSaving(true);
    const nextNotes = appendHealthStaffNote(notes, {
      text: note,
      staffId: String(staff?.id || ''),
      staffName: String(staff?.name || 'Uzman'),
      staffRole: String(staff?.role || 'coach'),
    });
    const res = await staffPatchMember(String(client.id), {
      healthStaffNotes: nextNotes,
    });
    setSaving(false);
    if (!res.success) {
      toast(res.error || 'Not kaydedilemedi.', 'error');
      return;
    }
    setNote('');
    toast('Not kaydedildi.', 'success');
    await refreshData();
  };

  return (
    <PanelScaffold
      showBack
      subtitle={client ? String(client.name) : 'Danışan'}
      title="Sağlık özeti">
      {loading && !client ? (
        <InlineSpinner fill />
      ) : !client ? (
        <EmptyState title="Danışan bulunamadı." />
      ) : (
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 32 }}>
          <FadeIn delay={40}>
            <View style={styles.identityCard}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: AVATAR_BG[plan] || colors.cream[300] },
                ]}>
                <Text style={styles.avatarText}>{initials(String(client.name))}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.name}>
                  {String(client.name)}
                </Text>
                <View style={styles.identityMeta}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>
                      {getPlanLabel(plan)}
                    </Text>
                  </View>
                  <Text style={styles.gender}>{genderTr}</Text>
                </View>
              </View>
            </View>
          </FadeIn>

          {lockMeta ? (
            <FadeIn delay={60}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLine}>
                  Aşama:{' '}
                  {!lockMeta.coreComplete
                    ? '1. aşama (çekirdek) bekleniyor'
                    : lockMeta.detailedComplete
                      ? '2. aşama tamamlandı'
                      : '1. aşama tamam — opsiyonel devam ediyor'}
                </Text>
                {lockMeta.stage ? (
                  <Text style={styles.metaLine}>
                    Analiz: {lockMeta.stage === 'detailed' ? 'Detaylı' : 'Temel'}
                    {lockMeta.analysisReady
                      ? ` · skor ${String((client?.healthAnalysis as HealthScoreAnalysis)?.overallScore ?? '—')}/100`
                      : ''}
                  </Text>
                ) : null}
                {lockMeta.lockState.fullLock ? (
                  <Text style={styles.metaLock}>
                    Cevaplar kilitli
                    {lockMeta.lockState.daysLeft
                      ? ` · ${lockMeta.lockState.daysLeft} gün sonra yeniden çözülebilir`
                      : ''}
                  </Text>
                ) : lockMeta.lockState.canRetake ? (
                  <Text style={styles.metaLine}>
                    Yeniden çözme hakkı açık
                  </Text>
                ) : null}
              </View>
            </FadeIn>
          ) : null}

          <FadeIn delay={80}>
            <Text style={styles.sectionTitle}>Sağlık Analizi Cevapları</Text>
            {sections.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Henüz cevaplanmış soru yok.</Text>
              </View>
            ) : (
              sections.map((sec) => (
                <View key={sec.id} style={styles.card}>
                  <Text style={styles.cardHeading}>{sec.title}</Text>
                  {sec.items.map((item, i) => (
                    <View key={`${sec.id}-${i}`}>
                      {i > 0 ? <View style={styles.rowDivider} /> : null}
                      <Text style={styles.label}>{item.label}</Text>
                      <Text style={styles.val}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </FadeIn>

          <FadeIn delay={120}>
            <Text style={styles.sectionTitle}>Klinik Notlar</Text>
            {notes.map((n) => {
              const meta = HEALTH_NOTE_ROLE_META[n.staffRole] || HEALTH_NOTE_ROLE_META.coach;
              return (
                <View key={n.id} style={styles.noteCard}>
                  <View style={styles.noteMeta}>
                    <View style={[styles.roleChip, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.roleChipText, { color: meta.fg }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.noteWho}>{n.staffName}</Text>
                    <Text style={styles.noteAt}>{formatRelativeTimeTr(n.createdAt)}</Text>
                  </View>
                  <Text style={styles.noteText}>{n.text}</Text>
                </View>
              );
            })}
            {notes.length === 0 ? (
              <Text style={styles.emptyText}>Henüz not yok.</Text>
            ) : null}
            <Text style={styles.label}>Yeni not</Text>
            <TextInput
              editable={!saving}
              multiline
              onBlur={() => setFocused(false)}
              onChangeText={setNote}
              onFocus={() => setFocused(true)}
              placeholder="Danışan notu…"
              placeholderTextColor={colors.cream[300]}
              style={[styles.input, focused && styles.inputFocused]}
              value={note}
            />
            <Button
              disabled={!note.trim() || saving}
              label="Notu Kaydet"
              onPress={() => void saveNote()}
              style={{ marginTop: spacing.sm }}
            />
          </FadeIn>
        </ScrollView>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.md,
    gap: 4,
  },
  metaLine: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[900],
  },
  metaLock: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.warm[500],
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  gender: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 8,
    marginBottom: spacing.sm,
  },
  cardHeading: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  rowDivider: { height: 1, backgroundColor: colors.cream[100], marginBottom: 8 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
  },
  val: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900], marginTop: 2 },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.sm,
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  roleChip: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleChipText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  noteWho: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900] },
  noteAt: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[300] },
  noteText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], lineHeight: 20 },
  input: {
    minHeight: 100,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: 12,
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    textAlignVertical: 'top',
  },
  inputFocused: { borderColor: colors.brand[300] },
});
