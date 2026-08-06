/**
 * LOCK: docs/mobile/screens/staff/messages.md
 * Member↔staff threads + admin channel (real admin_staff_threads).
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  fetchStaffChatThreads,
  subscribeStaffClientChat,
  type ChatThread,
} from '@/services/chat';
import {
  getOrCreateAdminStaffThread,
  subscribeAdminStaffChat,
  type AdminStaffThread,
} from '@/services/adminStaffChat';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const PLAN_AVATAR_COLORS: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  diyet: colors.sage[500],
};

export default function StaffMessagesIndex() {
  const { loading, staffClients } = useData();
  const { staff } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [adminThread, setAdminThread] = useState<AdminStaffThread | null>(null);
  const [busy, setBusy] = useState(true);

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

  useEffect(() => {
    if (!staff?.id) return;
    const unsubs = [
      subscribeStaffClientChat(() => void reload(), String(staff.id)),
      subscribeAdminStaffChat(() => void reload()),
    ];
    return () => unsubs.forEach((u) => u());
  }, [staff?.id, reload]);

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

  return (
    <PanelScaffold subtitle="Danışan sohbetleri" title="Mesajlar">
      {(loading || busy) && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
          {adminThread ? (
            <FadeIn delay={40}>
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
            </FadeIn>
          ) : null}

          {sortedClients.map((c, i) => {
            const thread = threads.find((t) => t.memberId === String(c.id));
            const avatarColor =
              PLAN_AVATAR_COLORS[String(c.membership)] || colors.cream[300];
            return (
              <FadeIn key={String(c.id)} delay={40 + i * 30}>
                <Pressable
                  onPress={() =>
                    router.push(`/(staff)/messages/${c.id}` as Href)
                  }
                  style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>
                      {String(c.name || '?').charAt(0).toUpperCase()}
                    </Text>
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
              </FadeIn>
            );
          })}
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
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
