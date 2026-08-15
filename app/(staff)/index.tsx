import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { StaffVideoPanel } from '@/components/staff/StaffVideoPanel';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useActions } from '@/context/ActionsContext';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { canJoinSession } from '@/services/videoCallSession';
import { AVAILABILITY_WEEKDAYS } from '@/utils/memberAvailability';
import { isWithinCancelNoticeWindow } from '@/utils/sessionCancelRules';
import {
  getStaffAppointments,
  getStaffCancelPendingAppointments,
  getStaffPendingAppointments,
  roleToSessionType,
  type StaffAppointment,
} from '@/utils/staffAppointments';
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

function resolveFirstName(staff: Record<string, unknown> | null | undefined, role: string) {
  const name = String(staff?.name || '').trim();
  if (name) return name.split(/\s+/)[0];
  const email = String(staff?.email || '').split('@')[0];
  if (email) return email;
  if (role === 'dietitian') return 'Diyetisyen';
  if (role === 'doctor') return 'Doktor';
  return 'Koç';
}

function panelTitleForRole(role: string) {
  if (role === 'dietitian') return 'Diyetisyen paneli';
  if (role === 'doctor') return 'Doktor paneli';
  return 'Koç paneli';
}

function roleIcon(role: string): keyof typeof Ionicons.glyphMap {
  if (role === 'dietitian') return 'nutrition-outline';
  if (role === 'doctor') return 'medkit-outline';
  return 'barbell-outline';
}

function workSubtitle(staff: Record<string, unknown> | null | undefined) {
  const workDays = (staff?.workDays as number[]) || [];
  const start = String(staff?.workStart || '').trim();
  const end = String(staff?.workEnd || '').trim();
  if (!workDays.length) return '';
  const days = workDays
    .map((d) => AVAILABILITY_WEEKDAYS.find((w) => w.value === Number(d))?.label)
    .filter(Boolean)
    .join(', ');
  if (!days) return '';
  if (start && end) return ` · ${days} · ${start}–${end}`;
  return ` · ${days}`;
}

function KpiValueIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const scale = useSharedValue(0.96);
  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 220 }));
  }, [delay, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

function sessionWhen(dateISO?: string) {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  const day = isToday(d) ? 'Bugün' : format(d, 'd MMM', { locale: tr });
  return `${day} ${format(d, 'HH:mm')}`;
}

/** LOCK: docs/mobile/screens/staff/overview.md — web StaffOverviewPage parity */
export default function StaffOverview() {
  const { staff } = useAuth();
  const { loading, staffClients, platform } = useData();
  const { respondBookSession, respondCancelSession, cancelStaffSession } = useActions();
  const role = String(staff?.role || 'coach');
  const sessionType = roleToSessionType(role);
  const isCoach = role === 'coach';
  const firstName = resolveFirstName(staff, role);
  const clients = staffClients;
  const [busyId, setBusyId] = useState<string | null>(null);

  const appointments = useMemo(
    () => getStaffAppointments(clients as never, role),
    [clients, role],
  );
  const pendingAppointments = useMemo(
    () => getStaffPendingAppointments(clients as never, role),
    [clients, role],
  );
  const cancelPending = useMemo(
    () => getStaffCancelPendingAppointments(clients as never, role),
    [clients, role],
  );

  const myPrograms = useMemo(() => {
    const staffId = String(staff?.id || '');
    return ((platform.programs || []) as { staffId?: string }[]).filter(
      (p) => String(p.staffId || '') === staffId,
    );
  }, [platform.programs, staff?.id]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const key =
      role === 'dietitian'
        ? 'dietitianSessions'
        : role === 'doctor'
          ? 'doctorSessions'
          : 'coachSessions';
    return clients.reduce((sum, m) => {
      const sessions = ((m as Record<string, unknown>)[key] as { date?: string; status?: string }[]) || [];
      return (
        sum +
        sessions.filter((s) => {
          const d = new Date(String(s.date || ''));
          const st = s.status || 'scheduled';
          return (
            ['scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending'].includes(st) &&
            d >= now &&
            d <= weekEnd
          );
        }).length
      );
    }, 0);
  }, [clients, role]);

  const handleBookRespond = useCallback(
    async (a: StaffAppointment, decision: 'approve' | 'reject') => {
      setBusyId(a.id);
      await respondBookSession({
        memberId: a.memberId,
        sessionId: a.id,
        sessionType,
        decision,
      });
      setBusyId(null);
    },
    [respondBookSession, sessionType],
  );

  const handleCancelRespond = useCallback(
    async (a: StaffAppointment, decision: 'approve' | 'reject') => {
      setBusyId(a.id);
      await respondCancelSession({
        memberId: a.memberId,
        sessionId: a.id,
        sessionType,
        decision,
      });
      setBusyId(null);
    },
    [respondCancelSession, sessionType],
  );

  const handleStaffCancel = useCallback(
    async (a: StaffAppointment) => {
      setBusyId(a.id);
      await cancelStaffSession(sessionType, a.id, { memberId: a.memberId });
      setBusyId(null);
    },
    [cancelStaffSession, sessionType],
  );

  const subtitle = `${panelTitleForRole(role)}${workSubtitle(staff)}`;

  return (
    <PanelScaffold subtitle={subtitle} title={`Merhaba, ${firstName}`}>
      {loading && clients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
          <FadeIn delay={20}>
            <View style={styles.roleRow}>
              <Ionicons color={colors.cream[800]} name={roleIcon(role)} size={16} />
              <Text style={styles.roleText}>{panelTitleForRole(role)}</Text>
            </View>
          </FadeIn>

          <FadeIn delay={40}>
            <View style={styles.kpiRow}>
              <View style={styles.kpi}>
                <View style={[styles.kpiIcon, { backgroundColor: colors.sage[100] }]}>
                  <Ionicons color={colors.sage[600]} name="people" size={17} />
                </View>
                <KpiValueIn delay={40}>
                  <Text style={styles.kpiVal}>{clients.length}</Text>
                </KpiValueIn>
                <Text style={styles.kpiLabel}>Danışan</Text>
                <Text style={styles.kpiSub}>Aktif ücretli üye</Text>
              </View>
              <View style={styles.kpi}>
                <View style={[styles.kpiIcon, { backgroundColor: colors.brand[100] }]}>
                  <Ionicons color={colors.brand[600]} name="calendar" size={17} />
                </View>
                <KpiValueIn delay={70}>
                  <Text style={styles.kpiVal}>{thisWeekCount}</Text>
                </KpiValueIn>
                <Text style={styles.kpiLabel}>Bu Hafta Randevu</Text>
                <Text style={styles.kpiSub}>Planlanan görüşme</Text>
              </View>
              <View style={styles.kpi}>
                <View style={[styles.kpiIcon, { backgroundColor: colors.cream[100] }]}>
                  <Ionicons color={colors.gold[500]} name="clipboard" size={17} />
                </View>
                <KpiValueIn delay={100}>
                  <Text style={styles.kpiVal}>{myPrograms.length}</Text>
                </KpiValueIn>
                <Text style={styles.kpiLabel}>Oluşturulan Program</Text>
                <Text style={styles.kpiSub}>{isCoach ? 'Antrenman programı' : 'Toplam'}</Text>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={55}>
            <Button
              label={isCoach ? 'Program Oluştur' : 'Danışanlarım'}
              onPress={() => router.push('/(staff)/clients' as Href)}
              size="md"
            />
          </FadeIn>

          <FadeIn delay={70}>
            <StaffVideoPanel clients={clients as never} role={role} />
          </FadeIn>

          {pendingAppointments.length > 0 ? (
            <FadeIn delay={80}>
              <View style={[styles.card, styles.pendingCard]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>Onay bekleyen talepler</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{pendingAppointments.length}</Text>
                  </View>
                </View>
                {pendingAppointments.slice(0, 8).map((a) => (
                  <View key={a.id} style={styles.queueBlock}>
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionAvatar}>
                        <Text style={styles.sessionAvatarText}>{initials(a.memberName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{a.memberName}</Text>
                        <Text style={styles.sessionMeta}>
                          {sessionWhen(a.date)} · {a.title || 'Randevu talebi'} · onay bekliyor
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <Button
                        disabled={busyId === a.id}
                        label="Onayla"
                        onPress={() => handleBookRespond(a, 'approve')}
                        size="md"
                        style={{ flex: 1 }}
                      />
                      <Button
                        disabled={busyId === a.id}
                        label="Reddet"
                        onPress={() => handleBookRespond(a, 'reject')}
                        size="md"
                        style={{ flex: 1 }}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </FadeIn>
          ) : null}

          {cancelPending.length > 0 ? (
            <FadeIn delay={90}>
              <View style={[styles.card, styles.cancelCard]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>İptal talepleri</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={[styles.countBadgeText, { color: '#9A3412' }]}>
                      {cancelPending.length}
                    </Text>
                  </View>
                </View>
                {cancelPending.slice(0, 8).map((a) => (
                  <View key={`c-${a.id}`} style={styles.queueBlock}>
                    <View style={styles.sessionRow}>
                      <View style={[styles.sessionAvatar, { backgroundColor: colors.warm[500] }]}>
                        <Text style={styles.sessionAvatarText}>{initials(a.memberName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{a.memberName}</Text>
                        <Text style={styles.sessionMeta}>
                          {sessionWhen(a.date)} · {a.title || 'Randevu'} · iptal onayı bekliyor
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <Button
                        disabled={busyId === a.id}
                        label="İptali Onayla"
                        onPress={() => handleCancelRespond(a, 'approve')}
                        size="md"
                        style={{ flex: 1 }}
                      />
                      <Button
                        disabled={busyId === a.id}
                        label="Reddet"
                        onPress={() => handleCancelRespond(a, 'reject')}
                        size="md"
                        style={{ flex: 1 }}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </FadeIn>
          ) : null}

          <FadeIn delay={100}>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Yaklaşan Randevular</Text>
                <Pressable onPress={() => router.push('/(staff)/clients' as Href)}>
                  <Text style={styles.linkMini}>Danışanlar →</Text>
                </Pressable>
              </View>
              {appointments.length === 0 ? (
                <Text style={styles.emptyRow}>Yaklaşan randevu yok</Text>
              ) : (
                appointments.slice(0, 8).map((a, i) => {
                  const needsAdmin = isWithinCancelNoticeWindow(a);
                  const canCancel = ['scheduled', 'rescheduled', 'cancel_pending'].includes(
                    a.status || 'scheduled',
                  );
                  const join = canJoinSession(a, sessionType);
                  return (
                    <FadeIn key={a.id} delay={110 + i * 30}>
                      <View style={styles.sessionRow}>
                        <View style={styles.sessionAvatar}>
                          <Text style={styles.sessionAvatarText}>{initials(a.memberName)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionName}>{a.memberName}</Text>
                          <Text style={styles.sessionMeta}>
                            {sessionWhen(a.date)}
                            {a.status === 'admin_cancel_pending'
                              ? ' · yönetim iptal onayı'
                              : a.status === 'cancel_pending'
                                ? ' · iptal onayı bekliyor'
                                : a.title
                                  ? ` · ${a.title}`
                                  : ''}
                            {join.statusLabel ? ` · ${join.statusLabel}` : ''}
                          </Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Text style={styles.timeBadgeText}>
                            {a.date ? format(new Date(a.date), 'HH:mm') : '—'}
                          </Text>
                        </View>
                      </View>
                      {join.ok && (a.status || 'scheduled') === 'scheduled' ? (
                        <Button
                          label="Görüşmeye katıl"
                          onPress={() =>
                            router.push(`/(staff)/call/${sessionType}/${a.id}` as Href)
                          }
                          size="md"
                          style={{ marginTop: 10 }}
                        />
                      ) : null}
                      {canCancel && a.status !== 'admin_cancel_pending' ? (
                        <Pressable
                          disabled={busyId === a.id}
                          onPress={() => handleStaffCancel(a)}
                          style={styles.cancelLink}>
                          <Text style={styles.cancelLinkText}>
                            {needsAdmin ? 'İptal (yönetim onayı)' : 'İptal Et'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </FadeIn>
                  );
                })
              )}
            </View>
          </FadeIn>

          {clients.length === 0 ? (
            <FadeIn delay={120}>
              <EmptyState
                description="Premium üyeler kayıt oldukça ve paketlerinde destek seçtikçe burada görünecekler."
                icon="people-outline"
                title="Henüz danışan yok"
              />
            </FadeIn>
          ) : null}

          <FadeIn delay={130}>
            <Pressable
              onPress={() => router.push('/(staff)/clients' as Href)}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
              <Ionicons color={colors.brand[600]} name="people" size={18} />
              <Text style={styles.linkText}>Danışanlara git</Text>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(staff)/payments' as Href)}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
              <Ionicons color={colors.brand[600]} name="card" size={18} />
              <Text style={styles.linkText}>Ödemeler</Text>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(staff)/messages/admin' as Href)}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
              <Ionicons color={colors.brand[600]} name="shield" size={18} />
              <Text style={styles.linkText}>Admin mesajları</Text>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(staff)/messages/collab' as Href)}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
              <Ionicons color={colors.brand[600]} name="git-network" size={18} />
              <Text style={styles.linkText}>Ekip mesajları</Text>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
            </Pressable>
          </FadeIn>
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  roleText: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiVal: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.brand[700],
    alignSelf: 'flex-start',
  },
  kpiLabel: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.cream[900], marginTop: 2 },
  kpiSub: { fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800], marginTop: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pendingCard: {
    borderColor: colors.warm[200] || colors.cream[200],
    backgroundColor: colors.warm[50] || colors.cream[50],
  },
  cancelCard: { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' },
  cardTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  countBadge: {
    backgroundColor: colors.warm[100] || colors.cream[100],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.warm[500] },
  linkMini: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[600] },
  emptyRow: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], marginTop: 10 },
  queueBlock: { marginTop: 12, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  sessionAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.white },
  sessionName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  sessionMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 1 },
  timeBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeBadgeText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[700] },
  cancelLink: { marginTop: 8, paddingVertical: 6 },
  cancelLinkText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.warm[500] },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  linkRowPressed: { backgroundColor: colors.cream[100] },
  linkText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  chevron: { marginLeft: 'auto' },
});
