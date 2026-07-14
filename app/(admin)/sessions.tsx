import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Card } from '@/components/ui/Card';
import { fetchAdminSessionSummaries, type AdminSessionSummary } from '@/services/db/sessions';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminSessionsScreen() {
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);

  const load = useCallback(async () => {
    const list = await fetchAdminSessionSummaries();
    list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    setSessions(list.slice(0, 100));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanelScreen
      emptySubtitle="Planlanan ve tamamlanan seanslar burada listelenir."
      emptyTitle="Seans yok"
      subtitle={`${sessions.length} seans`}
      title="Seanslar">
      {sessions.length > 0
        ? sessions.map((s, i) => (
            <Card key={`${s.id || i}-${s.date}`} padding={spacing.md} style={styles.card}>
              <Text style={styles.type}>{s.sessionType}</Text>
              <Text style={styles.name}>{s.memberName}</Text>
              <Text style={styles.meta}>
                {s.date
                  ? new Date(s.date).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
                {s.status ? ` · ${s.status}` : ''}
              </Text>
            </Card>
          ))
        : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  type: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.champagne[600],
    textTransform: 'uppercase',
  },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary, marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text.muted, marginTop: 4 },
});
