import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  fetchAllTickets,
  sendTicketReply,
  setTicketStatus,
  type SupportTicket,
} from '@/services/db/support';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminSupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyTarget, setReplyTarget] = useState<SupportTicket | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setTickets(await fetchAllTickets());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanelScreen
      emptySubtitle="Açık destek talepleri burada görünür."
      emptyTitle="Destek talebi yok"
      subtitle={`${tickets.length} talep`}
      title="Destek">
      {tickets.length > 0
        ? tickets.map((t) => (
            <Card key={t.id} padding={spacing.md} style={styles.card}>
              <Text style={styles.subject}>{t.subject}</Text>
              <Text style={styles.meta}>
                {t.memberName} · {t.status} · {t.category}
              </Text>
              <Text style={styles.msg} numberOfLines={2}>
                {t.messages[t.messages.length - 1]?.text || '—'}
              </Text>
              <View style={styles.row}>
                <Button
                  label="Yanıtla"
                  onPress={() => setReplyTarget(t)}
                  size="sm"
                  style={styles.flex}
                />
                <Button
                  label="Kapat"
                  onPress={() => {
                    void (async () => {
                      const r = await setTicketStatus(t.id, 'closed');
                      if (!r.success) Alert.alert('Hata', r.error);
                      else await load();
                    })();
                  }}
                  size="sm"
                  style={styles.flex}
                  variant="secondary"
                />
              </View>
            </Card>
          ))
        : null}

      {replyTarget ? (
        <AdminFormModal
          fields={[{ key: 'text', label: 'Yanıt', multiline: true }]}
          loading={saving}
          onClose={() => setReplyTarget(null)}
          onSubmit={async (values) => {
            const text = values.text?.trim();
            if (!text) {
              Alert.alert('Eksik bilgi', 'Yanıt metni gerekli.');
              return;
            }
            setSaving(true);
            try {
              const r = await sendTicketReply(replyTarget.id, 'admin', text);
              if (!r.success) Alert.alert('Hata', r.error);
              else {
                setReplyTarget(null);
                await load();
              }
            } finally {
              setSaving(false);
            }
          }}
          submitLabel="Gönder"
          title={`Yanıt: ${replyTarget.subject}`}
          visible
        />
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  subject: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: 4 },
  msg: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
