import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn as ReFadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionBooker } from '@/components/schedule/SessionBooker';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useData, useMember } from '@/context/DataContext';
import { fetchBookedSlots } from '@/services/bookSession';
import {
  coachMonthlyLimit,
  dietitianMonthlyLimit,
  getDefaultPackageForPlan,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';
import { resolveMemberEntitlements } from '@/utils/memberPackages';
import {
  canMemberModifySession,
  memberCancelBlockedCopy,
  memberCancelLabel,
  VIDEO_ACTIVE_STATUSES,
} from '@/utils/sessionCancelRules';
import {
  countSessionsThisMonth,
  memberCallPath,
  parseTabParam,
  SESSION_TABS,
  sessionsKey,
  type MemberSession,
  type SessionType,
} from '@/utils/sessionBooking';
import {
  canJoinSession,
  getJoinWindowMinutes,
} from '@/services/videoCallSession';
import { colors, fonts, radius, spacing } from '@/theme';

const UPCOMING_STATUSES = [
  'pending',
  'scheduled',
  'rescheduled',
  'cancel_pending',
  'admin_cancel_pending',
];

/**
 * LOCK: docs/mobile/screens/member/schedule.md + session-booker.md
 */
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab = parseTabParam(params.tab);
  const member = useMember();
  const { staffById, isFreeTrialExpired } = useData();
  const { bookStaffSession, cancelStaffSession, rescheduleStaffSession } = useActions();
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<MemberSession | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MemberSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [listFilter, setListFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const { packageConfig } = useMemo(() => {
    if (!member) {
      return { packageConfig: getDefaultPackageForPlan('free') };
    }
    return resolveMemberEntitlements(member as never);
  }, [member]);

  const tabMeta = SESSION_TABS.find((t) => t.id === tab) || SESSION_TABS[0];

  const canBook = useMemo(() => {
    if (tab === 'coach') return packageIncludesCoach(packageConfig);
    if (tab === 'dietitian') return packageIncludesDietitian(packageConfig);
    return packageIncludesDoctor(packageConfig);
  }, [tab, packageConfig]);

  const monthlyLimit = useMemo(() => {
    if (tab === 'coach') return coachMonthlyLimit(packageConfig);
    if (tab === 'dietitian') return dietitianMonthlyLimit(packageConfig);
    return 1;
  }, [tab, packageConfig]);

  const sessions = useMemo(() => {
    const key = sessionsKey(tab);
    return ((member?.[key] as MemberSession[]) || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(String(a.date || 0)).getTime() - new Date(String(b.date || 0)).getTime(),
      );
  }, [member, tab]);

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    if (listFilter === 'all') return sessions;
    if (listFilter === 'past') {
      return sessions
        .filter((s) => s.status === 'completed' || (s.date && new Date(s.date).getTime() < now))
        .reverse();
    }
    return sessions.filter(
      (s) =>
        UPCOMING_STATUSES.includes(s.status || 'scheduled') &&
        s.date &&
        new Date(s.date).getTime() >= now,
    );
  }, [sessions, listFilter]);

  const usedThisMonth = countSessionsThisMonth(sessions);
  const rescheduleDays = tab === 'coach' ? 3 : 5;

  const assignedKey =
    tab === 'dietitian'
      ? 'assignedDietitianId'
      : tab === 'doctor'
        ? 'assignedDoctorId'
        : 'assignedCoachId';
  const staffId = member?.[assignedKey] ? String(member[assignedKey]) : '';
  const staff = staffId ? staffById[staffId] || null : null;

  const setTab = (id: SessionType) => {
    router.setParams({ tab: id });
  };

  if (isFreeTrialExpired) {
    return <FreeTrialExpiredGate />;
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}>
        <FadeIn>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[colors.brand[600], colors.brand[700], colors.sage[600]]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroBlob} />
            <Text style={styles.kicker}>Randevular</Text>
            <Animated.View
              entering={ReFadeIn.duration(150)}
              key={tab}
              style={styles.heroSwap}>
              <Text style={styles.title}>{tabMeta.title}</Text>
              <Text style={styles.sub}>{tabMeta.subtitle}</Text>
              {canBook && staff ? (
                <View style={styles.heroMeta}>
                  <Ionicons color="rgba(255,255,255,0.9)" name="person-circle" size={18} />
                  <Text style={styles.heroMetaText} numberOfLines={1}>
                    {String(staff.name || 'Uzman')}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </View>
        </FadeIn>

        <View style={styles.tabs}>
          {SESSION_TABS.map((t) => {
            const on = t.id === tab;
            return (
              <Pressable
                accessibilityLabel={`${t.label} sekmesi`}
                accessibilityRole="button"
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, on && styles.tabOn]}>
                <View style={[styles.tabIcon, on && styles.tabIconOn]}>
                  <Ionicons
                    color={on ? colors.brand[700] : colors.brand[500]}
                    name={t.icon}
                    size={15}
                  />
                </View>
                <Text style={[styles.tabLabel, on && styles.tabLabelOn]} numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!canBook ? (
          <FadeIn delay={80}>
            <View style={styles.locked}>
              <Ionicons color={colors.warm[500]} name="lock-closed" size={28} />
              <Text style={styles.lockedTitle}>{tabMeta.lockedTitle}</Text>
              <Text style={styles.lockedDesc}>{tabMeta.lockedDescription}</Text>
              <Button
                label="Paketleri gör"
                onPress={() => router.push('/(member)/profile/payments' as Href)}
                variant="secondary"
              />
            </View>
          </FadeIn>
        ) : (
          <>
            <FadeIn delay={60}>
              <View style={styles.quotaRow}>
                <Text style={styles.quotaText}>
                  Bu ay: {usedThisMonth}/{monthlyLimit || '—'}
                </Text>
                <Button
                  label="Randevu Al"
                  onPress={() => setBookOpen(true)}
                  size="md"
                  style={styles.bookBtn}
                />
              </View>
            </FadeIn>

            <View style={styles.listFilters}>
              {(
                [
                  { id: 'upcoming', label: 'Yaklaşan' },
                  { id: 'past', label: 'Geçmiş' },
                  { id: 'all', label: 'Tümü' },
                ] as const
              ).map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setListFilter(f.id)}
                  style={[styles.listChip, listFilter === f.id && styles.listChipOn]}>
                  <Text
                    style={[
                      styles.listChipText,
                      listFilter === f.id && styles.listChipTextOn,
                    ]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filteredSessions.length === 0 ? (
              <FadeIn delay={100}>
                <EmptyState
                  description="Uzmanınızın müsait olduğu gün ve saatlerden Randevu Al ile yeni görüşme planlayabilirsiniz."
                  title="Randevu bulunamadı"
                />
              </FadeIn>
            ) : (
              filteredSessions.map((s, i) => {
                const isPast = s.date ? new Date(s.date).getTime() < Date.now() : false;
                const status = s.status || 'scheduled';
                const withinNotice = canMemberModifySession(s);
                const isActive = UPCOMING_STATUSES.includes(status);
                const canReschedule =
                  ['scheduled', 'rescheduled'].includes(status) && !isPast && withinNotice;
                const canCancel =
                  (status === 'pending' && !isPast) ||
                  (['scheduled', 'rescheduled'].includes(status) && !isPast && withinNotice);
                const showBlocked =
                  ['scheduled', 'rescheduled'].includes(status) && !isPast && !withinNotice;
                const joinCheck = canJoinSession(s, tab);
                const joinable = Boolean(s.id && joinCheck.ok);
                const win = getJoinWindowMinutes(tab);
                const when = s.date
                  ? format(new Date(s.date), "d MMMM yyyy · HH:mm", { locale: tr })
                  : '—';
                const statusLabel =
                  status === 'completed'
                    ? 'Tamamlandı'
                    : status === 'cancelled'
                      ? 'İptal'
                      : status === 'rejected'
                        ? 'Reddedildi'
                        : status === 'pending'
                          ? 'Onay bekliyor'
                          : status === 'cancel_pending'
                            ? 'İptal onayı bekleniyor'
                            : status === 'admin_cancel_pending'
                              ? 'Yönetim iptal onayı'
                              : status === 'rescheduled'
                                ? 'Yeniden planlandı'
                                : 'Planlandı';
                return (
                  <FadeIn key={s.id} delay={80 + i * 40}>
                    <View style={styles.card}>
                      <View style={styles.cardTop}>
                        <View style={[styles.badge, { backgroundColor: colors.brand[100] }]}>
                          <Ionicons color={colors.brand[700]} name={tabMeta.icon} size={16} />
                        </View>
                        <View style={styles.cardMeta}>
                          <Text style={styles.cardTitle}>{s.title || tabMeta.title}</Text>
                          <Text style={styles.cardWhen}>{when}</Text>
                          <Text style={styles.cardStatus}>{statusLabel}</Text>
                          {s.coach ? (
                            <Text style={styles.cardStaff}>{String(s.coach)}</Text>
                          ) : null}
                        </View>
                      </View>
                      {isActive ? (
                        <View style={styles.cardActions}>
                        {showBlocked ? (
                          <Text style={styles.joinHint}>{memberCancelBlockedCopy()}</Text>
                        ) : null}
                        {status === 'cancel_pending' ? (
                          <Text style={styles.joinHint}>
                            İptal talebiniz uzman onayını bekliyor. Onaylanana kadar randevu
                            geçerlidir.
                          </Text>
                        ) : null}
                        {!joinable &&
                        !isPast &&
                        VIDEO_ACTIVE_STATUSES.includes(status as (typeof VIDEO_ACTIVE_STATUSES)[number]) ? (
                          <Text style={styles.joinHint}>
                            {joinCheck.reason ||
                              `Katılım penceresi: seans öncesi ${win.before} dk / sonrası ${win.after} dk`}
                          </Text>
                        ) : null}
                        <View style={styles.actionRow}>
                          {joinable && s.id ? (
                            <Button
                              label="Katıl"
                              onPress={() =>
                                router.push(memberCallPath(tab, s.id) as Href)
                              }
                              size="md"
                              style={{ flex: 1 }}
                            />
                          ) : null}
                          {canReschedule ? (
                            <Pressable
                              onPress={() => setRescheduleTarget(s)}
                              style={styles.modifyBtn}>
                              <Text style={styles.modifyText}>Yeniden Planla</Text>
                            </Pressable>
                          ) : null}
                          {canCancel ? (
                            <Pressable
                              onPress={() => setCancelTarget(s)}
                              style={styles.cancelBtn}>
                              <Text style={styles.cancelText}>{memberCancelLabel(status)}</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        </View>
                      ) : null}
                    </View>
                  </FadeIn>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => !busy && setRescheduleTarget(null)}
        transparent
        visible={!!rescheduleTarget}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.rescheduleModal, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Randevuyu Yeniden Planla</Text>
              <Pressable disabled={busy} onPress={() => setRescheduleTarget(null)}>
                <Text style={styles.modalClose}>Kapat</Text>
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              Mevcut randevu iptal edilip {rescheduleDays} gün sonrasına taşınacak. Kesin saat
              için Randevu Al kullanın.
            </Text>
            <Text style={[styles.modalBody, { marginTop: 8, opacity: 0.75 }]}>
              Randevu saatinden 24 saatten az kaldığında yeniden planlama yapılamaz.
            </Text>
            <Button
              label={busy ? 'İşleniyor…' : 'Onayla'}
              loading={busy}
              onPress={async () => {
                if (!rescheduleTarget?.id || busy) return;
                setBusy(true);
                const r = await rescheduleStaffSession(
                  tab,
                  rescheduleTarget.id,
                  undefined,
                  rescheduleDays,
                );
                setBusy(false);
                if (r.ok) setRescheduleTarget(null);
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => !busy && setCancelTarget(null)}
        transparent
        visible={!!cancelTarget}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.rescheduleModal, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {cancelTarget?.status === 'pending' ? 'Talebi İptal Et' : 'İptal Talebi Gönder'}
              </Text>
              <Pressable disabled={busy} onPress={() => setCancelTarget(null)}>
                <Text style={styles.modalClose}>Kapat</Text>
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              {cancelTarget?.status === 'pending'
                ? 'Onay bekleyen randevu talebiniz anında iptal edilecek.'
                : 'İptal talebiniz uzmanınıza iletilecek. Uzman onayladıktan sonra randevu iptal olur; reddedilirse görüşme planlandığı gibi devam eder.'}
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                label={
                  busy
                    ? 'İşleniyor…'
                    : cancelTarget?.status === 'pending'
                      ? 'Talebi İptal Et'
                      : 'Talebi Gönder'
                }
                loading={busy}
                onPress={async () => {
                  if (!cancelTarget?.id || busy) return;
                  setBusy(true);
                  const r = await cancelStaffSession(tab, cancelTarget.id);
                  setBusy(false);
                  if (r.ok) setCancelTarget(null);
                }}
              />
              <Button
                label="Vazgeç"
                onPress={() => setCancelTarget(null)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      <SessionBooker
        existingSessions={sessions}
        getBookedSlots={fetchBookedSlots}
        monthlyLimit={monthlyLimit}
        onBook={(iso, duration) => bookStaffSession(tab, iso, duration)}
        onClose={() => setBookOpen(false)}
        open={bookOpen}
        staff={staff}
        type={tab}
        usedThisMonth={usedThisMonth}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 148,
    justifyContent: 'flex-end',
    gap: 6,
  },
  heroBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -36,
    right: -20,
  },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  heroMeta: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  heroMetaText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.white,
    flexShrink: 1,
  },
  heroSwap: { gap: 6 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  tabOn: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconOn: { backgroundColor: colors.white },
  tabLabel: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  tabLabelOn: { color: colors.brand[700] },
  locked: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.cream[900],
    textAlign: 'center',
  },
  lockedDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quotaText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[800] },
  bookBtn: { minWidth: 140 },
  listFilters: { flexDirection: 'row', gap: 8 },
  listChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listChipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  listChipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  listChipTextOn: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flex: 1 },
  cardTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  cardWhen: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  cardStatus: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[600], marginTop: 4 },
  cardStaff: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600], marginTop: 2 },
  cardActions: { gap: spacing.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  joinHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  modifyBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  modifyText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[600] },
  cancelBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  cancelText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.danger[600] },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26,35,50,0.42)',
  },
  rescheduleModal: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.cream[900],
  },
  modalClose: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[600] },
  modalBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
  },
});
