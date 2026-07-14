import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicTeamProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staffDirectory } = useApp();
  const person = staffDirectory.find((s) => s.id === id);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack title={person?.name || 'Uzman'} />
      <View style={styles.body}>
        {person ? (
          <Card padding={spacing.lg}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.role}>{staffRoleLabel(person.role)}</Text>
            {person.bio || person.title ? (
              <Text style={styles.bio}>{String(person.bio || person.title)}</Text>
            ) : (
              <Text style={styles.bio}>
                {staffRoleLabel(person.role)} olarak Yeni Form ekibinde yer alıyor.
              </Text>
            )}
          </Card>
        ) : (
          <EmptyState subtitle="Bu uzman profili bulunamadı." title="Profil yok" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  name: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.text.primary },
  role: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.champagne[600],
    marginTop: spacing.sm,
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    lineHeight: 23,
  },
});
