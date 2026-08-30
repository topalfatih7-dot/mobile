import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchMemberTickets,
  fetchSupportFaqs,
  sendTicketReply,
  subscribeMemberTickets,
  type SupportFaq,
  type SupportTicket,
  type TicketMessage,
} from '@/services/supportTickets';
import { colors, fonts, radius, spacing } from '@/theme';

const QUICK: {
  id: string;
  category: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'technical',
    category: 'Teknik sorun',
    title: 'Teknik Sorun',
    desc: 'Uygulama veya platform hatası bildirin',
    icon: 'construct',
  },
  {
    id: 'payment',
    category: 'Ödeme',
    title: 'Ödeme & Paket',
    desc: 'Fatura, ödeme veya paket sorularınız',
    icon: 'card',
  },
  {
    id: 'health',
    category: 'Sağlık bildirimi',
    title: 'Sağlık Bildirimi',
    desc: 'Sağlık testi veya programla ilgili bildirim',
    icon: 'fitness',
  },
  {
    id: 'general',
    category: 'Genel soru',
    title: 'Genel Soru',
    desc: 'Diğer tüm soru ve talepleriniz için',
    icon: 'help-circle',
  },
];

const STATUS_LABEL: Record<string, string> = {
  open: 'Bekliyor',
  'in-progress': 'İşleme Alındı',
  closed: 'Çözüldü',
};

const CATEGORIES = ['Genel soru', 'Teknik sorun', 'Sağlık bildirimi', 'Ödeme'];

function ticketMessages(ticket: SupportTicket): TicketMessage[] {
  if (ticket.messages?.length) return ticket.messages;
  if (!ticket.message) return [];
  return [
    {
      id: 'm0',
      from: 'member',
      text: ticket.message,
      createdAt: ticket.createdAt || new Date().toISOString(),
    },
  ];
}

/**
 * LOCK: docs/mobile/screens/member/support.md
 * Web parity: tickets tablosu (member.supportTickets JSON değil)
 */
export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { createSupportTicket } = useActions();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState('Genel soru');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!member?.id) {
      setTickets([]);
      return;
    }
    const list = await fetchMemberTickets(String(member.id));
    setTickets(list);
  }, [member?.id]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    void fetchSupportFaqs().then(setFaqs);
  }, []);

  useEffect(() => {
    if (!member?.id) return;
    return subscribeMemberTickets(String(member.id), () => {
      void loadTickets();
    });
  }, [member?.id, loadTickets]);

  const openQuick = (cat: string) => {
    setCategory(cat);
    setSubject('');
    setMessage('');
    setSuccess(false);
    setFormOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    const res = await createSupportTicket({ category, subject, message });
    setSaving(false);
    if (!res.ok) {
      toast(res.error, 'error');
      return;
    }
    setSuccess(true);
    void loadTickets();
  };

  const activeTicket = tickets.find((ticket) => ticket.id === activeId) || null;
  const activeMessages = activeTicket ? ticketMessages(activeTicket) : [];

  const submitReply = async () => {
    if (!activeTicket || !reply.trim()) return;
    setReplying(true);
    const result = await sendTicketReply(activeTicket.id, 'member', reply);
    setReplying(false);
    if (!result.success) {
      toast(result.error || 'Mesaj gönderilemedi', 'error');
      return;
    }
    setTickets((current) =>
      current.map((ticket) => (ticket.id === result.ticket.id ? result.ticket : ticket)),
    );
    setReply('');
    toast('Mesajınız gönderildi', 'success');
  };

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.sm, paddingBottom: insets.bottom + 32 },
        ]}>
        <FadeIn>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
          <Text style={styles.title}>Destek Merkezi</Text>
          <Text style={styles.sub}>Talepleriniz anlık olarak destek ekibine iletilir</Text>
        </FadeIn>

        {tickets.length > 0 ? (
          <FadeIn delay={50}>
            <Text style={styles.section}>Taleplerim</Text>
            {tickets.map((t) => {
              const status = String(t.status || 'open');
              const messages = ticketMessages(t);
              const last = messages[messages.length - 1];
              const hasReply = messages.some((item) => item.from === 'admin');
              return (
                <Pressable key={t.id} onPress={() => setActiveId(t.id)} style={styles.ticket}>
                  <View style={styles.ticketTitleRow}>
                    <Text style={styles.ticketSubject}>
                      {String(t.subject || 'Destek Talebi')}
                    </Text>
                    <Text style={styles.statusBadge}>{STATUS_LABEL[status] || status}</Text>
                    {hasReply && status !== 'closed' ? (
                      <Text style={styles.newReply}>Yeni yanıt</Text>
                    ) : null}
                  </View>
                  <Text numberOfLines={1} style={styles.ticketPreview}>
                    {last
                      ? `${last.from === 'admin' ? 'Destek: ' : ''}${last.text}`
                      : String(t.message || '')}
                  </Text>
                </Pressable>
              );
            })}
          </FadeIn>
        ) : null}

        <Text style={styles.section}>Hızlı talep</Text>
        {QUICK.map((q, i) => (
          <FadeIn key={q.id} delay={80 + i * 30}>
            <Pressable onPress={() => openQuick(q.category)} style={styles.quick}>
              <View style={styles.quickIcon}>
                <Ionicons color={colors.brand[700]} name={q.icon} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{q.title}</Text>
                <Text style={styles.quickDesc}>{q.desc}</Text>
              </View>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
            </Pressable>
          </FadeIn>
        ))}

        <Pressable onPress={() => openQuick('Genel soru')} style={styles.contactCard}>
          <Ionicons color={colors.white} name="headset" size={24} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Bize Ulaşın</Text>
            <Text style={styles.contactText}>Formu doldurun — ekibimiz talebinizi takip eder</Text>
          </View>
          <Ionicons color={colors.white} name="chevron-forward" size={18} />
        </Pressable>

        {faqs.length > 0 ? (
          <View style={styles.faqSection}>
            <Text style={styles.faqHeading}>Sık Sorulan Sorular</Text>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === faq.id;
              return (
                <View key={faq.id} style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => setOpenFaq(isOpen ? null : faq.id)}
                    style={styles.faqButton}>
                    <Text style={styles.faqNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Ionicons
                      color={colors.brand[500]}
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                    />
                  </Pressable>
                  {isOpen ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setFormOpen(false)} visible={formOpen}>
        <View style={[styles.modal, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          {success ? (
            <View style={styles.success}>
              <Ionicons color={colors.sage[600]} name="checkmark-circle" size={48} />
              <Text style={styles.successTitle}>Talebiniz alındı</Text>
              <Text style={styles.successBody}>
                Destek ekibimiz en kısa sürede size dönüş yapacak.
              </Text>
              <Button label="Tamam" onPress={() => setFormOpen(false)} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ gap: spacing.md }}>
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>Destek talebi</Text>
                <Pressable
                  accessibilityLabel="Kapat"
                  accessibilityRole="button"
                  onPress={() => setFormOpen(false)}>
                  <Text style={styles.close}>Kapat</Text>
                </Pressable>
              </View>
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.categoryChip,
                      category === item && styles.categoryChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.categoryText,
                        category === item && styles.categoryTextActive,
                      ]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Konu</Text>
              <TextInput
                onChangeText={setSubject}
                placeholder="Kısa bir konu başlığı"
                placeholderTextColor={colors.cream[300]}
                style={styles.input}
                value={subject}
              />
              <Text style={styles.fieldLabel}>Mesaj</Text>
              <TextInput
                multiline
                onChangeText={setMessage}
                placeholder="Sorununuzu veya sorunuzu detaylı yazın..."
                placeholderTextColor={colors.cream[300]}
                style={[styles.input, styles.textarea]}
                value={message}
              />
              <Button
                label={saving ? 'Gönderiliyor…' : 'Talebi Gönder'}
                loading={saving}
                onPress={submit}
              />
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setActiveId(null)}
        visible={!!activeTicket}>
        <View
          style={[
            styles.modal,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
          ]}>
          {activeTicket ? (
            <>
              <View style={styles.modalHead}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {activeTicket.subject || 'Destek Talebi'}
                </Text>
                <Pressable
                  accessibilityLabel="Kapat"
                  accessibilityRole="button"
                  onPress={() => setActiveId(null)}>
                  <Text style={styles.close}>Kapat</Text>
                </Pressable>
              </View>
              <View style={styles.threadMeta}>
                <Text style={styles.threadCategory}>{activeTicket.category || 'Genel'}</Text>
                <Text style={styles.statusBadge}>
                  {STATUS_LABEL[activeTicket.status || 'open'] || activeTicket.status}
                </Text>
              </View>
              <Text style={styles.liveText}>Canlı sohbet — mesajlar anında iletilir</Text>
              <ScrollView contentContainerStyle={styles.thread}>
                {activeMessages.map((item) => {
                  const own = item.from === 'member';
                  return (
                    <View
                      key={item.id}
                      style={[styles.messageRow, own && styles.messageRowOwn]}>
                      <View
                        style={[
                          styles.messageBubble,
                          own ? styles.messageOwn : styles.messageSupport,
                        ]}>
                        <Text style={[styles.messageFrom, own && styles.messageTextOwn]}>
                          {item.from === 'admin'
                            ? 'Destek Ekibi'
                            : item.from === 'system'
                              ? 'Bilgi'
                              : activeTicket.memberName || 'Üye'}
                        </Text>
                        <Text style={[styles.messageText, own && styles.messageTextOwn]}>
                          {item.text}
                        </Text>
                        <Text style={[styles.messageTime, own && styles.messageTimeOwn]}>
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              {activeTicket.status === 'closed' ? (
                <Text style={styles.closedText}>Bu talep çözüldü olarak kapatıldı.</Text>
              ) : (
                <View style={styles.replyRow}>
                  <TextInput
                    multiline
                    onChangeText={setReply}
                    placeholder="Mesajınızı yazın..."
                    placeholderTextColor={colors.cream[300]}
                    style={[styles.input, styles.replyInput]}
                    value={reply}
                  />
                  <Pressable
                    accessibilityLabel="Gönder"
                    disabled={replying || !reply.trim()}
                    onPress={() => void submitReply()}
                    style={[styles.sendButton, (replying || !reply.trim()) && styles.sendDisabled]}>
                    <Ionicons color={colors.white} name="send" size={18} />
                  </Pressable>
                </View>
              )}
            </>
          ) : null}
        </View>
      </Modal>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  title: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.cream[900] },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.sm,
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 72,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  quickDesc: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  section: {
    marginTop: spacing.md,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticket: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginBottom: spacing.sm,
    gap: 5,
  },
  ticketTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  ticketSubject: {
    flexShrink: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  statusBadge: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.brand[700],
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newReply: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.sage[500],
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ticketPreview: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  contactCard: {
    marginTop: spacing.md,
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  contactTitle: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.white },
  contactText: {
    marginTop: 3,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.white,
  },
  faqSection: { marginTop: spacing.lg, gap: spacing.sm },
  faqHeading: {
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    color: colors.cream[900],
    marginBottom: 4,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  faqCardOpen: { borderColor: colors.brand[300] },
  faqButton: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  faqNumber: {
    width: 34,
    height: 34,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    backgroundColor: colors.brand[100],
    borderRadius: 11,
    overflow: 'hidden',
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[900],
  },
  faqAnswer: {
    borderTopWidth: 1,
    borderTopColor: colors.brand[100],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.cream[800],
  },
  modal: { flex: 1, backgroundColor: colors.cream[50], paddingHorizontal: spacing.lg },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    flexShrink: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.cream[900],
  },
  close: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  fieldLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  categoryChipActive: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  categoryText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  categoryTextActive: { color: colors.white },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  successTitle: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.cream[900] },
  successBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  threadMeta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[100],
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    padding: spacing.md,
  },
  threadCategory: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[700] },
  liveText: {
    marginTop: spacing.md,
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  thread: { paddingVertical: spacing.md, gap: spacing.sm },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  messageOwn: { backgroundColor: colors.brand[500] },
  messageSupport: { backgroundColor: colors.cream[100] },
  messageFrom: {
    marginBottom: 4,
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.cream[800],
  },
  messageText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.cream[900] },
  messageTextOwn: { color: colors.white },
  messageTime: { marginTop: 4, fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800] },
  messageTimeOwn: { color: colors.white },
  closedText: {
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    paddingTop: spacing.md,
  },
  replyInput: { flex: 1, minHeight: 52, maxHeight: 100, textAlignVertical: 'top' },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[600],
  },
  sendDisabled: { opacity: 0.5 },
});
