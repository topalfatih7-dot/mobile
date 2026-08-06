/**
 * LOCK: docs/mobile/screens/admin/messages.md — admin↔staff real threads
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import {
  ensureAdminStaffThreads,
  subscribeAdminStaffChat,
  type AdminStaffThread,
} from '@/services/adminStaffChat';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

const ROLE_AVATAR: Record<string, { bg: string; fg: string }> = {
  coach: { bg: colors.brand[100], fg: colors.brand[700] },
  dietitian: { bg: colors.sage[100], fg: colors.sage[700] },
  doctor: { bg: colors.warm[100], fg: colors.warm[500] },
};

export default function AdminMessages() {
  const { loading, platform, staffById } = useData();
  const staffList = useMemo(
    () => (platform.staffList.length > 0 ? platform.staffList : Object.values(staffById)),
    [platform.staffList, staffById],
  );
  const [threads, setThreads] = useState<AdminStaffThread[]>([]);
  const [busy, setBusy] = useState(true);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const list = await ensureAdminStaffThreads(
        staffList.map((s) => ({
          id: String(s.id),
          name: String(s.name || ''),
          role: String(s.role || ''),
        })),
      );
      setThreads(list);
    } catch {
      setThreads([]);
    } finally {
      setBusy(false);
    }
  }, [staffList]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => subscribeAdminStaffChat(() => void reload()), [reload]);

  const sortedStaff = useMemo(() => {
    return staffList.slice().sort((a, b) => {
      const ta = threads.find((t) => t.staffId === String(a.id));
      const tb = threads.find((t) => t.staffId === String(b.id));
      const ua = Number(ta?.adminUnread || 0);
      const ub = Number(tb?.adminUnread || 0);
      if (ua !== ub) return ub - ua;
      const ma = ta?.lastMessageAt ? new Date(ta.lastMessageAt).getTime() : 0;
      const mb = tb?.lastMessageAt ? new Date(tb.lastMessageAt).getTime() : 0;
      if (ma !== mb) return mb - ma;
      return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
    });
  }, [staffList, threads]);

  return (
    <PanelScaffold showBack subtitle="Personel sohbetleri" title="Mesajlar">
      {(loading || busy) && staffList.length === 0 ? (
        <InlineSpinner fill />
      ) : staffList.length === 0 ? (
        <EmptyState title="Personel yok." />
      ) : (
        sortedStaff.map((s, i) => {
          const id = String(s.id);
          const role = String(s.role);
          const avatar = ROLE_AVATAR[role] || ROLE_AVATAR.coach;
          const thread = threads.find((t) => t.staffId === id);
          return (
            <FadeIn delay={i * 40} key={id}>
              <Pressable
                onPress={() => router.push(`/(admin)/messages/${id}` as Href)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
                  <Text style={[styles.avatarText, { color: avatar.fg }]}>
                    {String(s.name).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={styles.name}>
                      {String(s.name)}
                    </Text>
                    {thread?.lastMessageAt ? (
                      <Text style={styles.time}>
                        {formatRelativeTimeTr(thread.lastMessageAt)}
                      </Text>
                    ) : null}
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  </View>
                  <Text style={styles.role}>{ROLE_LABELS[role] || role}</Text>
                  {thread?.lastPreview ? (
                    <Text numberOfLines={1} style={styles.preview}>
                      {thread.lastPreview}
                    </Text>
                  ) : null}
                </View>
                {thread && thread.adminUnread > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{thread.adminUnread}</Text>
                  </View>
                ) : null}
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
  rowPressed: { opacity: 0.9 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16 },
  body: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[300] },
  role: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600], marginTop: 2 },
  preview: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
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
