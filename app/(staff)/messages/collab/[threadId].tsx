/**
 * LOCK: docs/mobile/screens/staff/collab-messages.md
 * Param = memberId (web `/staff/collab-messages/:memberId`)
 * Roles: coach | dietitian | doctor
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  collabPeerName,
  fetchStaffCollabMessages,
  getOrCreateStaffCollabThread,
  markStaffCollabThreadRead,
  sendStaffCollabMessage,
  subscribeStaffCollabChat,
  type StaffCollabMessage,
  type StaffCollabThread,
} from '@/services/staffCollabChat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { normalizeStaffRole } from '@/utils/staffClients';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffCollabMessages() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const memberId = String(threadId || '');
  const insets = useSafeAreaInsets();
  const { staff } = useAuth();
  const { platform } = useData();
  const { toast } = useToast();
  const role = normalizeStaffRole(staff?.role as string);
  const isAllowed = role === 'coach' || role === 'dietitian' || role === 'doctor';

  const member = useMemo(
    () => platform.members.find((m) => String(m.id) === memberId) || null,
    [platform.members, memberId],
  );

  const [text, setText] = useState('');
  const [thread, setThread] = useState<StaffCollabThread | null>(null);
  const [msgs, setMsgs] = useState<StaffCollabMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const peerName = useMemo(() => collabPeerName(thread, role), [thread, role]);

  const reloadMessages = useCallback(async () => {
    if (!thread?.id) return;
    try {
      setMsgs(await fetchStaffCollabMessages(thread.id));
    } catch {
      /* keep */
    }
  }, [thread?.id]);

  const bootstrap = useCallback(async () => {
    if (!member || !staff?.id || !isAllowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const staffList = platform.staffList.length
        ? platform.staffList
        : Object.values(platform.staffById);
      const t = await getOrCreateStaffCollabThread(member, staffList);
      setThread(t);
      if (t) {
        setMsgs(await fetchStaffCollabMessages(t.id));
        // Only clears unread when > 0 — no-op UPDATE avoided in service
        await markStaffCollabThreadRead(t.id, role);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [member, staff?.id, role, isAllowed, platform.staffList, platform.staffById, toast]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!staff?.id) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeStaffCollabChat(() => {
      if (t) clearTimeout(t);
      t = setTimeout(() => void reloadMessages(), 400);
    }, staff);
    return () => {
      if (t) clearTimeout(t);
      unsub();
    };
  }, [staff, reloadMessages]);

  useEffect(() => {
    if (thread?.id) {
      setActiveChatThreadId(thread.id);
      return () => setActiveChatThreadId(null);
    }
    return undefined;
  }, [thread?.id]);

  const send = async () => {
    if (!thread || !staff?.id || !isAllowed) return;
    setSending(true);
    const res = await sendStaffCollabMessage({
      thread,
      senderType: role,
      senderId: String(staff.id),
      text,
    });
    setSending(false);
    if (!res.success) {
      toast(res.error || 'Gönderilemedi', 'error');
      return;
    }
    setText('');
    await reloadMessages();
  };

  if (!isAllowed) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
        </View>
        <EmptyState title="Bu rol için ekip sohbeti yok." />
      </MeshBackground>
    );
  }

  if (!member) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
        </View>
        <EmptyState title="Danışan bulunamadı." />
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View>
            <Text style={styles.title}>{peerName}</Text>
            <Text style={styles.subtitle}>Danışan adına: {String(member.name)}</Text>
          </View>
        </View>
        {loading ? (
          <InlineSpinner fill />
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={msgs}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const mine = item.senderType === role;
              return (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  style={[styles.msgRow, mine && styles.msgRowMine]}>
                  {!mine ? (
                    <View style={styles.peerAvatar}>
                      <Text style={styles.peerAvatarText}>
                        {peerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
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
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600] },
  list: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  peerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.sage[700] },
  bubble: {
    maxWidth: '78%',
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
