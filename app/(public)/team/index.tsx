import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { normalizeStaffRole, staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, spacing } from '@/constants/theme';

type RoleFilter = 'all' | 'coach' | 'dietitian' | 'doctor';

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'coach', label: 'Koçlar' },
  { id: 'dietitian', label: 'Diyetisyenler' },
  { id: 'doctor', label: 'Doktorlar' },
];

export default function PublicTeamIndexScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const { staffDirectory } = useApp();
  const initial: RoleFilter =
    roleParam === 'coaches' || roleParam === 'coach'
      ? 'coach'
      : roleParam === 'dietitians' || roleParam === 'dietitian'
        ? 'dietitian'
        : roleParam === 'doctors' || roleParam === 'doctor'
          ? 'doctor'
          : 'all';
  const [filter, setFilter] = useState<RoleFilter>(initial);

  const list = useMemo(() => {
    return staffDirectory.filter((person) => {
      if (person.active === false) return false;
      if (filter === 'all') return true;
      return normalizeStaffRole(person.role) === filter;
    });
  }, [staffDirectory, filter]);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Uzman kadromuz" title="Ekip" />
      <View style={styles.body}>
        <View style={styles.chips}>
          {FILTERS.map((item) => (
            <Chip
              key={item.id}
              active={filter === item.id}
              label={item.label}
              onPress={() => setFilter(item.id)}
            />
          ))}
        </View>

        {list.length > 0 ? (
          list.map((person) => (
            <Card
              key={person.id}
              onPress={() => router.push(`/(public)/team/${person.id}` as Href)}
              padding={spacing.lg}
              style={styles.card}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.role}>{staffRoleLabel(person.role)}</Text>
            </Card>
          ))
        ) : (
          <EmptyState subtitle="Seçili rol için personel bulunamadı." title="Kadro boş" />
        )}

        <Button
          label="Ekibe başvur"
          onPress={() => router.push('/(public)/team/apply' as Href)}
          style={styles.apply}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: { marginBottom: spacing.sm },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.text.primary },
  role: { fontFamily: fonts.semibold, fontSize: 13, color: colors.teal[600], marginTop: 4 },
  apply: { marginTop: spacing.xl },
});
