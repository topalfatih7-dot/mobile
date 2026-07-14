import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConversationRow } from '@/components/messages/ConversationRow';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppContext';
import type { Conversation } from '@/data/messages';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { normalizeStaffRole, staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

type TabKey = 'clients' | 'admin' | 'collab';

function formatTime(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function StaffMessagesScreen() {
  const { staff, adminStaffThreads, staffCollabThreads, refresh: appRefresh } = useApp();
  const { inbox, syncing, refresh, unreadCount } = useStaffDashboard();
  const { horizontalPadding } = useResponsive();
  const [tab, setTab] = useState<TabKey>('clients');

  const role = normalizeStaffRole(staff?.role);

  const adminItems: Conversation[] = useMemo(
    () =>
      adminStaffThreads.map((t) => ({
        id: t.id,
        name: 'Yönetim',
        role: 'Admin',
        last: t.lastPreview || 'Henüz mesaj yok',
        time: formatTime(t.lastMessageAt),
        unread: t.staffUnread,
        online: true,
        gradient: gradients.brand,
      })),
    [adminStaffThreads],
  );

  const collabItems: Conversation[] = useMemo(
    () =>
      staffCollabThreads.map((t) => {
        const peerName = role === 'coach' ? t.dietitianName : t.coachName;
        const unread = role === 'coach' ? t.coachUnread : t.dietitianUnread;
        return {
          id: t.id,
          name: peerName || 'Ekip',
          role: `${t.memberName} · collab`,
          last: t.lastPreview || 'Henüz mesaj yok',
          time: formatTime(t.lastMessageAt),
          unread,
          online: false,
          gradient: gradients.violet,
        };
      }),
    [staffCollabThreads, role],
  );

  const onRefresh = async () => {
    await Promise.all([refresh(), appRefresh()]);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'clients', label: 'Danışanlar', count: unreadCount || undefined },
    {
      key: 'admin',
      label: 'Admin',
      count: adminItems.reduce((s, i) => s + i.unread, 0) || undefined,
    },
    {
      key: 'collab',
      label: 'Ekip',
      count: collabItems.reduce((s, i) => s + i.unread, 0) || undefined,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader subtitle={`${staffRoleLabel(staff?.role)} mesajları`} title="Mesajlar" />

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
              {t.count ? ` (${t.count})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl onRefresh={() => void onRefresh()} refreshing={syncing} tintColor={colors.brand[600]} />
        }
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {tab === 'clients' ? (
            inbox.length > 0 ? (
              inbox.map((item) => <ConversationRow item={item} key={item.id} />)
            ) : (
              <EmptyState
                subtitle="Danışanlarınızla mesajlaşmaya başladığınızda sohbetler burada görünür."
                title="Henüz mesaj yok"
              />
            )
          ) : null}

          {tab === 'admin' ? (
            adminItems.length > 0 ? (
              adminItems.map((item) => (
                <ConversationRow href={`/messages/admin/${item.id}`} item={item} key={item.id} />
              ))
            ) : (
              <EmptyState subtitle="Yönetim ile sohbet burada görünür." title="Admin sohbeti yok" />
            )
          ) : null}

          {tab === 'collab' ? (
            collabItems.length > 0 ? (
              collabItems.map((item) => (
                <ConversationRow href={`/messages/collab/${item.id}`} item={item} key={item.id} />
              ))
            ) : (
              <EmptyState
                subtitle="Ortak danışanlarınız için koç–diyetisyen sohbetleri burada."
                title="Ekip sohbeti yok"
              />
            )
          ) : null}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.ink[100],
  },
  tabActive: {
    backgroundColor: colors.brand[600],
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
});
