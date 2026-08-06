/**
 * LOCK: docs/mobile/screens/staff/collab-messages.md — inbox
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  collabUnreadForStaff,
  ensureStaffCollabThreads,
  getStaffCollabMembers,
  subscribeStaffCollabChat,
  type StaffCollabThread,
} from '@/services/staffCollabChat';
import { normalizeStaffRole } from '@/utils/staffClients';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffCollabInbox() {
  const { staff } = useAuth();
  const { loading, platform } = useData();
  const role = normalizeStaffRole(staff?.role as string);
  const [threads, setThreads] = useState<StaffCollabThread[]>([]);
  const [busy, setBusy] = useState(true);

  const clients = useMemo(
    () => getStaffCollabMembers(platform.members, staff),
    [platform.members, staff],
  );

  const reload = useCallback(async () => {
    if (!staff?.id || (role !== 'coach' && role !== 'dietitian')) {
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const list = await ensureStaffCollabThreads(
        staff,
        platform.members,
        platform.staffList.length ? platform.staffList : Object.values(platform.staffById),
      );
      setThreads(list);
    } catch {
      setThreads([]);
    } finally {
      setBusy(false);
    }
  }, [staff, role, platform.members, platform.staffList, platform.staffById]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!staff) return;
    return subscribeStaffCollabChat(() => void reload(), staff);
  }, [staff, reload]);

  const sortedClients = useMemo(() => {
    return clients.slice().sort((a, b) => {
      const ta = threads.find((t) => t.memberId === String(a.id));
      const tb = threads.find((t) => t.memberId === String(b.id));
      const ua = ta ? collabUnreadForStaff(ta, role) : 0;
      const ub = tb ? collabUnreadForStaff(tb, role) : 0;
      if (ua !== ub) return ub - ua;
      const ma = ta?.lastMessageAt ? new Date(ta.lastMessageAt).getTime() : 0;
      const mb = tb?.lastMessageAt ? new Date(tb.lastMessageAt).getTime() : 0;
      return mb - ma;
    });
  }, [clients, threads, role]);

  if (role !== 'coach' && role !== 'dietitian') {
    return (
      <PanelScaffold showBack subtitle="Koç ↔ Diyetisyen" title="Ekip Mesajları">
        <EmptyState title="Bu rol için ekip sohbeti yok." />
      </PanelScaffold>
    );
  }

  return (
    <PanelScaffold showBack subtitle="Koç ↔ Diyetisyen" title="Ekip Mesajları">
      {(loading || busy) && clients.length === 0 ? (
        <InlineSpinner fill />
      ) : clients.length === 0 ? (
        <EmptyState title="Ortak danışan yok." />
      ) : (
        sortedClients.map((m, i) => {
          const thread = threads.find((t) => t.memberId === String(m.id));
          const peerName =
            role === 'coach'
              ? thread?.dietitianName || 'Diyetisyen'
              : thread?.coachName || 'Koç';
          const unread = thread ? collabUnreadForStaff(thread, role) : 0;
          return (
            <FadeIn delay={i * 40} key={String(m.id)}>
              <Pressable
                onPress={() =>
                  router.push(`/(staff)/messages/collab/${m.id}` as Href)
                }
                style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {peerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{peerName}</Text>
                  <Text numberOfLines={1} style={styles.sub}>
                    Danışan adına: {String(m.name || 'Danışan')}
                  </Text>
                  {thread?.lastPreview ? (
                    <Text numberOfLines={1} style={styles.preview}>
                      {thread.lastPreview}
                    </Text>
                  ) : null}
                </View>
                {thread?.lastMessageAt ? (
                  <Text style={styles.time}>
                    {formatRelativeTimeTr(thread.lastMessageAt)}
                  </Text>
                ) : null}
                {unread > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{unread}</Text>
                  </View>
                ) : (
                  <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                )}
              </Pressable>
            </FadeIn>
          );
        })
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.sage[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.sage[700] },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600], marginTop: 2 },
  preview: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
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
