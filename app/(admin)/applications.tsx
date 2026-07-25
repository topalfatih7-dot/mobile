import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { colors, fonts, radius, spacing } from '@/theme';

const TABS = [
  { id: 'staff', label: 'Personel' },
  { id: 'corporate', label: 'Kurumsal' },
  { id: 'contact', label: 'İletişim' },
] as const;

const KIND_LABELS: Record<string, string> = {
  staff: 'Personel',
  corporate: 'Kurumsal',
  contact: 'İletişim',
};

type LocalStatus = 'approved' | 'rejected';

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: 'Bekliyor', bg: colors.warm[100], color: colors.warm[500] },
  reviewed: { label: 'İncelendi', bg: colors.brand[100], color: colors.brand[700] },
  approved: { label: 'Onaylandı', bg: colors.sage[100], color: colors.sage[700] },
  rejected: { label: 'Reddedildi', bg: colors.cream[200], color: colors.cream[800] },
};

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays <= 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  return d.toLocaleDateString('tr-TR');
}

/** LOCK: docs/mobile/screens/admin/applications.md */
export default function AdminApplications() {
  const { toast } = useToast();
  const { loading, platform } = useData();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('staff');
  const [decisions, setDecisions] = useState<Record<string, LocalStatus>>({});

  const allApps = useMemo(
    () => [
      ...platform.staffApplications,
      ...platform.corporateApplications,
      ...platform.contactInquiries,
    ],
    [
      platform.staffApplications,
      platform.corporateApplications,
      platform.contactInquiries,
    ],
  );

  const list = allApps.filter((a) => String(a.kind) === tab);

  const decide = (id: string, decision: LocalStatus) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    toast(decision === 'approved' ? 'Başvuru onaylandı.' : 'Başvuru reddedildi.', 'success');
  };

  return (
    <PanelScaffold showBack subtitle="Başvuru kuyruğu" title="Başvurular">
      {loading && allApps.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const count = allApps.filter((a) => String(a.kind) === t.id).length;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.tab, tab === t.id && styles.tabOn]}>
                  <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>
                    {t.label}
                    <Text style={styles.tabCount}> · {count}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FadeIn key={tab} style={styles.list}>
            {list.map((a) => {
              const id = String(a.id);
              const status: string = decisions[id] ?? String(a.status || 'pending');
              const badge = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
              const showActions = tab === 'staff' && status === 'pending';
              return (
                <View key={id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name}>{String(a.name || '')}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {KIND_LABELS[String(a.kind)] ?? String(a.kind)} ·{' '}
                    {relativeDate(String(a.createdAt || new Date().toISOString()))}
                  </Text>
                  {showActions ? (
                    <View style={styles.actions}>
                      <Pressable onPress={() => decide(id, 'approved')} style={styles.approve}>
                        <Text style={styles.approveText}>Onayla</Text>
                      </Pressable>
                      <Pressable onPress={() => decide(id, 'rejected')} style={styles.reject}>
                        <Text style={styles.rejectText}>Reddet</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {!loading && list.length === 0 ? (
              <EmptyState
                icon="file-tray-outline"
                iconBg={colors.cream[100]}
                iconColor={colors.cream[300]}
                title="Bu sekmede başvuru yok."
              />
            ) : null}
          </FadeIn>
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  tabText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  tabTextOn: { color: colors.white },
  tabCount: { fontSize: 11 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  approve: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.white },
  reject: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.warm[500] },
});
