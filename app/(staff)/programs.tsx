import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { colors, fonts, radius, spacing } from '@/theme';

type ProgramCard = {
  id: string;
  title: string;
  memberId: string;
  memberName: string;
  status: 'active' | 'expired';
  summary: string;
};

/** LOCK: docs/mobile/screens/staff/programs.md */
export default function StaffPrograms() {
  const { staff } = useAuth();
  const { loading, programs, staffClients } = useData();

  const cards = useMemo(() => {
    const nameById = new Map(
      staffClients.map((c) => [String(c.id), String(c.name || 'Danışan')]),
    );
    const clientIds = new Set(staffClients.map((c) => String(c.id)));
    const staffId = staff?.id ? String(staff.id) : null;

    return programs
      .filter((p) => {
        if (String(p.type || '') !== 'workout') return false;
        const mid = String(p.memberId || '');
        if (clientIds.has(mid)) return true;
        if (staffId && String((p as { staffId?: string }).staffId || '') === staffId) return true;
        return false;
      })
      .map((p): ProgramCard => {
        const entries = Array.isArray(p.entries) ? p.entries : [];
        return {
          id: String(p.id),
          title: String(p.title || 'Antrenman'),
          memberId: String(p.memberId || ''),
          memberName: nameById.get(String(p.memberId || '')) || 'Danışan',
          status: 'active',
          summary: `14 günlük döngü · ${entries.length} hareket · her gün`,
        };
      });
  }, [programs, staffClients, staff?.id]);

  return (
    <PanelScaffold subtitle="Gönderilen antrenman programları" title="Programlar">
      {loading && cards.length === 0 ? (
        <InlineSpinner fill />
      ) : cards.length === 0 ? (
        <EmptyState
          description="Danışan seçip oluşturduğunuzda burada görünür."
          title="Henüz program yok"
        />
      ) : (
        cards.map((p, i) => (
          <FadeIn key={p.id} delay={40 + i * 30}>
            <Pressable
              onPress={() =>
                router.push(`/(staff)/clients/${p.memberId}/program` as Href)
              }
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}>
              <View style={styles.strip} />
              <View style={styles.body}>
                <Text style={styles.title}>{p.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.member}>{p.memberName}</Text>
                  <View
                    style={[
                      styles.badge,
                      p.status === 'active' ? styles.badgeActive : styles.badgeExpired,
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        p.status === 'active'
                          ? styles.badgeTextActive
                          : styles.badgeTextExpired,
                      ]}>
                      {p.status === 'active' ? 'Aktif' : 'Süresi doldu'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.summary}>{p.summary}</Text>
              </View>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
            </Pressable>
          </FadeIn>
        ))
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cardPressed: { backgroundColor: colors.cream[50], transform: [{ scale: 0.98 }] },
  strip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.brand[400],
  },
  body: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  member: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeActive: { backgroundColor: colors.sage[100] },
  badgeExpired: { backgroundColor: colors.cream[100] },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  badgeTextActive: { color: colors.sage[700] },
  badgeTextExpired: { color: colors.cream[800] },
  summary: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.8 },
});
