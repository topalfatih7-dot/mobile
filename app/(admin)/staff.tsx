import { StyleSheet, Text, View } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminStaffScreen() {
  const { staffDirectory } = useApp();

  return (
    <AdminPanelScreen
      emptySubtitle="Personel dizini henüz yüklenmedi."
      emptyTitle="Kadro boş"
      subtitle="Aktif personel"
      title="Kadromuz">
      {staffDirectory.length > 0 ? (
        <View>
          {staffDirectory.map((person) => (
            <Card key={person.id} padding={spacing.md} style={styles.card}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.role}>{staffRoleLabel(person.role)}</Text>
              <Text style={styles.email}>{person.email}</Text>
            </Card>
          ))}
        </View>
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  name: { fontFamily: fonts.display, fontSize: 15.5, color: colors.text.primary },
  role: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.teal[600], marginTop: 2 },
  email: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text.muted, marginTop: 2 },
});
