import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { DEFAULT_COUNTRY_ISO } from '@/data/countryCodes';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export function VerificationSection() {
  const {
    member,
    verificationStatus,
    sendEmailVerification,
    confirmEmailVerification,
    sendPhoneVerification,
    confirmPhoneVerification,
    refreshVerification,
  } = useApp();

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneDraft, setPhoneDraft] = useState((member?.phone as string) || '');
  const [phoneViaEmail, setPhoneViaEmail] = useState(false);

  const status = useMemo(() => verificationStatus, [verificationStatus]);

  if (!status) return null;

  const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string; message?: string; viaEmail?: boolean }>) => {
    setBusy(key);
    setMessage('');
    try {
      const res = await fn();
      if (!res.success) {
        setMessage(res.error || 'İşlem başarısız.');
        return;
      }
      if ('viaEmail' in res && res.viaEmail) setPhoneViaEmail(true);
      setMessage(res.message || 'Tamamlandı.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card padding={spacing.md} style={styles.card}>
      <Text style={styles.title}>Hesap doğrulama</Text>
      <Text style={styles.subtitle}>E-posta ve telefon doğrulama durumunuz.</Text>

      <View style={styles.row}>
        <Ionicons
          color={status.emailVerified ? colors.success : colors.ink[300]}
          name={status.emailVerified ? 'checkmark-circle' : 'mail-outline'}
          size={20}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>E-posta</Text>
          <Text style={styles.rowValue}>{status.email || '—'}</Text>
          <Text style={styles.badge}>{status.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}</Text>
        </View>
      </View>

      {!status.emailVerified ? (
        <View style={styles.actions}>
          <Pressable
            disabled={!!busy}
            onPress={() => void run('email-send', () => sendEmailVerification())}
            style={styles.btn}>
            {busy === 'email-send' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Doğrulama e-postası gönder</Text>
            )}
          </Pressable>
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setEmailCode}
            placeholder="E-postadaki kod (opsiyonel)"
            placeholderTextColor={colors.ink[300]}
            style={styles.input}
            value={emailCode}
          />
          <Pressable
            disabled={!!busy || !emailCode.trim()}
            onPress={() => void run('email-confirm', () => confirmEmailVerification(emailCode))}
            style={[styles.btn, styles.btnSecondary]}>
            {busy === 'email-confirm' ? (
              <ActivityIndicator color={colors.brand[700]} size="small" />
            ) : (
              <Text style={styles.btnSecondaryText}>Kodu doğrula</Text>
            )}
          </Pressable>
          <Pressable
            disabled={!!busy}
            onPress={() => void run('email-refresh', () => refreshVerification())}
            style={styles.linkBtn}>
            <Text style={styles.linkText}>Durumu yenile</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.row, styles.rowTop]}>
        <Ionicons
          color={status.phoneVerified ? colors.success : colors.ink[300]}
          name={status.phoneVerified ? 'checkmark-circle' : 'call-outline'}
          size={20}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>Telefon</Text>
          <Text style={styles.rowValue}>{status.phone || '—'}</Text>
          <Text style={styles.badge}>{status.phoneVerified ? 'Doğrulandı' : 'Doğrulanmadı'}</Text>
        </View>
      </View>

      {!status.phoneVerified ? (
        <View style={styles.actions}>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={setPhoneDraft}
            placeholder="Telefon (05xx…)"
            placeholderTextColor={colors.ink[300]}
            style={styles.input}
            value={phoneDraft}
          />
          <Pressable
            disabled={!!busy || !phoneDraft.trim()}
            onPress={() =>
              void run('phone-send', () => sendPhoneVerification(phoneDraft, DEFAULT_COUNTRY_ISO))
            }
            style={styles.btn}>
            {busy === 'phone-send' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.btnText}>SMS / doğrulama gönder</Text>
            )}
          </Pressable>
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setPhoneCode}
            placeholder="Doğrulama kodu"
            placeholderTextColor={colors.ink[300]}
            style={styles.input}
            value={phoneCode}
          />
          <Pressable
            disabled={!!busy || !phoneCode.trim()}
            onPress={() =>
              void run('phone-confirm', () =>
                confirmPhoneVerification(phoneCode, phoneDraft, DEFAULT_COUNTRY_ISO, phoneViaEmail),
              )
            }
            style={[styles.btn, styles.btnSecondary]}>
            {busy === 'phone-confirm' ? (
              <ActivityIndicator color={colors.brand[700]} size="small" />
            ) : (
              <Text style={styles.btnSecondaryText}>Telefonu doğrula</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  rowTop: {
    marginTop: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
  },
  badge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.brand[700],
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  btn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
  btnSecondary: {
    backgroundColor: colors.brand[50],
  },
  btnSecondaryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brand[700],
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.brand[600],
  },
  message: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
});
