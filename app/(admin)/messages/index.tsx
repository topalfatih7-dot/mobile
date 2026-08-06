/**
 * LOCK: docs/mobile/screens/admin/messages.md — admin↔staff real threads
 * 4 tabs: Admin-Staff | Üye-Danışman Denetimi | Koç-Diyetisyen İşbirliği | Genel
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';
import { type StaffCollabThread } from '@/services/staffCollabChat';
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

type MemberStaffAuditThread = {
  id: string;
  memberId: string;
  staffId: string;
  staffRole: string;
  memberName: string;
  staffName: string;
  lastPreview: string;
  lastMessageAt: string | null;
};

async function fetchAllMemberStaffThreads(): Promise<MemberStaffAuditThread[]> {
  if (isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('chat_threads')
    .select('id, member_id, staff_id, staff_role, last_message_at, data')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) return [];
  return (data || []).map((r) => {
    const d = (r.data as Record<string, unknown>) || {};
    return {
      id: String(r.id),
      memberId: String(r.member_id || ''),
      staffId: String(r.staff_id || ''),
      staffRole: String(r.staff_role || ''),
      memberName: String(d.memberName || 'Üye'),
      staffName: String(d.staffName || 'Danışman'),
      lastPreview: String(d.lastPreview || ''),
      lastMessageAt: r.last_message_at ? String(r.last_message_at) : null,
    };
  });
}

async function fetchAllCollabThreads(): Promise<StaffCollabThread[]> {
  if (isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('staff_collab_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) return [];
  return (data || []).map((r) => {
    const d = (r.data as Record<string, unknown>) || {};
    return {
      id: String(r.id),
      memberId: String(r.member_id || ''),
      coachId: String(r.coach_id || ''),
      dietitianId: String(r.dietitian_id || ''),
      lastMessageAt: r.last_message_at ? String(r.last_message_at) : null,
      memberName: String(d.memberName || 'Danışan'),
      coachName: String(d.coachName || 'Koç'),
      dietitianName: String(d.dietitianName || 'Diyetisyen'),
      lastPreview: String(d.lastPreview || ''),
      coachUnread: Number(d.coachUnread || 0),
      dietitianUnread: Number(d.dietitianUnread || 0),
      createdAt: String(r.created_at || ''),
      data: d,
    };
  });
}

const TABS = [
  { id: 'admin-staff', label: 'Admin ↔ Personel' },
  { id: 'audit', label: 'Üye-Danışman' },
  { id: 'collab', label: 'Koç-Diyetisyen' },
  { id: 'summary', label: 'Genel' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminMessages() {
  const { loading, platform, staffById } = useData();
  const staffList = useMemo(
    () => (platform.staffList.length > 0 ? platform.staffList : Object.values(staffById)),
    [platform.staffList, staffById],
  );

  const [activeTab, setActiveTab] = useState<TabId>('admin-staff');
  const [threads, setThreads] = useState<AdminStaffThread[]>([]);
  const [auditThreads, setAuditThreads] = useState<MemberStaffAuditThread[]>([]);
  const [collabThreads, setCollabThreads] = useState<StaffCollabThread[]>([]);
  const [busy, setBusy] = useState(true);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const [adminStaff, audit, collab] = await Promise.all([
        ensureAdminStaffThreads(
          staffList.map((s) => ({
            id: String(s.id),
            name: String(s.name || ''),
            role: String(s.role || ''),
          })),
        ),
        fetchAllMemberStaffThreads(),
        fetchAllCollabThreads(),
      ]);
      setThreads(adminStaff);
      setAuditThreads(audit);
      setCollabThreads(collab);
    } catch {
      setThreads([]);
      setAuditThreads([]);
      setCollabThreads([]);
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

  const totalAuditThreads = auditThreads.length;
  const totalCollabThreads = collabThreads.length;

  return (
    <PanelScaffold showBack subtitle="Sohbet denetimi" title="Mesajlar">
      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tab, activeTab === t.id && styles.tabOn]}>
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextOn]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {(loading || busy) ? (
        <InlineSpinner fill />
      ) : activeTab === 'admin-staff' ? (
        /* Tab 1: Admin ↔ Staff */
        staffList.length === 0 ? (
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
        )
      ) : activeTab === 'audit' ? (
        /* Tab 2: Üye-Danışman Denetimi (read-only) */
        auditThreads.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="Üye-danışman görüşmesi yok." />
        ) : (
          auditThreads.map((t, i) => (
            <FadeIn delay={i * 30} key={t.id}>
              <Pressable
                onPress={() =>
                  router.push(`/(admin)/messages/audit/${t.id}` as Href)
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.avatar, { backgroundColor: colors.brand[50] }]}>
                  <Ionicons color={colors.brand[600]} name="person" size={20} />
                </View>
                <View style={styles.body}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={styles.name}>
                      {t.memberName}
                    </Text>
                    {t.lastMessageAt ? (
                      <Text style={styles.time}>
                        {formatRelativeTimeTr(t.lastMessageAt)}
                      </Text>
                    ) : null}
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  </View>
                  <Text style={styles.role}>
                    {t.staffName} · {ROLE_LABELS[t.staffRole] || t.staffRole}
                  </Text>
                  {t.lastPreview ? (
                    <Text numberOfLines={1} style={styles.preview}>
                      {t.lastPreview}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyText}>Denetim</Text>
                </View>
              </Pressable>
            </FadeIn>
          ))
        )
      ) : activeTab === 'collab' ? (
        /* Tab 3: Koç-Diyetisyen İşbirliği (read-only) */
        collabThreads.length === 0 ? (
          <EmptyState icon="people-outline" title="Koç-diyetisyen görüşmesi yok." />
        ) : (
          collabThreads.map((t, i) => (
            <FadeIn delay={i * 30} key={t.id}>
              <Pressable
                onPress={() =>
                  router.push(`/(admin)/messages/audit/${t.id}?kind=collab` as Href)
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.avatar, { backgroundColor: colors.sage[50] }]}>
                  <Ionicons color={colors.sage[700]} name="people" size={20} />
                </View>
                <View style={styles.body}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={styles.name}>
                      {t.memberName}
                    </Text>
                    {t.lastMessageAt ? (
                      <Text style={styles.time}>
                        {formatRelativeTimeTr(t.lastMessageAt)}
                      </Text>
                    ) : null}
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  </View>
                  <Text style={styles.role}>
                    {t.coachName} (Koç) · {t.dietitianName} (Diyetisyen)
                  </Text>
                  {t.lastPreview ? (
                    <Text numberOfLines={1} style={styles.preview}>
                      {t.lastPreview}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.readOnlyBadge, { backgroundColor: colors.sage[100] }]}>
                  <Text style={[styles.readOnlyText, { color: colors.sage[700] }]}>
                    İşbirliği
                  </Text>
                </View>
              </Pressable>
            </FadeIn>
          ))
        )
      ) : (
        /* Tab 4: Genel özet */
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.brand[50] }]}>
              <Ionicons color={colors.brand[600]} name="chatbubbles" size={22} />
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.summaryTitle}>Admin ↔ Personel</Text>
              <Text style={styles.summaryCount}>{staffList.length} personel</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.warm[50] }]}>
              <Ionicons color={colors.warm[500]} name="eye" size={22} />
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.summaryTitle}>Üye-Danışman Denetimi</Text>
              <Text style={styles.summaryCount}>{totalAuditThreads} aktif görüşme</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.sage[50] }]}>
              <Ionicons color={colors.sage[700]} name="people" size={22} />
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.summaryTitle}>Koç-Diyetisyen İşbirliği</Text>
              <Text style={styles.summaryCount}>{totalCollabThreads} işbirliği görüşmesi</Text>
            </View>
          </View>
        </View>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flexGrow: 0, marginBottom: spacing.md },
  tabRow: { flexDirection: 'row', gap: 8, paddingRight: spacing.md },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  tabOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  tabText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  tabTextOn: { color: colors.white },
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
  readOnlyBadge: {
    backgroundColor: colors.warm[100],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readOnlyText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.warm[500] },
  summaryCard: { gap: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: { flex: 1 },
  summaryTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  summaryCount: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
});
