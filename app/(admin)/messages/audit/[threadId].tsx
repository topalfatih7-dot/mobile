/**
 * LOCK: docs/mobile/screens/admin/messages.md — admin audit thread viewer (read-only)
 * Query param `kind=collab` switches to staff_collab_threads / staff_collab_messages.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

type AuditMessage = {
  id: string;
  senderType: string;
  senderLabel: string;
  text: string;
  createdAt: string;
};

async function fetchAuditMessages(threadId: string): Promise<{
  title: string;
  subtitle: string;
  messages: AuditMessage[];
}> {
  if (isUiOnly() || !supabase) return { title: 'Sohbet', subtitle: '', messages: [] };
  const client = requireSupabase();

  // Fetch thread metadata
  const { data: thread } = await client
    .from('chat_threads')
    .select('data, staff_role')
    .eq('id', threadId)
    .maybeSingle();

  const d = (thread?.data as Record<string, unknown>) || {};
  const title = String(d.memberName || 'Üye');
  const subtitle = `${String(d.staffName || 'Danışman')} · ${String(thread?.staff_role || '')}`;

  // Fetch messages
  const { data: msgs, error } = await client
    .from('chat_messages')
    .select('id, sender_type, data, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(300);

  if (error) return { title, subtitle, messages: [] };

  return {
    title,
    subtitle,
    messages: (msgs || []).map((m) => {
      const md = (m.data as Record<string, unknown>) || {};
      const st = String(m.sender_type || 'member');
      return {
        id: String(m.id),
        senderType: st,
        senderLabel: st === 'member' ? 'Üye' : 'Danışman',
        text: String(md.text || ''),
        createdAt: String(m.created_at || ''),
      };
    }),
  };
}

async function fetchCollabMessages(threadId: string): Promise<{
  title: string;
  subtitle: string;
  messages: AuditMessage[];
}> {
  if (isUiOnly() || !supabase) return { title: 'İşbirliği', subtitle: '', messages: [] };
  const client = requireSupabase();

  const { data: thread } = await client
    .from('staff_collab_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();

  const d = (thread?.data as Record<string, unknown>) || {};
  const title = String(d.memberName || 'Danışan');
  const subtitle = `${String(d.coachName || 'Koç')} · ${String(d.dietitianName || 'Diyetisyen')}`;

  const { data: msgs, error } = await client
    .from('staff_collab_messages')
    .select('id, sender_type, data, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(300);

  if (error) return { title, subtitle, messages: [] };

  return {
    title,
    subtitle,
    messages: (msgs || []).map((m) => {
      const md = (m.data as Record<string, unknown>) || {};
      const st = String(m.sender_type || 'coach');
      return {
        id: String(m.id),
        senderType: st,
        senderLabel: st === 'coach' ? 'Koç' : 'Diyetisyen',
        text: String(md.text || ''),
        createdAt: String(m.created_at || ''),
      };
    }),
  };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function AdminAuditThread() {
  const insets = useSafeAreaInsets();
  const { threadId, kind } = useLocalSearchParams<{ threadId: string; kind?: string }>();
  const isCollab = kind === 'collab';

  const [busy, setBusy] = useState(true);
  const [title, setTitle] = useState('Sohbet');
  const [subtitle, setSubtitle] = useState('');
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const listRef = useRef<FlatList<AuditMessage>>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setBusy(true);
    try {
      const result = isCollab
        ? await fetchCollabMessages(String(threadId))
        : await fetchAuditMessages(String(threadId));
      setTitle(result.title);
      setSubtitle(result.subtitle);
      setMessages(result.messages);
    } catch {
      setMessages([]);
    } finally {
      setBusy(false);
    }
  }, [threadId, isCollab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MeshBackground style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
          <Text numberOfLines={1} style={styles.headerSub}>{subtitle}</Text>
        </View>
        <View style={styles.auditBadge}>
          <Ionicons color={colors.warm[500]} name="eye" size={14} />
          <Text style={styles.auditBadgeText}>Denetim</Text>
        </View>
      </View>

      {busy ? (
        <InlineSpinner fill />
      ) : messages.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="Henüz mesaj yok." />
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMember = item.senderType === 'member' || item.senderType === 'coach';
            return (
              <Animated.View
                entering={FadeInUp.duration(180)}
                style={[styles.msgRow, !isMember && styles.msgRowRight]}>
                <View style={[
                  styles.bubble,
                  isMember ? styles.bubbleLeft : styles.bubbleRight,
                ]}>
                  <Text style={styles.senderLabel}>{item.senderLabel}</Text>
                  <Text style={[styles.msgText, !isMember && styles.msgTextRight]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.msgTime, !isMember && styles.msgTimeRight]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </Animated.View>
            );
          }}
        />
      )}

      <View style={[styles.readOnlyBar, { paddingBottom: insets.bottom + 8 }]}>
        <Ionicons color={colors.warm[500]} name="lock-closed" size={14} />
        <Text style={styles.readOnlyBarText}>
          Bu görüşme yalnızca denetim amaçlı görüntülenmektedir.
        </Text>
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600] },
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warm[100],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  auditBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.warm[500] },
  list: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 6 },
  msgRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  bubbleRight: { backgroundColor: colors.brand[50], borderWidth: 1, borderColor: colors.brand[200] },
  senderLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.brand[600],
    marginBottom: 3,
  },
  msgText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900], lineHeight: 20 },
  msgTextRight: { color: colors.brand[800] },
  msgTime: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.cream[300],
    marginTop: 4,
  },
  msgTimeRight: { textAlign: 'right' },
  readOnlyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  readOnlyBarText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.warm[500],
  },
});
