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
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useActions } from '@/context/ActionsContext';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
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
  const { staff, logout } = useAuth();
  const { loading, staffClients } = useData();
  const { respondBookSession, respondCancelSession, cancelStaffSession } = useActions();
  const role = String(staff?.role || 'coach');
  const sessionType = roleToSessionType(role);
  const name = String(staff?.name || 'Personel');
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

  return (
    <PanelScaffold
      subtitle={`${name} · ${role === 'dietitian' ? 'Diyetisyen' : role === 'doctor' ? 'Doktor' : 'Koç'}`}
      title="Genel Bakış">
      {loading && clients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
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
              </View>
              <View style={styles.kpi}>
                <View style={[styles.kpiIcon, { backgroundColor: colors.brand[100] }]}>
                  <Ionicons color={colors.brand[600]} name="videocam" size={17} />
                </View>
                <KpiValueIn delay={70}>
                  <Text style={styles.kpiVal}>{appointments.length}</Text>
                </KpiValueIn>
                <Text style={styles.kpiLabel}>Yaklaşan seans</Text>
              </View>
            </View>
          </FadeIn>

          {pendingAppointments.length > 0 ? (
            <FadeIn delay={60}>
              <View style={[styles.card, styles.pendingCard]}>
                <Text style={styles.cardTitle}>Onay bekleyen talepler</Text>
                {pendingAppointments.slice(0, 8).map((a) => (
                  <View key={a.id} style={styles.queueBlock}>
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionAvatar}>
                        <Text style={styles.sessionAvatarText}>{initials(a.memberName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{a.memberName}</Text>
                        <Text style={styles.sessionMeta}>
                          {sessionWhen(a.date)} · onay bekliyor
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
            <FadeIn delay={70}>
              <View style={[styles.card, styles.cancelCard]}>
                <Text style={styles.cardTitle}>İptal talepleri</Text>
                {cancelPending.slice(0, 8).map((a) => (
                  <View key={`c-${a.id}`} style={styles.queueBlock}>
                    <View style={styles.sessionRow}>
                      <View style={[styles.sessionAvatar, { backgroundColor: colors.warm[500] }]}>
                        <Text style={styles.sessionAvatarText}>{initials(a.memberName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{a.memberName}</Text>
                        <Text style={styles.sessionMeta}>
                          {sessionWhen(a.date)} · iptal onayı bekliyor
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

          <FadeIn delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Yaklaşan görüşme</Text>
              {appointments.length === 0 ? (
                <Text style={styles.emptyRow}>Yaklaşan görüşme yok</Text>
              ) : (
                appointments.slice(0, 8).map((a, i) => {
                  const needsAdmin = isWithinCancelNoticeWindow(a);
                  const canCancel = ['scheduled', 'rescheduled', 'cancel_pending'].includes(
                    a.status || 'scheduled',
                  );
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
                                : ''}
                          </Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Text style={styles.timeBadgeText}>
                            {a.date ? format(new Date(a.date), 'HH:mm') : '—'}
                          </Text>
                        </View>
                      </View>
                      {i === 0 && a.status === 'scheduled' ? (
                        <Button
                          label="Görüşmeye katıl"
                          onPress={() =>
                            router.push(
                              `/(staff)/call/${sessionType}/${a.id}` as Href,
                            )
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

          <FadeIn delay={120}>
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
            {(role === 'coach' || role === 'dietitian') && (
              <Pressable
                onPress={() => router.push('/(staff)/messages/collab' as Href)}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <Ionicons color={colors.brand[600]} name="git-network" size={18} />
                <Text style={styles.linkText}>Ekip (collab)</Text>
                <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
              </Pressable>
            )}
          </FadeIn>

          <View style={styles.divider} />
          <Button
            label="Çıkış Yap"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            variant="ghost"
          />
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiVal: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.brand[700],
    alignSelf: 'flex-start',
  },
  kpiLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  pendingCard: { borderColor: colors.warm[200] || colors.cream[200], backgroundColor: colors.warm[50] || colors.cream[50] },
  cancelCard: { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' },
  cardTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
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
  divider: {
    height: 1,
    backgroundColor: colors.cream[200],
    marginTop: spacing.sm,
  },
});
