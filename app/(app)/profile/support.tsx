import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import {
  createSupportTicket,
  fetchMemberTickets,
  sendSupportTicketReply,
  type SupportTicket,
} from '@/services/db/support';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const STATUS_LABELS: Record<string, string> = {
  open: 'Bekliyor',
  'in-progress': 'İşlemde',
  closed: 'Çözüldü',
};

export default function SupportScreen() {
  const { member } = useApp();
  const { horizontalPadding } = useResponsive();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!member?.id) return;
    setLoading(true);
    try {
      setTickets(await fetchMemberTickets(member.id));
    } finally {
      setLoading(false);
    }
  }, [member?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeTicket = tickets.find((t) => t.id === activeId) || null;

  const onCreate = async () => {
    if (!member) return;
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Eksik bilgi', 'Konu ve mesaj alanlarını doldurun.');
      return;
    }
    setBusy(true);
    try {
      const result = await createSupportTicket(member, { subject, message });
      if (!result.success) {
        Alert.alert('Hata', result.error);
        return;
      }
      setSubject('');
      setMessage('');
      setActiveId(result.ticket.id);
      await load();
      Alert.alert('Talep alındı', 'Destek ekibimiz en kısa sürede yanıtlayacak.');
    } finally {
      setBusy(false);
    }
  };

  const onReply = async () => {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    try {
      const result = await sendSupportTicketReply(activeId, 'member', reply);
      if (!result.success) {
        Alert.alert('Hata', result.error);
        return;
      }
      setReply('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Sorularınız ve talepleriniz" title="Yardım & Destek" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {loading ? (
            <ActivityIndicator color={colors.brand[600]} style={{ marginTop: spacing.xl }} />
          ) : tickets.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Taleplerim</Text>
              {tickets.map((ticket) => (
                <Pressable key={ticket.id} onPress={() => setActiveId(ticket.id)}>
                  <Card padding={spacing.md} style={[styles.ticket, activeId === ticket.id && styles.ticketActive]}>
                    <View style={styles.ticketTop}>
                      <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                      <Text style={styles.ticketStatus}>{STATUS_LABELS[ticket.status] || ticket.status}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.ticketPreview}>
                      {ticket.messages[ticket.messages.length - 1]?.text || '—'}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </>
          ) : (
            <EmptyState
              subtitle="İlk destek talebinizi aşağıdaki formdan oluşturabilirsiniz."
              title="Henüz destek talebi yok"
            />
          )}

          {activeTicket ? (
            <View style={styles.thread}>
              <Text style={styles.sectionTitle}>Mesajlar</Text>
              {activeTicket.messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.msg, msg.from === 'member' ? styles.msgMine : styles.msgAdmin]}>
                  <Text style={styles.msgFrom}>{msg.from === 'member' ? 'Siz' : 'Destek'}</Text>
                  <Text style={styles.msgText}>{msg.text}</Text>
                </View>
              ))}
              {activeTicket.status !== 'closed' ? (
                <View style={styles.replyBox}>
                  <TextInput
                    multiline
                    onChangeText={setReply}
                    placeholder="Yanıt yazın…"
                    placeholderTextColor={colors.text.muted}
                    style={styles.replyInput}
                    value={reply}
                  />
                  <Pressable disabled={busy} onPress={() => void onReply()} style={styles.replyBtn}>
                    <Ionicons color={colors.white} name="send" size={18} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Yeni talep</Text>
          <Card padding={spacing.md}>
            <Text style={styles.label}>Konu</Text>
            <TextInput
              onChangeText={setSubject}
              placeholder="Örn. Üyelik sorusu"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              value={subject}
            />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Mesaj</Text>
            <TextInput
              multiline
              onChangeText={setMessage}
              placeholder="Sorununuzu kısaca anlatın…"
              placeholderTextColor={colors.text.muted}
              style={[styles.input, styles.textarea]}
              value={message}
            />
            <Pressable disabled={busy} onPress={() => void onCreate()} style={styles.submit}>
              <Text style={styles.submitText}>{busy ? 'Gönderiliyor…' : 'Talep Oluştur'}</Text>
            </Pressable>
          </Card>
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  ticket: { marginBottom: spacing.sm },
  ticketActive: { borderColor: colors.brand[300], borderWidth: 1 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  ticketSubject: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  ticketStatus: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand[700] },
  ticketPreview: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13, color: colors.text.secondary },
  thread: { marginTop: spacing.md },
  msg: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  msgMine: { backgroundColor: colors.brand[50], alignSelf: 'flex-end', maxWidth: '90%' },
  msgAdmin: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, maxWidth: '90%' },
  msgFrom: { fontFamily: fonts.bold, fontSize: 11, color: colors.text.muted, marginBottom: 4 },
  msgText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text.primary },
  replyBox: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  replyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  submit: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});
