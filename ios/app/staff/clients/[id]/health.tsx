/**
 * LOCK: docs/mobile/screens/staff/client-health.md
 * Web: MemberHealthProfilePage audience=staff — StaffHealthBrief + answers + notes
 */
import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

import { HealthLabFilesPanel } from '@/components/member/HealthLabFilesPanel';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import {
  StaffHealthBrief,
  briefKeysForRole,
} from '@/components/staff/StaffHealthBrief';
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
  hasHealthTestProgress,
  HEALTH_AUDIENCE_META,
  isDetailedHealthTestComplete,
  isHealthTestComplete,
} from '@/data/healthTest';
import {
  appendHealthStaffNote,
  normalizeHealthStaffNotes,
  sortHealthStaffNotes,
  HEALTH_NOTE_ROLE_META,
} from '@/data/healthStaffNotes';
import { getDefaultPackageForPlan, getPlanLabel, isPaidMembership } from '@/data/membershipPlans';
import { FITNESS_LABELS, GOAL_LABELS, NUTRITION_LABELS } from '@/services/health';
import {
  getHealthTestLockState,
  isHealthAnalysisStale,
  needsInitialHealthAnalysis,
  type HealthScoreAnalysis,
} from '@/services/healthScoreAnalysis';
import { staffPatchMember } from '@/services/staffDb';
import { useStaffHealthAnalysisRerun } from '@/hooks/useStaffHealthAnalysisRerun';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import { normalizeStaffRole } from '@/utils/staffClients';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { collectHealthLabFiles } from '@/utils/healthLabFiles';
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

/** Rolün görebileceği sağlık testi audience etiketleri — web parity */
function sectionVisibleForRole(
  sectionAudience: string | undefined,
  viewerRole: string | null | undefined,
) {
  const role = normalizeStaffRole(viewerRole);
  if (!viewerRole || String(viewerRole).toLowerCase() === 'admin') return true;
  const aud = sectionAudience || 'shared';
  if (aud === 'shared') return true;
  if (role === 'coach') return aud === 'coach';
  if (role === 'dietitian') return aud === 'dietitian';
  if (role === 'doctor') return aud === 'shared';
  return true;
}

function Chips({
  values,
  map,
  tone = 'cream',
}: {
  values?: unknown;
  map: Record<string, string>;
  tone?: 'cream' | 'sage' | 'brand';
}) {
  const list = Array.isArray(values) ? values.map(String) : [];
  if (!list.length) {
    return <Text style={styles.chipEmpty}>—</Text>;
  }
  const toneStyle =
    tone === 'sage'
      ? { bg: colors.sage[50], fg: colors.sage[700], border: colors.sage[100] }
      : tone === 'brand'
        ? { bg: colors.brand[50], fg: colors.brand[800], border: colors.brand[100] }
        : { bg: colors.cream[100], fg: colors.cream[800], border: colors.cream[200] };
  return (
    <View style={styles.chips}>
      {list.map((v) => (
        <View
          key={v}
          style={[
            styles.chip,
            {
              backgroundColor: toneStyle.bg,
              borderColor: toneStyle.border,
            },
          ]}>
          <Text style={[styles.chipText, { color: toneStyle.fg }]}>
            {map[v] || v}
          </Text>
        </View>
      ))}
    </View>
  );
}

const AVATAR_BG: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  eko_spor: colors.brand[500],
  diyet: colors.sage[500],
  eko_diyet: colors.sage[500],
  eko: colors.sage[500],
};

const PLAN_BADGE: Record<string, { bg: string; fg: string }> = {
  vip: { bg: colors.gold[400], fg: colors.white },
  spor: { bg: colors.brand[100], fg: colors.brand[700] },
  eko_spor: { bg: colors.brand[100], fg: colors.brand[700] },
  diyet: { bg: colors.sage[100], fg: colors.sage[700] },
  eko_diyet: { bg: colors.sage[100], fg: colors.sage[700] },
  eko: { bg: colors.sage[100], fg: colors.sage[700] },
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
  const viewerRole = String(staff?.role || 'coach');
  const memberPaid = Boolean(client && isPaidMembership(client.membership));

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
      ).filter((sec) => sectionVisibleForRole(sec.audience, viewerRole)),
    [client, packageConfig, viewerRole],
  );

  const notes = useMemo(
    () =>
      sortHealthStaffNotes(
        normalizeHealthStaffNotes(client?.healthStaffNotes),
      ),
    [client?.healthStaffNotes],
  );

  const labFiles = useMemo(
    () =>
      collectHealthLabFiles(
        (client?.healthTest as Record<string, unknown>) || {},
        client?.id ? String(client.id) : undefined,
      ),
    [client],
  );

  const briefKeys = useMemo(() => briefKeysForRole(viewerRole), [viewerRole]);

  const analysisStale = useMemo(
    () =>
      client && memberPaid
        ? isHealthAnalysisStale(
            client.healthAnalysis as HealthScoreAnalysis,
            client as Record<string, unknown>,
          )
        : false,
    [client, memberPaid],
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
      retakeAt: ht.retakeAt ? String(ht.retakeAt) : null,
    });
    const stage = analysis?.analysisStage || null;
    const analysisReady = Boolean(
      analysis && !needsInitialHealthAnalysis(analysis),
    );
    const complete = isHealthTestComplete(
      ht,
      gender,
      packageConfig as Record<string, unknown>,
    );
    const hasProgress = hasHealthTestProgress(
      ht,
      gender,
      packageConfig as Record<string, unknown>,
    );
    return {
      lockState,
      stage,
      coreComplete,
      detailedComplete,
      analysisReady,
      complete,
      hasProgress,
    };
  }, [client, packageConfig]);

  const patchMember = useCallback(
    async (memberId: string, patch: Record<string, unknown>) => {
      const res = await staffPatchMember(memberId, patch);
      if (!res.success) throw new Error(res.error || 'Kayıt başarısız');
      await refreshData({ silent: true, reason: 'write' });
      return res;
    },
    [refreshData],
  );

  const {
    rerun,
    loading: analysisRerunning,
    error: analysisRerunError,
  } = useStaffHealthAnalysisRerun({
    member: client as Record<string, unknown> | undefined,
    packageConfig: packageConfig as Record<string, unknown>,
    patchMember,
  });

  const handleRerunAnalysis = useCallback(async () => {
    if (!memberPaid) {
      toast(
        'Yeniden analiz yalnızca aktif ücretli üyelikte kullanılabilir',
        'error',
      );
      return;
    }
    const result = await rerun();
    if (result?.ok) toast('Sağlık analizi güncellendi', 'success');
    else toast(result?.error || 'Yeniden analiz başarısız', 'error');
  }, [rerun, toast, memberPaid]);

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
    await refreshData({ silent: true, reason: 'write' });
  };

  const statusBanner = lockMeta?.complete
    ? {
        border: colors.sage[200],
        bg: colors.sage[50],
        title: 'Kişisel sağlık analizi tamamlandı',
      }
    : lockMeta?.hasProgress
      ? {
          border: colors.warm[200],
          bg: colors.warm[50],
          title: 'Kişisel sağlık analizi devam ediyor',
        }
      : {
          border: colors.cream[200],
          bg: colors.cream[50],
          title: 'Kişisel sağlık analizi başlanmadı',
        };

  const age = client?.age != null ? String(client.age) : null;
  const weight = client?.weight != null ? String(client.weight) : null;
  const height = client?.height != null ? String(client.height) : null;

  return (
    <PanelScaffold
      keyboard
      showBack
      subtitle={client ? String(client.name) : 'Danışan'}
      title="Sağlık özeti">
      {loading && !client ? (
        <InlineSpinner fill />
      ) : !client ? (
        <EmptyState title="Danışan bulunamadı." />
      ) : (
        <View style={{ gap: spacing.md, paddingBottom: 32 }}>
          <FadeIn delay={40}>
            <View style={styles.identityCard}>
              {client.photo ? (
                <Image
                  accessibilityLabel={String(client.name)}
                  contentFit="cover"
                  source={{ uri: String(client.photo) }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: AVATAR_BG[plan] || colors.cream[300] },
                  ]}>
                  <Text style={styles.avatarText}>{initials(String(client.name))}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
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
                  <Text style={styles.metaLine}>Yeniden çözme hakkı açık</Text>
                ) : null}
              </View>
            </FadeIn>
          ) : null}

          <FadeIn delay={70}>
            <View
              style={[
                styles.statusBanner,
                {
                  borderColor: statusBanner.border,
                  backgroundColor: statusBanner.bg,
                },
              ]}>
              <Text style={styles.statusTitle}>{statusBanner.title}</Text>
              <Text style={styles.statusMeta}>
                {client.gender === 'female'
                  ? 'Kadın'
                  : client.gender === 'male'
                    ? 'Erkek'
                    : 'Cinsiyet belirtilmemiş'}
                {' · '}
                {age ? `${age} yaş` : 'Yaş —'}
                {weight ? ` · ${weight} kg` : ''}
                {height ? ` · ${height} cm` : ''}
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={80}>
            <View style={styles.profileGrid}>
              <View style={styles.profileCard}>
                <Text style={styles.profileLabel}>Spor Seviyesi</Text>
                <Text style={styles.profileVal}>
                  {FITNESS_LABELS[String(client.fitnessLevel || '')] || '—'}
                </Text>
              </View>
              <View style={styles.profileCard}>
                <Text style={styles.profileLabel}>Hedefler</Text>
                <Chips map={GOAL_LABELS} tone="brand" values={client.goals} />
              </View>
              <View style={styles.profileCard}>
                <Text style={styles.profileLabel}>Beslenme</Text>
                <Chips
                  map={NUTRITION_LABELS}
                  tone="sage"
                  values={client.nutritionPrefs}
                />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={90}>
            <StaffHealthBrief
              analysis={(client.healthAnalysis as HealthScoreAnalysis) || null}
              briefKeys={briefKeys}
              onRerun={memberPaid ? () => void handleRerunAnalysis() : null}
              rerunError={analysisRerunError}
              rerunning={analysisRerunning}
              showBrief={memberPaid}
              stale={analysisStale}
            />
          </FadeIn>

          {labFiles.length > 0 && client?.id ? (
            <FadeIn delay={95}>
              <HealthLabFilesPanel files={labFiles} memberId={String(client.id)} />
            </FadeIn>
          ) : null}

          <FadeIn delay={100}>
            <Text style={styles.sectionTitle}>Sağlık Analizi Cevapları</Text>
            {sections.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Henüz cevaplanmış soru yok.</Text>
              </View>
            ) : (
              sections.map((sec) => {
                const aud =
                  HEALTH_AUDIENCE_META[sec.audience || 'shared'] ||
                  HEALTH_AUDIENCE_META.shared;
                return (
                  <View
                    key={sec.id}
                    style={[
                      styles.card,
                      {
                        borderColor: aud.borderColor,
                        backgroundColor: aud.sectionBg,
                      },
                    ]}>
                    <View style={styles.sectionHead}>
                      <Text style={styles.cardHeading}>{sec.title}</Text>
                      <View
                        style={[styles.audChip, { backgroundColor: aud.chipBg }]}>
                        <Text style={[styles.audChipText, { color: aud.chipText }]}>
                          {aud.label}
                        </Text>
                      </View>
                    </View>
                    {sec.items.map((item, i) => (
                      <View key={`${sec.id}-${i}`}>
                        {i > 0 ? <View style={styles.rowDivider} /> : null}
                        <Text style={styles.label}>{item.label}</Text>
                        <Text style={styles.val}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </FadeIn>

          {Boolean(client.healthAck || client.disclaimer) ? (
            <FadeIn delay={110}>
              <View style={styles.ackCard}>
                {client.healthAck ? (
                  <Text style={styles.ackText}>✓ Sağlık bilgisi doğruluğu onayı</Text>
                ) : null}
                {client.disclaimer ? (
                  <Text style={styles.ackText}>✓ Tıbbi feragat onayı</Text>
                ) : null}
              </View>
            </FadeIn>
          ) : null}

          <FadeIn delay={120}>
            <Text style={styles.sectionTitle}>Klinik Notlar</Text>
            {notes.map((n) => {
              const meta =
                HEALTH_NOTE_ROLE_META[n.staffRole] || HEALTH_NOTE_ROLE_META.coach;
              return (
                <View key={n.id} style={styles.noteCard}>
                  <View style={styles.noteMeta}>
                    <View style={[styles.roleChip, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.roleChipText, { color: meta.fg }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.noteWho}>{n.staffName}</Text>
                    <Text style={styles.noteAt}>
                      {formatRelativeTimeTr(n.createdAt)}
                    </Text>
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
        </View>
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
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: colors.cream[100],
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  name: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream[900],
    flexShrink: 1,
  },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  gender: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  statusBanner: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 4,
  },
  statusTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  statusMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  profileGrid: { gap: spacing.sm },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: 8,
  },
  profileLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[300],
    textTransform: 'uppercase',
  },
  profileVal: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 12 },
  chipEmpty: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[300] },
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
  sectionHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardHeading: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900], flex: 1 },
  audChip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  audChipText: { fontFamily: fonts.sansSemi, fontSize: 10 },
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
  ackCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sage[100],
    backgroundColor: colors.sage[50],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 4,
  },
  ackText: { fontFamily: fonts.sans, fontSize: 12, color: colors.sage[700] },
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
