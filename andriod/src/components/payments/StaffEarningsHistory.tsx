import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import {
  STAFF_EARNING_STATUS,
  earningMeetingMeta,
  formatIstanbulDateTime,
  formatStaffPayoutPeriodLabel,
  formatStaffPayoutWindowLabel,
  formatStaffTry,
} from '@/data/staffPayouts';
import type { StaffEarningRow } from '@/services/staffEarnings';
import { colors, fonts, radius, spacing } from '@/theme';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    paid: { bg: colors.sage[50], fg: colors.sage[700] },
    approved: { bg: colors.brand[50], fg: colors.brand[700] },
    pending: { bg: colors.warm[100], fg: colors.warm[500] },
    reversed: { bg: colors.cream[100], fg: colors.cream[800] },
    rejected: { bg: colors.danger[50], fg: colors.danger[700] },
  };
  const tone = map[status] || map.pending;
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>
        {STAFF_EARNING_STATUS[status] || status}
      </Text>
    </View>
  );
}

function periodStatus(rows: StaffEarningRow[]) {
  if (rows.some((r) => r.status === 'pending')) return 'pending';
  if (rows.some((r) => r.status === 'approved')) return 'approved';
  if (rows.every((r) => r.status === 'paid')) return 'paid';
  return rows[0]?.status || 'pending';
}

export function StaffEarningsHistory({
  rows = [],
  members = [],
}: {
  rows?: StaffEarningRow[];
  members?: Record<string, unknown>[];
}) {
  const groups = (() => {
    const byPeriod = new Map<string, StaffEarningRow[]>();
    for (const row of rows) {
      const key = row.period_key || '—';
      if (!byPeriod.has(key)) byPeriod.set(key, []);
      byPeriod.get(key)!.push(row);
    }
    return [...byPeriod.entries()]
      .map(([id, items]) => {
        const sorted = [...items].sort((a, b) => {
          const am = earningMeetingMeta(a, members);
          const bm = earningMeetingMeta(b, members);
          return new Date(bm.startedAt || 0).getTime() - new Date(am.startedAt || 0).getTime();
        });
        return {
          id,
          periodLabel: formatStaffPayoutPeriodLabel(id),
          windowLabel: formatStaffPayoutWindowLabel(id),
          sessions: sorted,
          amount: sorted.reduce((s, r) => s + Number(r.amount_try || 0), 0),
          status: periodStatus(sorted),
        };
      })
      .sort((a, b) => String(b.id).localeCompare(String(a.id)));
  })();

  if (groups.length === 0) {
    return (
      <EmptyState
        description="Faturalandırılabilir video görüşmeler tamamlandıkça danışan ve tarih burada görünür."
        icon="wallet-outline"
        title="Henüz hakediş yok"
      />
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {groups.map((group, gi) => (
        <FadeIn key={group.id} delay={120 + gi * 30}>
          <View style={styles.group}>
            <View style={styles.groupHead}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.groupTitle}>Ödeme: {group.periodLabel}</Text>
                <Text style={styles.groupMeta}>
                  {group.windowLabel ? `${group.windowLabel} görüşmeleri · ` : ''}
                  {group.sessions.length} seans
                </Text>
              </View>
              <View style={styles.groupRight}>
                <Text style={styles.groupAmount}>{formatStaffTry(group.amount)}</Text>
                <StatusBadge status={group.status} />
              </View>
            </View>
            {group.sessions.map((row) => {
              const meeting = earningMeetingMeta(row, members);
              return (
                <View key={row.id} style={styles.sessionRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.memberName}>{meeting.memberName}</Text>
                    <Text style={styles.sessionMeta}>
                      {formatIstanbulDateTime(meeting.startedAt)}
                      {' · '}
                      {meeting.sessionTypeLabel}
                      {meeting.overlapMinutes ? ` · ${meeting.overlapMinutes} dk eşzamanlı` : ''}
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionAmount}>{formatStaffTry(row.amount_try)}</Text>
                    <StatusBadge status={row.status} />
                  </View>
                </View>
              );
            })}
          </View>
        </FadeIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  groupTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  groupMeta: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  groupRight: { alignItems: 'flex-end', gap: 6 },
  groupAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.cream[900],
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cream[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  memberName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.cream[900],
  },
  sessionMeta: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  sessionRight: { alignItems: 'flex-end', gap: 6 },
  sessionAmount: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
});
