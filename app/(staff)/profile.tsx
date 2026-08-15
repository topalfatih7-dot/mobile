/**
 * LOCK: docs/mobile/screens/staff/profile.md
 * Web: StaffSelfProfilePage + StaffProfileEditor
 */
import { Text, StyleSheet } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { StaffProfileEditor } from '@/components/staff/StaffProfileEditor';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/theme';

export default function StaffProfile() {
  const { staff, email, refreshAuth } = useAuth();
  const name = String(staff?.name || 'Personel');

  if (!staff) {
    return (
      <PanelScaffold subtitle="Oturum" title="Profilim">
        <Text style={styles.empty}>Personel profili yüklenemedi.</Text>
      </PanelScaffold>
    );
  }

  return (
    <PanelScaffold subtitle={name} title="Profilim">
      <StaffProfileEditor
        email={email}
        onSaved={async () => {
          await refreshAuth();
        }}
        staffUser={staff}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
});
