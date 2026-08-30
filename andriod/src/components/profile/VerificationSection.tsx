import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { PhoneField } from '@/components/ui/PhoneField';
import { env } from '@/config/env';
import { useToast } from '@/context/ToastContext';
import { DEFAULT_COUNTRY_ISO } from '@/data/countryCodes';
import type { MemberRecord } from '@/services/mappers';
import type { VerificationResult, VerificationStatus } from '@/services/authVerification';
import { colors, fonts, radius, spacing } from '@/theme';

function StatusBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <View style={[styles.badge, styles.badgeOk]}>
        <Ionicons color={colors.sage[700]} name="checkmark-circle" size={14} />
        <Text style={styles.badgeOkText}>Doğrulandı</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeWarn]}>
      <Ionicons color={colors.warm[500]} name="alert-circle" size={14} />
      <Text style={styles.badgeWarnText}>Doğrulanmadı</Text>
    </View>
  );
}

type Props = {
  user: MemberRecord;
  verificationStatus?: VerificationStatus | null;
  onSendEmailVerification: () => Promise<VerificationResult>;
  onConfirmEmailVerification: (code: string) => Promise<VerificationResult>;
  onSendPhoneVerification: (
    phone: string,
    countryIso: string,
  ) => Promise<VerificationResult>;
  onConfirmPhoneVerification: (
    code: string,
    phone: string,
    countryIso: string,
    viaEmail: boolean,
  ) => Promise<VerificationResult>;
  onRefresh?: () => Promise<void>;
  onRefreshStatus?: () => Promise<VerificationResult>;
};

/** Web VerificationSection parity. */
export function VerificationSection({
  user,
  verificationStatus,
  onSendEmailVerification,
  onConfirmEmailVerification,
  onSendPhoneVerification,
  onConfirmPhoneVerification,
  onRefresh,
  onRefreshStatus,
}: Props) {
  const { toast } = useToast();
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phone, setPhone] = useState(String(user?.phone || ''));
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [emailStep, setEmailStep] = useState(false);
  const [showEmailCode, setShowEmailCode] = useState(false);
  const [phoneStep, setPhoneStep] = useState(false);
  const [phoneViaEmail, setPhoneViaEmail] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setPhone(String(user?.phone || ''));
  }, [user?.phone]);

  const status = verificationStatus || {
    email: String(user?.email || ''),
    phone: String(user?.phone || ''),
    emailVerified: Boolean(user?.emailVerifiedAt),
    phoneVerified: Boolean(user?.phoneVerifiedAt),
    authPhone: '',
    canVerifyEmail: Boolean(user?.email),
    canVerifyPhone: Boolean(user?.phone),
  };

  const handleSendEmail = async () => {
    setLoading('email-send');
    try {
      const res = await onSendEmailVerification();
      if (res?.success === false) {
        toast(res.error || 'E-posta gönderilemedi', 'error');
        return;
      }
      setEmailStep(true);
      toast(res?.message || 'Doğrulama bağlantısı e-postanıza gönderildi', 'success');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmEmail = async () => {
    setLoading('email-confirm');
    try {
      const res = await onConfirmEmailVerification(emailCode);
      if (res?.success === false) {
        toast(res.error || 'Kod doğrulanamadı', 'error');
        return;
      }
      setEmailStep(false);
      setShowEmailCode(false);
      setEmailCode('');
      toast('E-posta adresiniz doğrulandı', 'success');
      await onRefresh?.();
    } finally {
      setLoading(null);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading('refresh');
    try {
      const res = await (onRefreshStatus ? onRefreshStatus() : onRefresh?.());
      if (res && 'success' in res && res.success) {
        toast('Doğrulama durumu güncellendi', 'success');
        await onRefresh?.();
      } else {
        toast(
          (res && 'error' in res && res.error) ||
            'Henüz doğrulanmadı. Bağlantıya tıkladıktan sonra tekrar deneyin.',
          'info',
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSendPhone = async () => {
    setLoading('phone-send');
    try {
      const res = await onSendPhoneVerification(phone, countryIso);
      if (res?.success === false) {
        toast(res.error || 'Kod gönderilemedi', 'error');
        return;
      }
      setPendingPhone(res.phone || phone);
      setPhoneViaEmail(!!res.viaEmail);
      setPhoneStep(true);
      toast(
        res?.message ||
          (res.viaEmail ? 'Bağlantı e-postanıza gönderildi' : 'SMS kodu gönderildi'),
        'success',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmPhone = async () => {
    setLoading('phone-confirm');
    try {
      const res = await onConfirmPhoneVerification(
        phoneCode,
        phone,
        countryIso,
        phoneViaEmail,
      );
      if (res?.success === false) {
        toast(res.error || 'Kod doğrulanamadı', 'error');
        return;
      }
      setPhoneStep(false);
      setPhoneCode('');
      toast('Telefon numaranız doğrulandı', 'success');
      await onRefresh?.();
    } finally {
      setLoading(null);
    }
  };

  return (
    <ProfileSectionCard
      accent="sage"
      delay={180}
      icon="shield-checkmark"
      subtitle="E-posta adresinizi doğrulayarak hesabınızı güvence altına alın"
      title="Hesap Doğrulama">
      <View style={styles.stack}>
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowLabel}>
                <Ionicons color={colors.brand[500]} name="mail" size={16} />
                <Text style={styles.blockTitle}>E-posta</Text>
              </View>
              <Text numberOfLines={1} style={styles.blockMeta}>
                {status.email}
              </Text>
            </View>
            <StatusBadge verified={status.emailVerified} />
          </View>

          {!status.emailVerified ? (
            <View style={styles.actions}>
              {!emailStep ? (
                <Pressable
                  disabled={loading === 'email-send'}
                  onPress={() => void handleSendEmail()}
                  style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>
                    {loading === 'email-send'
                      ? 'Gönderiliyor…'
                      : 'Doğrulama Bağlantısı Gönder'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.actions}>
                  <Text style={styles.infoBox}>
                    {status.email} adresine bir doğrulama bağlantısı gönderdik. Gelen
                    kutunuzu (ve spam klasörünü) kontrol edip bağlantıya tıklayın. Onay
                    sayfasında “Panele Git”e basın; ardından burada “Durumu Yenile” ile
                    kontrol edebilirsiniz.
                  </Text>
                  <View style={styles.btnRow}>
                    <Pressable
                      disabled={loading === 'refresh'}
                      onPress={() => void handleRefreshStatus()}
                      style={styles.sageBtn}>
                      <Ionicons color={colors.white} name="refresh" size={14} />
                      <Text style={styles.sageBtnText}>
                        {loading === 'refresh' ? '…' : 'Durumu Yenile'}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={loading === 'email-send'}
                      onPress={() => void handleSendEmail()}
                      style={styles.ghostBtn}>
                      <Text style={styles.ghostBtnText}>Tekrar Gönder</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setShowEmailCode((v) => !v)}>
                    <Text style={styles.link}>Kod aldıysanız buraya girin</Text>
                  </Pressable>
                  {showEmailCode ? (
                    <View style={styles.codeRow}>
                      <TextInput
                        keyboardType="number-pad"
                        onChangeText={setEmailCode}
                        placeholder="E-postadaki 6 haneli kod"
                        placeholderTextColor={colors.cream[300]}
                        style={styles.codeInput}
                        value={emailCode}
                      />
                      <Pressable
                        disabled={loading === 'email-confirm'}
                        onPress={() => void handleConfirmEmail()}
                        style={styles.sageBtn}>
                        <Text style={styles.sageBtnText}>
                          {loading === 'email-confirm' ? '…' : 'Onayla'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}
        </View>

        {env.phoneVerifyEnabled ? (
          <View style={[styles.block, styles.blockMuted]}>
            <View style={styles.blockHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowLabel}>
                  <Ionicons color={colors.brand[500]} name="call" size={16} />
                  <Text style={styles.blockTitle}>Telefon</Text>
                </View>
                <Text style={styles.blockMeta}>
                  {status.phone || 'Numara eklenmemiş'}
                </Text>
              </View>
              <StatusBadge verified={status.phoneVerified} />
            </View>

            {!status.phoneVerified ? (
              <View style={styles.actions}>
                {!phoneStep ? (
                  <>
                    <PhoneField
                      country={countryIso}
                      label=""
                      onCountryChange={setCountryIso}
                      onValueChange={setPhone}
                      value={phone}
                    />
                    <Pressable
                      disabled={loading === 'phone-send' || !phone}
                      onPress={() => void handleSendPhone()}
                      style={[
                        styles.primaryBtn,
                        (!phone || loading === 'phone-send') && styles.btnDisabled,
                      ]}>
                      <Text style={styles.primaryBtnText}>
                        {loading === 'phone-send'
                          ? 'Gönderiliyor…'
                          : env.phoneVerifyViaEmail
                            ? 'Doğrulama Bağlantısı Gönder'
                            : 'SMS Kodu Gönder'}
                      </Text>
                    </Pressable>
                  </>
                ) : phoneViaEmail ? (
                  <View style={styles.actions}>
                    <Text style={styles.infoBox}>
                      SMS henüz yapılandırılmadığı için {status.email} adresine bir
                      doğrulama bağlantısı gönderdik. Bağlantıya tıklayın, ardından bu
                      sayfada “Durumu Yenile”ye basın.
                    </Text>
                    <View style={styles.btnRow}>
                      <Pressable
                        disabled={loading === 'refresh'}
                        onPress={() => void handleRefreshStatus()}
                        style={styles.sageBtn}>
                        <Text style={styles.sageBtnText}>Durumu Yenile</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPhoneStep(false)}
                        style={styles.ghostBtn}>
                        <Text style={styles.ghostBtnText}>Numarayı Değiştir</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <Text style={styles.blockMeta}>
                      Kod şu numaraya gönderildi: {pendingPhone}
                    </Text>
                    <View style={styles.codeRow}>
                      <TextInput
                        keyboardType="number-pad"
                        onChangeText={setPhoneCode}
                        placeholder="SMS kodu"
                        placeholderTextColor={colors.cream[300]}
                        style={styles.codeInput}
                        value={phoneCode}
                      />
                      <Pressable
                        disabled={loading === 'phone-confirm'}
                        onPress={() => void handleConfirmPhone()}
                        style={styles.sageBtn}>
                        <Text style={styles.sageBtnText}>
                          {loading === 'phone-confirm' ? '…' : 'Onayla'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ProfileSectionCard>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  block: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sage[100],
    backgroundColor: colors.sage[50],
    padding: spacing.md,
  },
  blockMuted: {
    backgroundColor: colors.cream[50],
    borderColor: colors.cream[100],
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blockTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  blockMeta: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.65,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOk: { backgroundColor: colors.sage[100] },
  badgeWarn: { backgroundColor: colors.warm[100] },
  badgeOkText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.sage[700] },
  badgeWarnText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.warm[500] },
  actions: { marginTop: spacing.sm, gap: 10 },
  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  btnDisabled: { opacity: 0.55 },
  infoBox: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    padding: 12,
  },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sage[600],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sageBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  ghostBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  link: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.brand[600],
    textDecorationLine: 'underline',
  },
  codeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
  },
});
