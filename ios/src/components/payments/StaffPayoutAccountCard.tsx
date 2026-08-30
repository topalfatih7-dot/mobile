import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import {
  BANK_TONE_COLORS,
  bankInitials,
  findBankByCode,
  unknownBank,
} from '@/data/turkishBanks';
import { upsertPayoutAccount, type StaffPayoutAccount } from '@/services/staffPayoutAccounts';
import { copyText } from '@/utils/copyText';
import {
  compactIban,
  ibanValidationMessage,
  isPayoutAccountComplete,
  isValidTrIban,
  maskIbanInput,
  trIbanBankCode,
} from '@/utils/iban';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  staffUser: { id?: string; name?: string } | null | undefined;
  account: StaffPayoutAccount | null;
  onSaved?: (saved: StaffPayoutAccount) => void;
};

export function StaffPayoutAccountCard({ staffUser, account, onSaved }: Props) {
  const { toast } = useToast();
  const holderName = String(staffUser?.name || '').trim();
  const [saving, setSaving] = useState(false);
  const [iban, setIban] = useState(() => (account?.iban ? maskIbanInput(account.iban) : ''));

  useEffect(() => {
    setIban(account?.iban ? maskIbanInput(account.iban) : '');
  }, [account]);

  const compact = compactIban(iban);
  const detectedCode = trIbanBankCode(compact);
  const detectedBank = findBankByCode(detectedCode);

  const ibanError = useMemo(() => {
    if (!compact) return '';
    return ibanValidationMessage(compact);
  }, [compact]);

  const canSave = isPayoutAccountComplete({
    accountHolderName: holderName,
    bankCode: detectedCode,
    iban: compact,
  });
  const savedComplete = isPayoutAccountComplete({
    ...(account || {}),
    accountHolderName: holderName || account?.accountHolderName,
  });

  const save = async () => {
    if (holderName.length < 3) {
      toast('Paneldeki adınız eksik. Profilinizdeki isim hesap sahibi olarak kaydedilir.', 'error');
      return;
    }
    if (!detectedCode) {
      toast('Geçerli bir IBAN girin; banka otomatik tespit edilir.', 'error');
      return;
    }
    const message = ibanValidationMessage(compact);
    if (message) {
      toast(message, 'error');
      return;
    }
    if (!staffUser?.id) {
      toast('Oturum gerekli.', 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertPayoutAccount(String(staffUser.id), {
        accountHolderName: holderName,
        bankCode: detectedCode,
        iban: compact,
        accountType: 'individual',
      });
      toast('Ödeme hesabı kaydedildi.', 'success');
      onSaved?.(saved);
    } catch (err) {
      toast((err as Error)?.message || 'Kaydedilemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const bank = detectedBank || (detectedCode ? unknownBank(detectedCode) : null);
  const tone = bank ? BANK_TONE_COLORS[bank.tone] : BANK_TONE_COLORS.navy;

  return (
    <FadeIn>
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={styles.headLeft}>
            <View style={styles.landmark}>
              <Ionicons color={colors.white} name="business" size={20} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Banka ve IBAN</Text>
              <Text style={styles.sub}>
                Hakediş Cuma günü EFT / FAST ile bu hesaba gönderilir. IBAN kadro profilinde görünmez.
              </Text>
            </View>
          </View>
          <View style={[styles.badge, savedComplete ? styles.badgeOk : styles.badgeWarn]}>
            <Ionicons
              color={savedComplete ? colors.sage[700] : '#92400e'}
              name={savedComplete ? 'shield-checkmark' : 'alert-circle'}
              size={14}
            />
            <Text style={[styles.badgeText, savedComplete ? styles.badgeOkText : styles.badgeWarnText]}>
              {savedComplete ? 'Ödeme hesabı hazır' : 'Hesap bilgisi eksik'}
            </Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons color="#d97706" name="alert-circle" size={16} />
          <Text style={styles.noticeText}>
            <Text style={styles.noticeStrong}>Önemli: </Text>
            Girdiğiniz IBAN, paneldeki adınıza kayıtlı bir bireysel banka hesabına ait olmalıdır.
            Üçüncü kişi veya şirket hesaplarına yapılan ödemeler banka tarafından reddedilebilir;
            hakedişinizin sorunsuz ulaşması için hesap sahibi bilgisini kontrol edin.
          </Text>
        </View>

        <View style={styles.holder}>
          <Text style={styles.holderLabel}>Hesap sahibi</Text>
          <Text style={styles.holderName}>{holderName || '—'}</Text>
        </View>

        <View>
          {compact && isValidTrIban(compact) ? (
            <Pressable
              hitSlop={8}
              onPress={async () => {
                const result = await copyText(compact);
                if (result === 'failed') toast('Kopyalanamadı.', 'error');
                else toast('IBAN kopyalandı.', 'success');
              }}
              style={styles.copyWrap}>
              <Text style={styles.copyLink}>Kopyala</Text>
            </Pressable>
          ) : null}
          <TextField
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect={false}
            error={ibanError || undefined}
            label="IBAN"
            onChangeText={(v) => setIban(maskIbanInput(v))}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            spellCheck={false}
            value={iban}
          />
          {!ibanError && compact && isValidTrIban(compact) ? (
            <Text style={styles.validOk}>Geçerli IBAN</Text>
          ) : null}
        </View>

        {detectedCode && bank ? (
          <View style={styles.bankRow}>
            <View style={[styles.bankMark, { backgroundColor: tone.bg }]}>
              <Text style={[styles.bankInitials, { color: tone.fg }]}>{bankInitials(bank)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.bankLabel}>Tespit edilen banka</Text>
              <Text numberOfLines={1} style={styles.bankName}>
                {detectedBank?.short || `Banka kodu ${detectedCode}`}
              </Text>
              {detectedBank ? (
                <Text numberOfLines={1} style={styles.bankMeta}>
                  EFT {detectedCode} · {detectedBank.name}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <Button
          disabled={saving || !canSave}
          label={saving ? 'Kaydediliyor…' : 'Ödeme hesabını kaydet'}
          loading={saving}
          onPress={() => void save()}
        />
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.sage[100],
    backgroundColor: colors.sage[50],
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.md,
  },
  head: { gap: spacing.sm },
  headLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  landmark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.sage[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.cream[800],
    opacity: 0.6,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOk: { backgroundColor: colors.sage[100] },
  badgeWarn: { backgroundColor: '#fef3c7' },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  badgeOkText: { color: colors.sage[700] },
  badgeWarnText: { color: '#78350f' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: '#451a03',
  },
  noticeStrong: { fontFamily: fonts.sansSemi },
  holder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  holderLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.cream[800],
    opacity: 0.55,
  },
  holderName: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.cream[900],
  },
  copyWrap: { alignSelf: 'flex-end', marginBottom: 4 },
  copyLink: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
  },
  validOk: {
    marginTop: -4,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.sage[700],
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bankMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInitials: { fontFamily: fonts.sansBold, fontSize: 10 },
  bankLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.cream[800],
    opacity: 0.5,
  },
  bankName: {
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: colors.cream[900],
  },
  bankMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
  },
});
