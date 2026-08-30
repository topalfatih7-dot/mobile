import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { changeAccountPassword } from '@/services/accountPassword';
import { sendPasswordReset } from '@/services/authPassword';
import { supabase } from '@/services/supabase';
import { isSocialAuthUser } from '@/utils/memberProfile';
import { isPasswordValid } from '@/utils/password';
import { colors, fonts, radius, spacing } from '@/theme';

const SOCIAL_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

type AuthLike = {
  identities?: { provider?: string }[];
  app_metadata?: { provider?: string };
};

export function PasswordChangeSection() {
  const { email } = useAuth();
  const { toast } = useToast();
  const [authUser, setAuthUser] = useState<AuthLike | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setAuthUser((data.user as AuthLike) || null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const socialOnly = isSocialAuthUser(authUser);
  const socialLabel = useMemo(() => {
    const identities = authUser?.identities || [];
    const provider = identities.find((i) => SOCIAL_LABELS[i.provider || ''])?.provider;
    return SOCIAL_LABELS[provider || ''] || 'sosyal hesap';
  }, [authUser]);

  const mismatch = Boolean(confirmPassword) && confirmPassword !== newPassword;
  const canSubmit = Boolean(
    currentPassword &&
      isPasswordValid(newPassword) &&
      confirmPassword === newPassword &&
      currentPassword !== newPassword &&
      !saving,
  );

  const handleSubmit = async () => {
    if (!currentPassword) {
      toast('Mevcut şifrenizi girin.', 'error');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast('Yeni şifre tüm gereksinimleri karşılamalı.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      toast('Yeni şifre mevcut şifreden farklı olmalı.', 'error');
      return;
    }
    setSaving(true);
    setDone(false);
    try {
      const result = await changeAccountPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        toast(result.error, 'error');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDone(true);
      toast('Şifreniz güncellendi.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const onForgot = async () => {
    if (email) {
      setSendingReset(true);
      try {
        const r = await sendPasswordReset(email);
        if (!r.success) {
          toast(r.error, 'error');
          return;
        }
        toast('Sıfırlama bağlantısı e-postanıza gönderildi.', 'success');
      } finally {
        setSendingReset(false);
      }
      return;
    }
    router.push('/(auth)/forgot-password' as Href);
  };

  if (socialOnly) {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>Şifre</Text>
        <Text style={styles.hint}>Girişiniz {socialLabel} ile; bu hesapta e-posta şifresi yok.</Text>
        <Pressable onPress={() => void onForgot()}>
          <Text style={styles.link}>Şifre belirleme bağlantısı gönder</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Şifre değiştir</Text>
      {done ? (
        <View style={styles.doneRow}>
          <Ionicons color={colors.sage[700]} name="checkmark-circle" size={14} />
          <Text style={styles.doneText}>Şifreniz güncellendi.</Text>
        </View>
      ) : null}
      <TextField
        autoComplete="password"
        label="Mevcut şifre"
        onChangeText={(v) => {
          setCurrentPassword(v);
          setDone(false);
        }}
        placeholder="Şu anki şifreniz"
        secureTextEntry
        value={currentPassword}
      />
      <TextField
        autoComplete="password-new"
        label="Yeni şifre"
        onChangeText={(v) => {
          setNewPassword(v);
          setDone(false);
        }}
        placeholder="Yeni şifrenizi girin"
        secureTextEntry
        value={newPassword}
      />
      {newPassword ? <PasswordRules password={newPassword} /> : null}
      <TextField
        autoComplete="password-new"
        error={mismatch ? 'Şifreler eşleşmiyor.' : undefined}
        label="Yeni şifre (tekrar)"
        onChangeText={(v) => {
          setConfirmPassword(v);
          setDone(false);
        }}
        placeholder="Yeni şifreyi tekrar girin"
        secureTextEntry
        value={confirmPassword}
      />
      <Button
        disabled={!canSubmit}
        label={saving ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
        loading={saving}
        onPress={() => void handleSubmit()}
      />
      <Pressable disabled={sendingReset} onPress={() => void onForgot()}>
        <Text style={styles.forgot}>
          Şifrenizi hatırlamıyor musunuz?{' '}
          <Text style={styles.link}>Sıfırlama bağlantısı alın</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cream[100],
    backgroundColor: colors.cream[50],
    padding: 14,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
    opacity: 0.75,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.sage[700],
  },
  forgot: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
  },
  link: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[700],
  },
});
