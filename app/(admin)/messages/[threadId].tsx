import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
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

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData } from '@/context/DataContext';
import {
  DEMO_ADMIN_STAFF_CHATS,
  type AdminStaffChatMessage,
} from '@/data/uiDemo';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

/** LOCK: docs/mobile/screens/admin/messages.md — admin staff chat thread */
export default function AdminMessageThread() {
  const insets = useSafeAreaInsets();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const staffId = String(threadId || '');
  const { loading, staffById, platform } = useData();
  const staff =
    staffById[staffId] ||
    platform.staffList.find((s) => String(s.id) === staffId) ||
    null;

  const [messages, setMessages] = useState<AdminStaffChatMessage[]>(
    () => DEMO_ADMIN_STAFF_CHATS[staffId] || [],
  );
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<AdminStaffChatMessage>>(null);
  const seedCount = useRef(messages.length);

  if (loading && !staff) {
    return (
      <PanelScaffold showBack subtitle="Personel sohbetleri" title="Mesajlar">
        <InlineSpinner fill />
      </PanelScaffold>
    );
  }

  if (!staff) {
    return (
      <PanelScaffold showBack subtitle="Personel sohbetleri" title="Mesajlar">
        <EmptyState icon="chatbubbles-outline" title="Sohbet bulunamadı." />
      </PanelScaffold>
    );
  }

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        from: 'admin',
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
  };

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable hitSlop={10} onPress={() => router.back()} style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle}>{String(staff.name)}</Text>
            <Text style={styles.headerSub}>
              {ROLE_LABELS[String(staff.role)] || String(staff.role)}
            </Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ref={listRef}
          renderItem={({ item, index }) => {
            const admin = item.from === 'admin';
            return (
              <Animated.View
                entering={FadeInUp.duration(200).delay(index < seedCount.current ? index * 60 : 0)}
                style={[styles.bubble, admin ? styles.bubbleAdmin : styles.bubbleStaff]}>
                <Text style={[styles.bubbleText, admin && styles.bubbleTextAdmin]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, admin && styles.bubbleTimeAdmin]}>
                  {formatRelativeTimeTr(item.createdAt)}
                </Text>
              </Animated.View>
            );
          }}
        />

        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            multiline
            onChangeText={setDraft}
            placeholder="Mesajını yaz…"
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
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerMeta: { flex: 1 },
  headerTitle: { fontFamily: fonts.sansSemi, fontSize: 17, color: colors.cream[900] },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    padding: 12,
  },
  bubbleStaff: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderBottomLeftRadius: 4,
  },
  bubbleAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900], lineHeight: 21 },
  bubbleTextAdmin: { color: colors.white },
  bubbleTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800], marginTop: 4 },
  bubbleTimeAdmin: { color: colors.brand[100] },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: colors.white,
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
