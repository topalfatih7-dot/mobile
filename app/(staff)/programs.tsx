import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { normalizeStaffRole } from '@/utils/staffAccess';
import { colors, fonts, spacing } from '@/constants/theme';

export default function StaffProgramsScreen() {
  const { staff } = useApp();
  const { programs } = useStaffDashboard();
  const role = normalizeStaffRole(staff?.role);

  useEffect(() => {
    if (role === 'dietitian') {
      router.replace('/(staff)/lists' as Href);
    }
  }, [role]);

  if (role === 'dietitian') return null;

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Oluşturduğunuz programlar" title="Programlar" />
      <View style={styles.body}>
        {programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id} padding={spacing.lg} style={styles.card}>
              <Text style={styles.type}>{program.type === 'nutrition' ? 'Beslenme' : 'Antrenman'}</Text>
              <Text style={styles.title}>{program.title || 'İsimsiz program'}</Text>
              <Text style={styles.meta}>{program.entries.length} madde</Text>
            </Card>
          ))
        ) : (
          <EmptyState
            subtitle="Danışanlarınız için oluşturduğunuz programlar burada listelenir."
            title="Henüz program yok"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  type: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.champagne[600],
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text.primary,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
});
