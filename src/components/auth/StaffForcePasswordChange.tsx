import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Logo } from '@/components/brand/Logo';
import { useToast } from '@/context/ToastContext';
import { colors, fonts, radius, shadows, spacing } from '@/constants/theme';
import { isPasswordValid, PASSWORD_RULES } from '@/services/password';
import { supabase } from '@/services/supabaseClient';
import type { StaffProfile } from '@/types/session';

type Props = {
  staff: StaffProfile;
  onDone: () => void;
};

/**
 * Web StaffForcePasswordChange — geçici şifre ile ilk girişte zorunlu şifre değişimi
 * (docs/rn-migration/05 §5.2, 07 §11).
 */
export function StaffForcePasswordChange({ staff, onDone }: Props) {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstName = staff.name?.split(' ')[0] || '';

  const handleSubmit = async () => {
    if (!isPasswordValid(password)) {
      toast('Şifreniz tüm gereksinimleri karşılamalıdır.', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Şifreler eşleşmiyor.', 'error');
      return;
    }
    if (!supabase) {
      toast('Supabase yapılandırması eksik.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Web StaffShell: data JSONB içinde tempPasswordIssued temizlenir
      const { data: row, error: fetchError } = await supabase
        .from('staff')
        .select('data')
        .eq('id', staff.id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      const nextData = { ...((row?.data as Record<string, unknown>) || {}), tempPasswordIssued: false };
      const { error: staffError } = await supabase
        .from('staff')
        .update({ data: nextData })
        .eq('id', staff.id);
      if (staffError) throw staffError;

      toast('Şifreniz başarıyla güncellendi!', 'success');
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifre güncellenemedi, lütfen tekrar deneyin.';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Logo height={36} />
          </View>

          <View style={styles.iconWrap}>
            <Ionicons color={colors.white} name="shield-checkmark" size={32} />
          </View>

          <Text style={styles.title}>Şifrenizi Güncelleyin</Text>
          <Text style={styles.subtitle}>
            Merhaba{firstName ? ` ${firstName}` : ''}, ilk girişiniz olduğu için güvenli bir şifre
            belirlemeniz gerekmektedir.
          </Text>

          <View style={styles.rules}>
            <Text style={styles.rulesLabel}>Şifre gereksinimleri</Text>
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <View key={rule.label} style={styles.ruleRow}>
                  <Ionicons
                    color={ok ? colors.sage[600] : colors.ink[300]}
                    name="checkmark"
                    size={14}
                  />
                  <Text style={[styles.ruleText, ok && styles.ruleOk]}>{rule.label}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.label}>Yeni Şifre</Text>
          <View style={styles.inputRow}>
            <TextInput
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Yeni şifrenizi girin"
              placeholderTextColor={colors.ink[400]}
              secureTextEntry={!showPass}
              style={styles.input}
              value={password}
            />
            <Pressable hitSlop={8} onPress={() => setShowPass((v) => !v)}>
              <Ionicons color={colors.ink[500]} name={showPass ? 'eye-off' : 'eye'} size={18} />
            </Pressable>
          </View>

          <Text style={styles.label}>Şifre Tekrar</Text>
          <View style={styles.inputRow}>
            <TextInput
              autoComplete="new-password"
              onChangeText={setConfirm}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={colors.ink[400]}
              secureTextEntry={!showConfirm}
              style={styles.input}
              value={confirm}
            />
            <Pressable hitSlop={8} onPress={() => setShowConfirm((v) => !v)}>
              <Ionicons color={colors.ink[500]} name={showConfirm ? 'eye-off' : 'eye'} size={18} />
            </Pressable>
          </View>

          <Pressable disabled={loading} onPress={handleSubmit} style={styles.submit}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Şifreyi Kaydet</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 22, 32, 0.72)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.md },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[500],
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  rules: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  rulesLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ruleText: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink[400] },
  ruleOk: { color: colors.sage[600] },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
  },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand[600],
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
});
