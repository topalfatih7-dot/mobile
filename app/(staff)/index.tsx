import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
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

/** KPI value entrance — scale 0.96→1 (~220ms) */
function KpiValueIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const scale = useSharedValue(0.96);
  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 220 }));
  }, [delay, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

const SESSION_SLOTS = [
  { day: 'Yarın', time: '10:00', duration: '30 dk' },
  { day: 'Perş', time: '14:00', duration: '30 dk' },
  { day: 'Cum', time: '11:00', duration: '30 dk' },
];

/** LOCK: docs/mobile/screens/staff/overview.md */
export default function StaffOverview() {
  const { staff, logout } = useAuth();
  const { loading, staffClients } = useData();
  const role = String(staff?.role || 'coach');
  const name = String(staff?.name || 'Personel');
  const clients = staffClients;

  const sessions =
    role === 'doctor'
      ? []
      : clients.slice(0, SESSION_SLOTS.length).map((c, i) => ({
          id: String(c.id),
          name: String(c.name),
          ...SESSION_SLOTS[i],
        }));

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
              <Text style={styles.kpiVal}>{sessions.length}</Text>
            </KpiValueIn>
            <Text style={styles.kpiLabel}>Yaklaşan seans</Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yaklaşan görüşme</Text>
          {sessions.length === 0 ? (
            <Text style={styles.emptyRow}>Yaklaşan görüşme yok</Text>
          ) : (
            sessions.map((s, i) => (
              <FadeIn key={s.id} delay={110 + i * 30}>
                <View style={styles.sessionRow}>
                  <View style={styles.sessionAvatar}>
                    <Text style={styles.sessionAvatarText}>{initials(s.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionName}>{s.name}</Text>
                    <Text style={styles.sessionMeta}>
                      {s.day} {s.time} · {s.duration}
                    </Text>
                  </View>
                  {i > 0 ? (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{s.time}</Text>
                    </View>
                  ) : null}
                </View>
                {i === 0 ? (
                  <Button
                    label="Görüşmeye katıl"
                    onPress={() =>
                      router.push('/(staff)/call/coach/ui-sess-coach-1' as Href)
                    }
                    size="md"
                    style={{ marginTop: 10 }}
                  />
                ) : null}
              </FadeIn>
            ))
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
          onPress={() => router.push('/(staff)/messages/admin/ui-admin-1' as Href)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
          <Ionicons color={colors.brand[600]} name="shield" size={18} />
          <Text style={styles.linkText}>Admin mesajları</Text>
          <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} style={styles.chevron} />
        </Pressable>
        {(role === 'coach' || role === 'dietitian') && (
          <Pressable
            onPress={() => router.push('/(staff)/messages/collab/ui-collab-1' as Href)}
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
  cardTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  emptyRow: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], marginTop: 10 },
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
