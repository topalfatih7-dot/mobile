/**
 * LOCK: docs/mobile/screens/staff/messages.md
 * Member↔staff threads + admin channel (real admin_staff_threads).
 * Web: StaffMessagesPage.jsx — search + presence + inbox→thread push (MOBILE DIFF).
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { useData } from '@/context/DataContext';
import { useChatPresence } from '@/hooks/useChatPresence';
import {
  fetchStaffChatThreads,
  type ChatThread,
} from '@/services/chat';
import {
  getOrCreateAdminStaffThread,
  type AdminStaffThread,
} from '@/services/adminStaffChat';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const PLAN_AVATAR_COLORS: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  eko_spor: colors.brand[500],
  diyet: colors.sage[500],
  eko_diyet: colors.sage[500],
  eko: colors.sage[500],
};

export default function StaffMessagesIndex() {
  const { loading, staffClients } = useData();
  const { staff } = useAuth();
  const { subscribeBump } = useChatUnread();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [adminThread, setAdminThread] = useState<AdminStaffThread | null>(null);
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState('');

  const reload = useCallback(async () => {
    if (!staff?.id) {
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const [list, admin] = await Promise.all([
        fetchStaffChatThreads(String(staff.id)),
        getOrCreateAdminStaffThread({
          id: String(staff.id),
          name: String(staff.name || ''),
          role: String(staff.role || ''),
        }),
      ]);
      setThreads(list);
      setAdminThread(admin);
    } catch {
      setThreads([]);
    } finally {
      setBusy(false);
    }
  }, [staff]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Layout owns chat subscriptions; inbox listens to shared bump
  useEffect(() => subscribeBump(() => void reload()), [subscribeBump, reload]);

  const sortedClients = useMemo(() => {
    return staffClients.slice().sort((a, b) => {
      const ta = threads.find((t) => t.memberId === String(a.id));
      const tb = threads.find((t) => t.memberId === String(b.id));
      const ua = Number(ta?.staffUnread || 0);
      const ub = Number(tb?.staffUnread || 0);
      if (ua !== ub) return ub - ua;
      const ma = ta?.lastMessageAt ? new Date(ta.lastMessageAt).getTime() : 0;
      const mb = tb?.lastMessageAt ? new Date(tb.lastMessageAt).getTime() : 0;
      return mb - ma;
    });
  }, [staffClients, threads]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedClients;
    return sortedClients.filter((c) =>
      String(c.name || '')
        .toLowerCase()
        .includes(q),
    );
  }, [sortedClients, query]);

  const peerIds = useMemo(
    () => filteredClients.map((c) => String(c.id)),
    [filteredClients],
  );
  const { isOnline, lastSeenAt } = useChatPresence(peerIds);

  const renderClientRow = useCallback(
    ({ item: c }: { item: (typeof filteredClients)[number] }) => {
      const thread = threads.find((t) => t.memberId === String(c.id));
      const memberId = String(c.id);
      const avatarColor =
        PLAN_AVATAR_COLORS[String(c.membership)] || colors.cream[300];
      return (
        <Pressable
          onPress={() => router.push(`/(staff)/messages/${memberId}` as Href)}
          style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {String(c.name || '?').charAt(0).toUpperCase()}
            </Text>
            <View style={styles.presenceDot}>
              <PresenceIndicator
                lastSeenAt={lastSeenAt(memberId)}
                online={isOnline(memberId)}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{String(c.name)}</Text>
            {thread?.lastPreview ? (
              <Text numberOfLines={1} style={styles.preview}>
                {thread.lastPreview}
              </Text>
            ) : null}
          </View>
          <View style={styles.rowRight}>
            {thread?.lastMessageAt ? (
              <Text style={styles.time}>
                {formatRelativeTimeTr(thread.lastMessageAt)}
              </Text>
            ) : null}
            {thread && thread.staffUnread > 0 ? (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{thread.staffUnread}</Text>
              </View>
            ) : (
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
            )}
          </View>
        </Pressable>
      );
    },
    [threads, isOnline, lastSeenAt],
  );

  return (
    <PanelScaffold scroll={false} subtitle="Danışan sohbetleri" title="Mesajlar">
      {(loading || busy) && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <FlatList
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 16, flexGrow: 1 }}
          data={filteredClients}
          initialNumToRender={12}
          keyExtractor={(c) => String(c.id)}
          ListHeaderComponent={
            <>
              <View style={styles.searchWrap}>
                <Ionicons
                  color={colors.cream[800]}
                  name="search"
                  size={18}
                  style={{ opacity: 0.4 }}
                />
                <TextInput
                  onChangeText={setQuery}
                  placeholder="Danışan ara…"
                  placeholderTextColor={colors.cream[300]}
                  style={styles.searchInput}
                  value={query}
                />
              </View>
              {adminThread ? (
                <Pressable
                  onPress={() =>
                    router.push(`/(staff)/messages/admin/${adminThread.id}` as Href)
                  }
                  style={styles.row}>
                  <View style={[styles.channelIcon, { backgroundColor: colors.brand[600] }]}>
                    <Ionicons color={colors.white} name="shield" size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>Admin</Text>
                    <Text numberOfLines={1} style={styles.preview}>
                      {adminThread.lastPreview || 'Yönetim ile yazışma'}
                    </Text>
                  </View>
                  {adminThread.staffUnread > 0 ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{adminThread.staffUnread}</Text>
                    </View>
                  ) : (
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  )}
                </Pressable>
              ) : null}
            </>
          }
          maxToRenderPerBatch={10}
          removeClippedSubviews
          renderItem={renderClientRow}
          style={{ flex: 1 }}
          windowSize={9}
        />
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 2,
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  preview: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[300] },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
});
