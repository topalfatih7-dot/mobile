/**
 * LOCK: staff messages thread — real chat_threads / chat_messages
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  loadStaffClientThread,
  markStaffChatThreadRead,
  sendStaffChatMessage,
  subscribeStaffClientChat,
  type ChatMessage,
  type ChatThread,
} from '@/services/chat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffThread() {
  const { threadId: memberId } = useLocalSearchParams<{ threadId: string }>();
  const { staffClients } = useData();
  const { staff } = useAuth();
  const client = staffClients.find((c) => String(c.id) === String(memberId));
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    if (!client?.id || !staff?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await loadStaffClientThread(
        String(client.id),
        String(staff.id),
        String(staff.role || 'coach'),
        String(client.name || 'Üye'),
        String(staff.name || ''),
      );
      setThread(res.thread);
      setMsgs(res.messages);
      if (res.thread?.id) await markStaffChatThreadRead(res.thread.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [client, staff, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!staff?.id) return;
    return subscribeStaffClientChat(() => {
      void reload();
    }, String(staff.id));
  }, [staff?.id, reload]);

  useEffect(() => {
    const id = setInterval(() => void reload(), 8000);
    return () => clearInterval(id);
  }, [reload]);

  useEffect(() => {
    if (thread?.id) {
      setActiveChatThreadId(thread.id);
      return () => setActiveChatThreadId(null);
    }
    return undefined;
  }, [thread?.id]);

  const send = async () => {
    if (!thread?.id || !staff?.id) return;
    setSending(true);
    const res = await sendStaffChatMessage(thread.id, String(staff.id), text);
    setSending(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    setText('');
    await reload();
  };

  const initial = String(client?.name || '?').charAt(0).toUpperCase();

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initial}</Text>
          </View>
          <Text style={styles.title}>{client ? String(client.name) : 'Sohbet'}</Text>
        </View>
        {loading ? (
          <InlineSpinner fill />
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={msgs}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const mine = item.senderType === 'staff';
              return (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  style={[styles.msgRow, mine && styles.msgRowMine]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleThem]}>
                    <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.text}</Text>
                  </View>
                </Animated.View>
              );
            }}
          />
        )}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            editable={!sending}
            multiline
            onChangeText={setText}
            placeholder="Mesaj yazın…"
            placeholderTextColor={colors.cream[300]}
            style={styles.input}
            value={text}
          />
          <Pressable
            disabled={sending || !text.trim()}
            onPress={() => void send()}
            style={[styles.send, (!text.trim() || sending) && styles.sendOff]}>
            <Ionicons color={colors.white} name="send" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.white },
  title: { flex: 1, fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  list: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cream[200] },
  bubbleMine: { backgroundColor: colors.brand[500] },
  msgText: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  msgTextMine: { color: colors.white },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    backgroundColor: colors.white,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});
