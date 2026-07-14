import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { canAccessCallRoom, canJoinSession } from '@/services/videoCallSession';
import {
  formatSessionWhen,
  getMemberSessions,
  sessionRoleLabel,
  type SessionTab,
} from '@/utils/memberSessions';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const TABS: { id: SessionTab; label: string }[] = [
  { id: 'coach', label: 'Koç' },
  { id: 'dietitian', label: 'Diyetisyen' },
  { id: 'doctor', label: 'Doktor' },
];

/** Sonraki 7 gün × sabah/öğleden sonra slotları (ISO). */
function buildCandidateSlots(days = 7): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let d = 1; d <= days; d += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    for (const hour of [10, 14, 16]) {
      const slot = new Date(day);
      slot.setHours(hour, 0, 0, 0);
      out.push(slot.toISOString());
    }
  }
  return out;
}

export default function ScheduleScreen() {
  const { member, staffDirectory, bookSession, cancelSession, getStaffBookedSlots } = useApp();
  const [tab, setTab] = useState<SessionTab>('coach');
  const [booking, setBooking] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const sessions = useMemo(() => getMemberSessions(member, tab), [member, tab]);

  const assignedStaffId = useMemo(() => {
    if (tab === 'coach') return (member?.assignedCoachId || member?.coachId) as string | undefined;
    if (tab === 'dietitian') return (member?.assignedDietitianId || member?.dietitianId) as string | undefined;
    return (member?.assignedDoctorId || member?.doctorId) as string | undefined;
  }, [member, tab]);

  const staffName = useMemo(() => {
    if (!assignedStaffId) return null;
    return staffDirectory.find((s) => s.id === assignedStaffId)?.name || null;
  }, [assignedStaffId, staffDirectory]);

  const loadSlots = async () => {
    if (!assignedStaffId) {
      Alert.alert('Personel yok', `${sessionRoleLabel(tab)} atanmamış. Destekten yardım isteyin.`);
      return;
    }
    setBooking(true);
    try {
      const candidates = buildCandidateSlots();
      const fromISO = candidates[0];
      const toISO = candidates[candidates.length - 1];
      const booked = await getStaffBookedSlots(assignedStaffId, tab, fromISO, toISO);
      const bookedSet = new Set(booked.map((b) => new Date(b).toISOString()));
      const free = candidates.filter((c) => !bookedSet.has(new Date(c).toISOString()));
      setAvailableSlots(free.slice(0, 12));
      setShowSlots(true);
    } finally {
      setBooking(false);
    }
  };

  const onBook = async (iso: string) => {
    setBooking(true);
    try {
      const result = await bookSession(tab, iso, 30);
      if (!result.success) {
        Alert.alert('Randevu alınamadı', result.error || 'Bir hata oluştu.');
        return;
      }
      Alert.alert('Randevu oluşturuldu', 'Seans listenize eklendi.');
      setShowSlots(false);
    } finally {
      setBooking(false);
    }
  };

  const onCancel = (id: string) => {
    Alert.alert('Randevuyu iptal et', 'Bu seansı iptal etmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: () => void cancelSession(id, tab),
      },
    ]);
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle="Koç, diyetisyen ve doktor seansları" title="Randevular" />

      <View style={styles.content}>
        <View style={styles.chips}>
          {TABS.map((t) => (
            <Chip
              active={t.id === tab}
              key={t.id}
              label={t.label}
              onPress={() => {
                setTab(t.id);
                setShowSlots(false);
              }}
            />
          ))}
        </View>

        {staffName ? (
          <Text style={styles.assigned}>Atanan: {staffName}</Text>
        ) : (
          <Text style={styles.assignedMuted}>Bu rol için atanan personel yok.</Text>
        )}

        <Button
          label="Yeni randevu al"
          loading={booking && !showSlots}
          onPress={() => void loadSlots()}
          rightIcon="calendar"
          variant="secondary"
        />

        {showSlots ? (
          <View style={styles.slotBox}>
            <Text style={styles.slotTitle}>Müsait saatler</Text>
            {availableSlots.length === 0 ? (
              <Text style={styles.assignedMuted}>Uygun slot bulunamadı.</Text>
            ) : (
              availableSlots.map((iso) => {
                const d = new Date(iso);
                const label = d.toLocaleString('tr-TR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <PressableScale
                    key={iso}
                    disabled={booking}
                    onPress={() => void onBook(iso)}
                    style={styles.slotRow}>
                    <Text style={styles.slotLabel}>{label}</Text>
                    <Ionicons color={colors.teal[600]} name="add-circle" size={22} />
                  </PressableScale>
                );
              })
            )}
          </View>
        ) : null}

        {sessions.length === 0 ? (
          <EmptyState
            subtitle={`${sessionRoleLabel(tab)} randevunuz olduğunda burada listelenir.`}
            title="Henüz randevu yok"
          />
        ) : (
          <View style={styles.list}>
            {sessions.map((session) => {
              const name = session.coachName || session.coach || sessionRoleLabel(tab);
              const roomAccess = canAccessCallRoom(session);
              const joinCheck = canJoinSession(session);
              return (
                <View key={session.id || `${tab}-${session.date}-${session.time}`} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Ionicons color={colors.teal[600]} name="person" size={20} />
                    </View>
                    <View style={styles.meta}>
                      <Text style={styles.role}>{sessionRoleLabel(tab)}</Text>
                      <Text style={styles.name}>{name}</Text>
                      <Text style={styles.when}>{formatSessionWhen(session)}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{session.status || '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    {session.status === 'scheduled' ? (
                      <>
                        <Button
                          disabled={!roomAccess.ok}
                          fullWidth={false}
                          label={joinCheck.ok ? 'Katıl' : 'Oda'}
                          onPress={() => router.push(`/call/${tab}/${session.id}` as Href)}
                          rightIcon="arrow-forward"
                          size="sm"
                          style={styles.actionBtn}
                          variant="secondary"
                        />
                        {session.id ? (
                          <Button
                            fullWidth={false}
                            label="İptal"
                            onPress={() => onCancel(session.id!)}
                            size="sm"
                            style={styles.actionBtn}
                            variant="ghost"
                          />
                        ) : null}
                      </>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <PressableScale onPress={() => router.push('/calendar' as Href)} style={styles.calendarLink}>
          <Ionicons color={colors.teal[600]} name="calendar-outline" size={18} />
          <Text style={styles.calendarLinkText}>Takvim görünümü</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  assigned: { fontFamily: fonts.medium, fontSize: 13, color: colors.teal[700] },
  assignedMuted: { fontFamily: fonts.regular, fontSize: 13, color: colors.text.muted },
  slotBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTitle: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.text.primary },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  slotLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.primary },
  list: { gap: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal[50],
  },
  meta: { flex: 1 },
  role: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.secondary },
  name: { fontFamily: fonts.displaySemibold, fontSize: 16, color: colors.text.primary, marginTop: 2 },
  when: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13.5, color: colors.text.secondary },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionBtn: { minWidth: 100 },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  calendarLinkText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.teal[600] },
});
