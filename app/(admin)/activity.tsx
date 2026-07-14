import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Card } from '@/components/ui/Card';
import { fetchActivities, type ActivityItem } from '@/services/db/activities';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminActivityScreen() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  const load = useCallback(async () => {
    setItems(await fetchActivities());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanelScreen
      emptySubtitle="Sistem aktivite günlüğü burada listelenir."
      emptyTitle="Aktivite yok"
      subtitle={`${items.length} kayıt`}
      title="Aktivite">
      {items.length > 0
        ? items.map((a) => (
            <Card key={a.id} padding={spacing.md} style={styles.card}>
              <Text style={styles.type}>{a.type}</Text>
              <Text style={styles.text}>{a.text}</Text>
              <Text style={styles.meta}>
                {a.createdAt
                  ? new Date(a.createdAt).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
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
    color: colors.teal[600],
    textTransform: 'uppercase',
  },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.primary, marginTop: 4, lineHeight: 20 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: spacing.sm },
});
