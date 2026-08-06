import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { fetchAdminSessionSummaries } from '@/services/adminDb';
import { colors, fonts, radius, spacing } from '@/theme';

const KIND_BAR: Record<string, string> = {
  Koç: colors.brand[400],
  Diyetisyen: colors.sage[400],
  Doktor: colors.gold[400],
};

/** LOCK: docs/mobile/screens/admin/sessions.md */
export default function AdminSessions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<
    { memberId: string; memberName: string; sessionType: string; startsAt?: string }[]
  >([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const list = await fetchAdminSessionSummaries();
      if (!alive) return;
      const upcoming = list
        .filter((s) => s.startsAt && new Date(s.startsAt).getTime() >= Date.now() - 3600000)
        .sort(
          (a, b) =>
            new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime(),
        )
        .slice(0, 40);
      setRows(upcoming);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PanelScaffold showBack subtitle="Yaklaşan randevular" title="Seanslar">
      {loading ? (
        <InlineSpinner fill />
      ) : rows.length === 0 ? (
        <EmptyState title="Yaklaşan seans yok." />
      ) : (
        rows.map((r, i) => {
          const when = r.startsAt
            ? new Date(r.startsAt).toLocaleString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—';
          return (
            <FadeIn delay={i * 40} key={`${r.memberId}-${r.sessionType}-${r.startsAt}-${i}`}>
              <View style={styles.card}>
                <View
                  style={[
                    styles.kindBar,
                    { backgroundColor: KIND_BAR[r.sessionType] || colors.cream[300] },
                  ]}
                />
                <View style={styles.body}>
                  <View style={styles.topRow}>
                    <Text style={styles.title}>{r.sessionType} Görüşmesi</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Planlandı</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{r.memberName}</Text>
                  <Text style={styles.when}>{when}</Text>
                </View>
              </View>
            </FadeIn>
          );
        })
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  kindBar: { width: 3 },
  body: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  badge: {
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  when: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600], marginTop: 4 },
});
