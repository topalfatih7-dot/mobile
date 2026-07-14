import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { SettingsToggleRow } from '@/components/profile/SettingsToggleRow';
import { VerificationSection } from '@/components/profile/VerificationSection';
import { Card } from '@/components/ui/Card';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { isOneSignalConfigured } from '@/services/oneSignal';
import {
  getExpoPushToken,
  requestPushPermissions,
  type MemberSettings,
} from '@/services/pushNotifications';
import { colors, fonts, spacing } from '@/constants/theme';

const TOGGLE_ROWS: { key: keyof MemberSettings; label: string; description: string }[] = [
  {
    key: 'emailNotifs',
    label: 'E-posta bildirimleri',
    description: 'Önemli güncellemeler e-posta ile gönderilir.',
  },
  {
    key: 'pushNotifs',
    label: 'Push bildirimleri',
    description: 'Anlık mesaj ve seans bildirimleri cihazınıza gelir.',
  },
  {
    key: 'reminderNotifs',
    label: 'Hatırlatıcılar',
    description: 'Yaklaşan seanslar için yerel hatırlatma.',
  },
];

export default function ProfileSettingsScreen() {
  const { memberSettings, updateSettings } = useApp();
  const { horizontalPadding } = useResponsive();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const onToggle = async (key: keyof MemberSettings, value: boolean) => {
    setBusyKey(key);
    setStatus('');
    try {
      if (key === 'pushNotifs' && value) {
        if (!Device.isDevice) {
          setStatus('Push bildirimleri fiziksel cihazda test edilir.');
        } else {
          const granted = await requestPushPermissions();
          if (!granted) {
            setStatus('Bildirim izni verilmedi. Ayarlardan açabilirsiniz.');
            return;
          }
          const token = await getExpoPushToken();
          if (token) {
            await updateSettings({ pushNotifs: true }, { pushToken: token });
            setStatus('Push bildirimleri etkin.');
            return;
          }
        }
      }

      const result = await updateSettings({ [key]: value });
      if (!result.success) {
        setStatus(result.error || 'Ayar kaydedilemedi.');
        return;
      }
      if (key === 'pushNotifs' && !value) {
        setStatus('Push bildirimleri kapatıldı.');
      }
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Bildirim ve tercihleriniz" title="Ayarlar" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <Card padding={0}>
            {TOGGLE_ROWS.map((row) => (
              <SettingsToggleRow
                key={row.key}
                description={row.description}
                disabled={busyKey === row.key}
                label={row.label}
                onValueChange={(value) => void onToggle(row.key, value)}
                value={!!memberSettings[row.key]}
              />
            ))}
          </Card>

          {busyKey ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color={colors.brand[600]} size="small" />
              <Text style={styles.status}>Kaydediliyor…</Text>
            </View>
          ) : status ? (
            <Text style={styles.status}>{status}</Text>
          ) : null}

          <VerificationSection />

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Push altyapısı</Text>
            <Text style={styles.noteBody}>
              {Device.isDevice
                ? 'Expo push token cihazınıza kaydedilir. Tam uzaktan push için EAS build gerekir.'
                : 'Simülatörde push test edilemez; fiziksel cihaz kullanın.'}
            </Text>
            {isOneSignalConfigured() ? (
              <Text style={styles.noteBody}>
                OneSignal App ID tanımlı — native SDK için development build oluşturun.
              </Text>
            ) : null}
          </View>
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
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  note: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  noteTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brand[800],
    marginBottom: 6,
  },
  noteBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
