/**
 * LOCK: docs/mobile/screens/staff/collab-messages.md — inbox
 * Web: StaffCollabMessagesPage.jsx — coach | dietitian | doctor
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  collabPeerName,
  collabUnreadForStaff,
  ensureStaffCollabThreads,
  fetchStaffCollabThreadsForStaff,
  getStaffCollabMembers,
  subscribeStaffCollabChat,
  type StaffCollabThread,
} from '@/services/staffCollabChat';
import { normalizeStaffRole } from '@/utils/staffClients';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffCollabInbox() {
  const { staff } = useAuth();
  const { loading, platform, staffClients } = useData();
  const role = normalizeStaffRole(staff?.role as string);
  const isAllowed = role === 'coach' || role === 'dietitian' || role === 'doctor';
  const staffId = staff?.id ? String(staff.id) : '';
  const [threads, setThreads] = useState<StaffCollabThread[]>([]);
  const [busy, setBusy] = useState(true);
  const ensuredRef = useRef(false);
  const reloadGen = useRef(0);

  const clients = useMemo(
    () => getStaffCollabMembers(platform.members, staff),
    [platform.members, staff],
  );

  const staffList = useMemo(
    () =>
      platform.staffList.length
        ? platform.staffList
        : Object.values(platform.staffById),
    [platform.staffList, platform.staffById],
  );

  /** Soft refresh: fetch only. Hard ensure once (creates missing threads). */
  const reload = useCallback(
    async (mode: 'ensure' | 'fetch' = 'fetch') => {
      if (!staffId || !isAllowed || !staff) {
        setBusy(false);
        return;
      }
      const gen = ++reloadGen.current;
      const showSpinner = mode === 'ensure' && !ensuredRef.current;
      if (showSpinner) setBusy(true);
      try {
        const list =
          mode === 'ensure' || !ensuredRef.current
            ? await ensureStaffCollabThreads(staff, platform.members, staffList)
            : await fetchStaffCollabThreadsForStaff(staff);
        if (gen !== reloadGen.current) return;
        if (mode === 'ensure' || !ensuredRef.current) ensuredRef.current = true;
        setThreads(list);
      } catch {
        if (gen !== reloadGen.current) return;
        // Keep previous threads on error — avoid empty flicker
      } finally {
        if (gen === reloadGen.current) setBusy(false);
      }
    },
    [staff, staffId, isAllowed, platform.members, staffList],
  );

  useEffect(() => {
    ensuredRef.current = false;
    void reload('ensure');
  }, [staffId, isAllowed]); // eslint-disable-line react-hooks/exhaustive-deps -- mount / staff change only

  // When members hydrate after mount, ensure once more if we had zero clients
  useEffect(() => {
    if (!staffId || !isAllowed) return;
    if (clients.length === 0) return;
    if (ensuredRef.current && threads.length > 0) return;
    void reload('ensure');
  }, [clients.length, staffId, isAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!staffId || !staff) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeStaffCollabChat(() => {
      if (t) clearTimeout(t);
      // Debounce realtime — avoid ensure/create storms
      t = setTimeout(() => void reload('fetch'), 400);
    }, staff);
    return () => {
      if (t) clearTimeout(t);
      unsub();
    };
  }, [staffId, staff, reload]);

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

  if (!isAllowed) {
    return (
      <PanelScaffold showBack subtitle="Koç ↔ Diyetisyen ↔ Doktor" title="Ekip Mesajları">
        <EmptyState title="Bu rol için ekip sohbeti yok." />
      </PanelScaffold>
    );
  }

  const showInitialSpinner = (loading || busy) && clients.length === 0 && threads.length === 0;
  const showEmpty = !loading && !busy && clients.length === 0;
  const emptyTitle =
    staffClients.length === 0
      ? 'Ortak danışan yok.'
      : 'Bu danışanlar için ekip sohbeti yok.';
  const emptyDescription =
    staffClients.length === 0
      ? 'Bir danışan hem koça hem diyetisyene atandığında burada görünür.'
      : 'Ekip sohbeti için danışanın koç ve diyetisyen ataması ile aktif paketi gerekir.';

  return (
    <PanelScaffold showBack subtitle="Koç ↔ Diyetisyen ↔ Doktor" title="Ekip Mesajları">
      {showInitialSpinner ? (
        <InlineSpinner fill />
      ) : showEmpty ? (
        <EmptyState
          description={emptyDescription}
          title={emptyTitle}
        />
      ) : (
        sortedClients.map((m, i) => {
          const thread = threads.find((t) => t.memberId === String(m.id));
          const peerName = collabPeerName(thread, role);
          const unread = thread ? collabUnreadForStaff(thread, role) : 0;
          return (
            <FadeIn delay={i * 40} key={String(m.id)}>
              <Pressable
                onPress={() =>
                  router.push(`/staff/messages/collab/${m.id}` as Href)
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
