import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
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

const DAY_NAMES: Record<string, string> = {
  '1': 'Pazartesi',
  '2': 'Salı',
  '3': 'Çarşamba',
  '4': 'Perşembe',
  '5': 'Cuma',
  '6': 'Cumartesi',
  '0': 'Pazar',
};

const WEEKDAYS = ['1', '2', '3', '4', '5'];

function availabilitySummary(availability: unknown): string {
  const record = (availability as Record<string, string[]>) || {};
  const days = Object.keys(record)
    .filter((d) => Array.isArray(record[d]) && record[d].length > 0)
    .sort();
  if (days.length === WEEKDAYS.length && WEEKDAYS.every((d) => days.includes(d))) {
    return 'Hafta içi müsait';
  }
  return `${days.map((d) => DAY_NAMES[d]).filter(Boolean).join(', ')} müsait`;
}

/** LOCK: docs/mobile/screens/admin/staff.md */
export default function AdminStaff() {
  const { loading, platform, staffById } = useData();
  const list =
    platform.staffList.length > 0 ? platform.staffList : Object.values(staffById);

  return (
    <PanelScaffold showBack subtitle="Aktif personel" title="Personel">
      {loading && list.length === 0 ? (
        <InlineSpinner fill />
      ) : list.length === 0 ? (
        <EmptyState title="Personel yok." />
      ) : (
        list.map((s, i) => {
          const role = String(s.role);
          const avatar = ROLE_AVATAR[role] || ROLE_AVATAR.coach;
          return (
            <FadeIn delay={i * 40} key={String(s.id)}>
              <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
                  <Text style={[styles.avatarText, { color: avatar.fg }]}>
                    {String(s.name).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.topRow}>
                    <Text numberOfLines={1} style={styles.name}>
                      {String(s.name)}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Aktif</Text>
                    </View>
                  </View>
                  <Text style={styles.role}>{ROLE_LABELS[role] || role}</Text>
                  <Text style={styles.availability}>{availabilitySummary(s.availability)}</Text>
                </View>
              </View>
            </FadeIn>
          );
        })
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16 },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  badge: {
    backgroundColor: colors.sage[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.sage[700] },
  role: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  availability: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 4 },
});
