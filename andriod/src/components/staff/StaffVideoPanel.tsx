import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { env } from '@/config/env';
import { canJoinSession, getSessionTiming } from '@/services/videoCallSession';
import { useIntervalWhileActive } from '@/utils/appActivity';
import { roleToSessionType, type StaffAppointment } from '@/utils/staffAppointments';
import { sessionsKey } from '@/utils/sessionBooking';
import { colors, fonts, radius, spacing } from '@/theme';

export function isVideoCallConfigured(): boolean {
  return Boolean(String(env.dailyDomain || '').trim());
}

type Props = {
  clients: Array<Record<string, unknown>>;
  role: string;
};

type VideoSession = StaffAppointment & {
  statusLabel?: string;
  isInJoinWindow: boolean;
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function sessionWhen(dateISO?: string) {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  const day = isToday(d) ? 'Bugün' : format(d, 'd MMM', { locale: tr });
  return `${day} ${format(d, 'HH:mm')}`;
}

/** Web StaffVideoPanel — RN list layout */
export function StaffVideoPanel({ clients, role }: Props) {
  const sessionType = roleToSessionType(role);
  const key = sessionsKey(sessionType);
  const configured = isVideoCallConfigured();
  // Tick so join-window labels stay fresh (was frozen in useMemo([]))
  const [now, setNow] = useState(() => new Date());
  useIntervalWhileActive(() => setNow(new Date()), 30_000, true, {
    requireFocus: true,
  });

  const sessions = useMemo(() => {
    const list: VideoSession[] = [];
    (clients || []).forEach((m) => {
      const arr = (m[key] as StaffAppointment[]) || [];
      arr.forEach((s) => {
        if ((s.status || 'scheduled') !== 'scheduled') return;
        const timing = getSessionTiming(s, sessionType, now);
        if (timing.isExpired) return;
        const join = canJoinSession(s, sessionType, now);
        list.push({
          ...s,
          memberId: String(m.id),
          memberName: String(m.name || 'Danışan'),
          statusLabel: join.statusLabel,
          isInJoinWindow: timing.isInJoinWindow,
        });
      });
    });
    return list.sort(
      (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime(),
    );
  }, [clients, key, now, sessionType]);

  const liveCount = sessions.filter((s) => s.isInJoinWindow).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.white} name="videocam" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Görüntülü Görüşme</Text>
          <Text style={styles.sub}>Danışanlarınızla canlı görüşmelere buradan katılın</Text>
        </View>
        {liveCount > 0 ? (
          <View style={styles.liveBadge}>
            <Ionicons color={colors.white} name="radio" size={12} />
            <Text style={styles.liveText}>{liveCount} görüşme aktif</Text>
          </View>
        ) : null}
      </View>

      {!configured ? (
        <View style={styles.warn}>
          <Ionicons color={colors.warm[500]} name="settings-outline" size={16} />
          <Text style={styles.warnText}>
            Video görüşme altyapısı henüz etkin değil. Yöneticiniz Daily domain ayarını tanımladığında
            “Görüşmeye Katıl” butonları çalışır hâle gelir.
          </Text>
        </View>
      ) : null}

      {sessions.length === 0 ? (
        <Text style={styles.empty}>
          Planlı görüntülü görüşme yok. Randevular eklendiğinde burada belirir.
        </Text>
      ) : (
        sessions.slice(0, 6).map((s) => {
          const join = canJoinSession(s, sessionType, now);
          const parts = [s.title, s.statusLabel || join.statusLabel].filter(Boolean);
          return (
            <View key={s.id} style={[styles.row, s.isInJoinWindow && styles.rowLive]}>
              <View style={[styles.avatar, s.isInJoinWindow && styles.avatarLive]}>
                <Text style={styles.avatarText}>{initials(s.memberName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.memberName}</Text>
                <Text style={styles.meta}>
                  {sessionWhen(s.date)}
                  {parts.length ? ` · ${parts.join(' · ')}` : ''}
                </Text>
              </View>
              {join.ok && configured ? (
                <Pressable
                  onPress={() =>
                    router.push(`/(staff)/call/${sessionType}/${s.id}` as Href)
                  }
                  style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.88 }]}>
                  <Text style={styles.joinText}>Katıl</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
  warn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.warm[50] || '#FFFBEB',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warm[200] || '#FDE68A',
  },
  warnText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.warm[500], lineHeight: 18 },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  rowLive: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLive: { backgroundColor: '#FEE2E2' },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[700] },
  name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  joinBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
});
