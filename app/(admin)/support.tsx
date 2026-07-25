import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn as ReFadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const STATUS: Record<string, string> = {
  open: 'Bekliyor',
  'in-progress': 'İşleme Alındı',
  closed: 'Çözüldü',
};

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  open: { bg: colors.warm[100], fg: colors.warm[500] },
  'in-progress': { bg: colors.brand[100], fg: colors.brand[700] },
  closed: { bg: colors.sage[100], fg: colors.sage[700] },
};

type TicketMessage = { from: string; text: string; createdAt: string };

type Ticket = {
  id: string;
  status: string;
  subject: string;
  category: string;
  memberName: string;
  messages: TicketMessage[];
};

function normalizeTicket(t: Record<string, unknown>): Ticket {
  const nested =
    t.data && typeof t.data === 'object' ? (t.data as Record<string, unknown>) : null;
  const subject = String(t.subject || nested?.subject || '');
  const category = String(t.category || nested?.category || '');
  const memberName = String(t.memberName || nested?.memberName || '');
  const rawMessages = (t.messages || nested?.messages || []) as TicketMessage[];
  return {
    id: String(t.id),
    status: String(t.status || 'open'),
    subject,
    category,
    memberName,
    messages: Array.isArray(rawMessages) ? [...rawMessages] : [],
  };
}

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.open;
  return (
    <Animated.View
      entering={ReFadeIn.duration(200)}
      key={status}
      style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{STATUS[status] || status}</Text>
    </Animated.View>
  );
}

/** LOCK: docs/mobile/screens/admin/support.md */
export default function AdminSupport() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { loading, platform } = useData();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTickets(platform.tickets.map((t) => normalizeTicket(t)));
  }, [platform.tickets]);

  const ticket = tickets.find((t) => t.id === selected);

  const close = () => {
    setSelected(null);
    setDraft('');
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !ticket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: t.status === 'open' ? 'in-progress' : t.status,
              messages: [
                ...t.messages,
                { from: 'admin', text, createdAt: new Date().toISOString() },
              ],
            }
          : t,
      ),
    );
    setDraft('');
    toast('Mesajınız gönderildi', 'success');
  };

  return (
    <PanelScaffold showBack subtitle="Destek talepleri" title="Destek">
      {loading && tickets.length === 0 ? (
        <InlineSpinner fill />
      ) : tickets.length === 0 ? (
        <EmptyState title="Açık destek talebi yok." />
      ) : (
        tickets.map((t, i) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <FadeIn delay={i * 40} key={t.id}>
              <Pressable
                onPress={() => setSelected(t.id)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.cardTop}>
                  <Text numberOfLines={1} style={styles.title}>
                    {t.subject}
                  </Text>
                  <StatusBadge status={t.status} />
                </View>
                <Text style={styles.meta}>
                  {t.memberName} · {t.category}
                </Text>
                {last ? (
                  <View style={styles.previewRow}>
                    <Text numberOfLines={1} style={styles.preview}>
                      {last.text}
                    </Text>
                    <Text style={styles.previewTime}>{formatRelativeTimeTr(last.createdAt)}</Text>
                  </View>
                ) : null}
              </Pressable>
            </FadeIn>
          );
        })
      )}

      <Modal animationType="none" onRequestClose={close} transparent visible={Boolean(ticket)}>
        <View style={styles.sheetRoot}>
          <Animated.View entering={ReFadeIn.duration(180)} style={StyleSheet.absoluteFill}>
            <Pressable onPress={close} style={styles.scrim} />
          </Animated.View>
          {ticket ? (
            <Animated.View
              entering={SlideInDown.springify().damping(18)}
              style={styles.sheet}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.grabber} />
                <View style={styles.sheetHead}>
                  <Text numberOfLines={1} style={styles.sheetTitle}>
                    {ticket.subject}
                  </Text>
                  <StatusBadge status={ticket.status} />
                </View>
                <Text style={styles.sheetMeta}>
                  {ticket.memberName} · {ticket.category}
                </Text>
                <ScrollView
                  contentContainerStyle={styles.history}
                  onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                  ref={listRef}
                  style={styles.historyScroll}>
                  {ticket.messages.length === 0 ? (
                    <Text style={styles.emptyHistory}>Henüz mesaj yok.</Text>
                  ) : (
                    ticket.messages.map((m, i) => {
                      const admin = m.from === 'admin';
                      return (
                        <Animated.View
                          entering={FadeInUp.duration(150)}
                          key={`${m.createdAt}-${i}`}
                          style={[styles.bubble, admin ? styles.bubbleAdmin : styles.bubbleMember]}>
                          <Text style={[styles.bubbleText, admin && styles.bubbleTextAdmin]}>
                            {m.text}
                          </Text>
                          <Text style={[styles.bubbleTime, admin && styles.bubbleTimeAdmin]}>
                            {formatRelativeTimeTr(m.createdAt)}
                          </Text>
                        </Animated.View>
                      );
                    })
                  )}
                </ScrollView>
                <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
                  <TextInput
                    multiline
                    onChangeText={setDraft}
                    placeholder="Yanıtını yaz…"
                    placeholderTextColor={colors.cream[300]}
                    style={styles.input}
                    value={draft}
                  />
                  <Pressable
                    disabled={!draft.trim()}
                    onPress={send}
                    style={[styles.send, !draft.trim() && styles.sendDisabled]}>
                    <Ionicons color={colors.white} name="send" size={18} />
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 2,
  },
  cardPressed: { backgroundColor: colors.cream[100] },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  preview: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  previewTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], opacity: 0.7 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: 'rgba(26,35,50,0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '85%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[300],
    marginBottom: spacing.sm,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitle: { flex: 1, fontFamily: fonts.displayExtra, fontSize: 18, color: colors.cream[900] },
  sheetMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  historyScroll: { marginTop: spacing.md, maxHeight: 340 },
  history: { gap: spacing.sm, paddingBottom: spacing.sm },
  emptyHistory: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    padding: 12,
  },
  bubbleMember: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  bubbleAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
  },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900], lineHeight: 20 },
  bubbleTextAdmin: { color: colors.white },
  bubbleTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800], marginTop: 4 },
  bubbleTimeAdmin: { color: colors.brand[100] },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
