import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  fetchCorporateApplications,
  fetchStaffApplications,
  resolveCorporateApplication,
  resolveStaffApplication,
  type CorporateApplication,
  type StaffApplication,
} from '@/services/db/applications';
import { staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminApplicationsScreen() {
  const [staffApps, setStaffApps] = useState<StaffApplication[]>([]);
  const [corpApps, setCorpApps] = useState<CorporateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([fetchStaffApplications(), fetchCorporateApplications()]);
      setStaffApps(s);
      setCorpApps(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingStaff = staffApps.filter((a) => a.status === 'pending');
  const pendingCorp = corpApps.filter((a) => a.status === 'pending' || a.status === 'new');

  return (
    <AdminPanelScreen subtitle="Bekleyen başvurular" title="Başvurular">
      {loading ? (
        <ActivityIndicator color={colors.teal[600]} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <Text style={styles.heading}>Kadro ({pendingStaff.length} bekleyen)</Text>
          {staffApps.length === 0 ? (
            <Text style={styles.empty}>Personel başvurusu yok.</Text>
          ) : (
            staffApps.map((app) => (
              <Card key={app.id} padding={spacing.md} style={styles.card}>
                <Text style={styles.name}>
                  {app.name} · {staffRoleLabel(app.role)}
                </Text>
                <Text style={styles.meta}>
                  {app.email} · {app.status}
                </Text>
                {app.status === 'pending' ? (
                  <View style={styles.row}>
                    <Button
                      label="Onayla"
                      loading={busyId === app.id}
                      onPress={() => {
                        void (async () => {
                          setBusyId(app.id);
                          try {
                            const r = await resolveStaffApplication(app, true);
                            if (!r.success) Alert.alert('Hata', r.error);
                            else {
                              Alert.alert(
                                'Onaylandı',
                                r.tempPassword
                                  ? `Geçici şifre: ${r.tempPassword}`
                                  : 'Personel hesabı oluşturuldu.',
                              );
                              await load();
                            }
                          } finally {
                            setBusyId(null);
                          }
                        })();
                      }}
                      size="sm"
                      style={styles.flex}
                    />
                    <Button
                      label="Reddet"
                      onPress={() => {
                        void (async () => {
                          setBusyId(app.id);
                          try {
                            const r = await resolveStaffApplication(app, false);
                            if (!r.success) Alert.alert('Hata', r.error);
                            else await load();
                          } finally {
                            setBusyId(null);
                          }
                        })();
                      }}
                      size="sm"
                      style={styles.flex}
                      variant="danger"
                    />
                  </View>
                ) : null}
              </Card>
            ))
          )}

          <Text style={[styles.heading, styles.top]}>Kurumsal ({pendingCorp.length} bekleyen)</Text>
          {corpApps.length === 0 ? (
            <Text style={styles.empty}>Kurumsal başvuru yok.</Text>
          ) : (
            corpApps.map((app) => (
              <Card key={app.id} padding={spacing.md} style={styles.card}>
                <Text style={styles.name}>{app.companyName}</Text>
                <Text style={styles.meta}>
                  {app.contactName} · {app.email} · {app.status}
                </Text>
                {app.status === 'pending' || app.status === 'new' ? (
                  <View style={styles.row}>
                    <Button
                      label="Onayla"
                      onPress={() => {
                        void (async () => {
                          const r = await resolveCorporateApplication(app, 'approved');
                          if (!r.success) Alert.alert('Hata', r.error);
                          else await load();
                        })();
                      }}
                      size="sm"
                      style={styles.flex}
                    />
                    <Button
                      label="Reddet"
                      onPress={() => {
                        void (async () => {
                          const r = await resolveCorporateApplication(app, 'rejected');
                          if (!r.success) Alert.alert('Hata', r.error);
                          else await load();
                        })();
                      }}
                      size="sm"
                      style={styles.flex}
                      variant="danger"
                    />
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </>
      )}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  top: { marginTop: spacing.xl },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.text.muted, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text.muted, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
