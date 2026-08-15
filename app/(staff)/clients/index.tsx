import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import type { MemberRecord } from '@/services/mappers';
import {
  bmiCategory,
  calculateBMI,
  FITNESS_LABELS,
  GOAL_LABELS,
} from '@/services/health';
import { ageFromBirthDate } from '@/utils/birthDate';
import { workoutWeekdayLabels } from '@/utils/memberAvailability';
import { getStaffAppointments, type StaffAppointment } from '@/utils/staffAppointments';
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

function isCoachRole(role: string) {
  return role === 'coach';
}

function isDietitianRole(role: string) {
  return role === 'dietitian';
}

function roleIcon(role: string): keyof typeof Ionicons.glyphMap {
  if (role === 'dietitian') return 'nutrition-outline';
  if (role === 'doctor') return 'medkit-outline';
  return 'barbell-outline';
}

function planIdOf(m: MemberRecord): string {
  const pkg = m.packageConfig as { planId?: string } | undefined;
  return String(pkg?.planId || m.membership || '');
}

function memberAge(m: MemberRecord): string {
  const raw = m.age;
  if (raw != null && String(raw).trim()) return String(raw);
  const fromBirth = ageFromBirthDate(m.birthDate ? String(m.birthDate) : null);
  return fromBirth != null ? String(fromBirth) : '—';
}

function genderLabel(gender: unknown): string {
  if (gender === 'female') return 'Kadın';
  if (gender === 'male') return 'Erkek';
  return '—';
}

function bmiToneStyles(tone: string): { bg: string; fg: string } {
  switch (tone) {
    case 'amber':
      return { bg: colors.warm[100], fg: colors.warm[500] };
    case 'sage':
      return { bg: colors.sage[50], fg: colors.sage[700] };
    case 'orange':
      return { bg: colors.warm[100], fg: colors.warm[500] };
    case 'danger':
      return { bg: colors.danger[50], fg: colors.danger[600] };
    default:
      return { bg: colors.cream[100], fg: colors.cream[800] };
  }
}

function sessionWhen(dateISO?: string) {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  const day = isToday(d) ? 'Bugün' : format(d, 'd MMM', { locale: tr });
  return `${day} ${format(d, 'HH:mm')}`;
}

function Chips({ values, map }: { values?: string[] | null; map: Record<string, string> }) {
  if (!values?.length) {
    return <Text style={styles.mutedDash}>—</Text>;
  }
  return (
    <View style={styles.chips}>
      {values.map((v) => (
        <View key={v} style={styles.chip}>
          <Text style={styles.chipText}>{map[v] || v}</Text>
        </View>
      ))}
    </View>
  );
}

function ClientInfoModal({
  member,
  role,
  onClose,
}: {
  member: MemberRecord;
  role: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bmi = calculateBMI(member.weight, member.height);
  const cat = bmiCategory(bmi);
  const tone = bmiToneStyles(cat.tone);
  const appts = getStaffAppointments([member as Record<string, unknown>], role).slice(0, 4);
  const weekdays = workoutWeekdayLabels(
    (member.availability as Record<string, unknown>) || {},
  ) as string[];
  const planLabel = getPlanLabel(planIdOf(member)) || '—';
  const status =
    member.membershipStatus === 'active'
      ? 'Aktif'
      : String(member.membershipStatus || '—');

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text numberOfLines={1} style={styles.sheetTitle}>
              {String(member.name || 'Danışan')}
            </Text>
            <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
              <Ionicons color={colors.cream[800]} name="close" size={22} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}>
            {member.photo ? (
              <Image
                contentFit="cover"
                source={{ uri: String(member.photo) }}
                style={styles.infoPhoto}
              />
            ) : null}

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Vücut Kitle İndeksi</Text>
                <Text style={styles.infoValueLg}>{bmi ?? '—'}</Text>
                <View style={[styles.bmiPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.bmiPillText, { color: tone.fg }]}>{cat.label}</Text>
                </View>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Ölçüler</Text>
                <Text style={styles.infoValue}>
                  {member.weight ? `${member.weight} kg` : '—'} ·{' '}
                  {member.height ? `${member.height} cm` : '—'}
                </Text>
                <Text style={styles.infoSub}>
                  Bel: {member.waist ? `${member.waist} cm` : '—'}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Spor Seviyesi</Text>
                <View style={styles.infoRow}>
                  <Ionicons color={colors.brand[500]} name="fitness-outline" size={16} />
                  <Text style={styles.infoValue}>
                    {FITNESS_LABELS[String(member.fitnessLevel || '')] || '—'}
                  </Text>
                </View>
                <Text style={styles.infoSub}>
                  Yaş: {memberAge(member)} · {genderLabel(member.gender)}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Paket</Text>
                <View style={styles.infoRow}>
                  <Ionicons color={colors.cream[800]} name="cube-outline" size={14} />
                  <Text style={styles.infoValue}>{planLabel}</Text>
                </View>
                <Text style={styles.infoSub}>{status}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons color={colors.brand[500]} name="flag-outline" size={16} />
                <Text style={styles.sectionTitle}>Hedefler</Text>
              </View>
              <Chips map={GOAL_LABELS} values={member.goals} />
            </View>

            <Pressable
              onPress={() => {
                onClose();
                router.push(`/(staff)/clients/${member.id}/health` as Href);
              }}
              style={({ pressed }) => [styles.healthCta, pressed && styles.pressed]}>
              <Ionicons color={colors.white} name="heart" size={16} />
              <Text style={styles.healthCtaText}>Tam Sağlık Profili & Notlar</Text>
            </Pressable>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons color={colors.brand[500]} name="calendar-outline" size={16} />
                <Text style={styles.sectionTitle}>Antrenman Müsaitliği</Text>
              </View>
              {weekdays.length === 0 ? (
                <Text style={styles.muted}>
                  Danışan henüz antrenman günü belirtmemiş.
                </Text>
              ) : (
                <View style={styles.chips}>
                  {weekdays.map((d) => (
                    <View key={d} style={styles.chip}>
                      <Text style={styles.chipText}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons color={colors.brand[500]} name="time-outline" size={16} />
                <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
              </View>
              {appts.length === 0 ? (
                <Text style={styles.muted}>Yaklaşan randevu yok</Text>
              ) : (
                appts.map((a: StaffAppointment) => (
                  <View key={a.id} style={styles.apptRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptTitle}>{a.title || 'Seans'}</Text>
                      <Text style={styles.apptMeta}>{sessionWhen(a.date)}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>
                        {a.date ? format(new Date(a.date), 'HH:mm') : '—'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** LOCK: docs/mobile/screens/staff/clients.md — web StaffClientsPage parity */
export default function StaffClients() {
  const { staff } = useAuth();
  const { loading, staffClients } = useData();
  const role = String(staff?.role || 'coach');
  const isCoach = isCoachRole(role);
  const isDietitian = isDietitianRole(role);
  const canBuild = isCoach || isDietitian;
  const [search, setSearch] = useState('');
  const [infoClient, setInfoClient] = useState<MemberRecord | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return staffClients;
    return staffClients.filter((m) =>
      String(m.name || '')
        .toLowerCase()
        .includes(s),
    );
  }, [search, staffClients]);

  const openProgramFlow = useCallback(
    (member: MemberRecord) => {
      if (isCoach) {
        router.push(`/(staff)/clients/${member.id}/program` as Href);
        return;
      }
      if (isDietitian) {
        router.push(`/(staff)/clients/${member.id}/list` as Href);
      }
    },
    [isCoach, isDietitian],
  );

  const primaryLabel = isCoach
    ? 'Program Oluştur'
    : isDietitian
      ? 'Liste Oluştur'
      : 'Randevu';

  const renderClient = useCallback(
    ({ item: m }: { item: MemberRecord }) => {
      const bmi = calculateBMI(m.weight, m.height);
      const cat = bmiCategory(bmi);
      const tone = bmiToneStyles(cat.tone);
      const planLabel = getPlanLabel(planIdOf(m)) || 'Üye';
      const photo = m.photo ? String(m.photo) : '';
      const name = String(m.name || '');

      return (
        <View style={styles.card}>
          <View style={styles.identityRow}>
            {photo ? (
              <Image contentFit="cover" source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(name) || '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={styles.name}>
                {name}
              </Text>
              <Text numberOfLines={1} style={styles.planLine}>
                {planLabel}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.fitnessRow}>
              <Ionicons color={colors.cream[800]} name={roleIcon(role)} size={16} />
              <Text style={styles.fitnessText}>
                {FITNESS_LABELS[String(m.fitnessLevel || '')] || '—'}
              </Text>
            </View>
            <View style={[styles.bmiBadge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.bmiBadgeText, { color: tone.fg }]}>
                VKİ {bmi ?? '—'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            <Pressable
              onPress={() => setInfoClient(m)}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}>
              <Ionicons color={colors.cream[800]} name="person-outline" size={14} />
              <Text style={styles.btnSecondaryText}>Bilgiler</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(staff)/clients/${m.id}/health` as Href)}
              style={({ pressed }) => [styles.btnHealth, pressed && styles.pressed]}>
              <Ionicons color={colors.warm[500]} name="heart-outline" size={14} />
              <Text style={styles.btnHealthText}>Sağlık Profili</Text>
            </Pressable>
            <Pressable
              disabled={!canBuild}
              onPress={() => openProgramFlow(m)}
              style={({ pressed }) => [
                styles.btnPrimary,
                !canBuild && styles.btnDisabled,
                canBuild && pressed && styles.pressed,
              ]}>
              <Ionicons
                color={canBuild ? colors.white : colors.cream[800]}
                name="document-text-outline"
                size={14}
                style={!canBuild ? { opacity: 0.4 } : undefined}
              />
              <Text style={[styles.btnPrimaryText, !canBuild && styles.btnDisabledText]}>
                {primaryLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(staff)/messages/${m.id}` as Href)}
              style={({ pressed }) => [styles.btnMessage, pressed && styles.pressed]}>
              <Ionicons color={colors.warm[500]} name="chatbubble-outline" size={14} />
              <Text style={styles.btnMessageText}>Mesaj</Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [canBuild, openProgramFlow, primaryLabel, role],
  );

  return (
    <PanelScaffold
      scroll={false}
      subtitle={`${staffClients.length} danışan · bilgileri görüntüleyin veya program oluşturun`}
      title="Danışanlarım">
      <View style={styles.searchWrap}>
        <Ionicons color={colors.cream[800]} name="search" size={18} style={{ opacity: 0.4 }} />
        <TextInput
          onChangeText={setSearch}
          placeholder="İsim ara…"
          placeholderTextColor={colors.cream[300]}
          style={styles.searchInput}
          value={search}
        />
      </View>

      {loading && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <FlatList
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 16, flexGrow: 1 }}
          data={filtered}
          initialNumToRender={8}
          keyExtractor={(m) => String(m.id)}
          ListEmptyComponent={
            <EmptyState
              description="Size atanan ücretli üyeler burada görünecek."
              icon="people"
              iconBg={colors.sage[100]}
              iconColor={colors.sage[600]}
              iconSize={64}
              title="Danışan bulunamadı"
            />
          }
          maxToRenderPerBatch={8}
          removeClippedSubviews
          renderItem={renderClient}
          style={{ flex: 1 }}
          windowSize={9}
        />
      )}

      {infoClient ? (
        <ClientInfoModal
          member={infoClient}
          onClose={() => setInfoClient(null)}
          role={role}
        />
      ) : null}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.md,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[100],
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.brand[600] },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  planLine: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fitnessRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  fitnessText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
  },
  bmiBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bmiBadgeText: { fontFamily: fonts.sansSemi, fontSize: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btnSecondary: {
    width: '48%',
    flexGrow: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingHorizontal: 8,
  },
  btnSecondaryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
  },
  btnHealth: {
    width: '48%',
    flexGrow: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    paddingHorizontal: 8,
  },
  btnHealthText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.warm[500],
  },
  btnPrimary: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
    paddingHorizontal: 8,
  },
  btnPrimaryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.white,
  },
  btnDisabled: {
    backgroundColor: colors.cream[50],
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  btnDisabledText: {
    color: colors.cream[800],
    opacity: 0.4,
  },
  btnMessage: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    paddingHorizontal: 8,
  },
  btnMessageText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.warm[500],
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    marginBottom: spacing.sm,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 8,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
  },
  sheetBody: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  infoPhoto: {
    alignSelf: 'center',
    width: 128,
    height: 160,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.cream[50],
    borderRadius: radius.lg,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
  },
  infoValueLg: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.cream[900],
  },
  infoValue: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  infoSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
    marginTop: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bmiPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  bmiPillText: { fontFamily: fonts.sansSemi, fontSize: 10 },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
    opacity: 0.85,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.cream[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
  },
  muted: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.4,
  },
  mutedDash: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.4,
  },
  healthCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.warm[500],
    paddingHorizontal: spacing.md,
  },
  healthCtaText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.white,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
  },
  apptTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  apptMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[700],
  },
});
