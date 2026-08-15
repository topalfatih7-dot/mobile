/**
 * Web parity: Adsız `src/components/staff/StaffProfileEditor.jsx`
 * MOBILE DIFF: tek sütun RN layout; WhatsApp + workDays Çalışma sekmesinde.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { WeeklyAvailability, STAFF_AVAILABILITY_WEEKDAYS } from '@/components/staff/WeeklyAvailability';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { PhoneField } from '@/components/ui/PhoneField';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import {
  DEFAULT_COUNTRY_ISO,
  formatNationalNumber,
  parseE164,
} from '@/data/countryCodes';
import {
  lockedProfileFields,
  normalizeStaffProfile,
  type StaffProfile,
} from '@/data/staffProfile';
import { CITY_NAMES, getDistricts } from '@/data/turkeyCities';
import { prepareProfilePhotoDataUrl } from '@/services/memberMedia';
import { updateStaffSelfProfile } from '@/services/staffDb';
import { supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';
import { detectExternalContactInfo } from '@/utils/contactInfoGuard';
import { isPasswordValid } from '@/utils/password';
import { pickProfilePhoto } from '@/utils/pickProfilePhoto';

const TABS = [
  { id: 'profile' as const, label: 'Profil', hint: 'Fotoğraf, iletişim ve tanıtım' },
  { id: 'schedule' as const, label: 'Çalışma', hint: 'Müsaitlik ve sosyal medya' },
  { id: 'security' as const, label: 'Güvenlik', hint: 'Şifre değiştirme' },
];

const ROLE_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  coach: { label: 'Koç', icon: 'barbell-outline' },
  dietitian: { label: 'Diyetisyen', icon: 'nutrition-outline' },
  doctor: { label: 'Doktor', icon: 'medkit-outline' },
};

const WORK_TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const h = 6 + i;
  const label = `${String(h).padStart(2, '0')}:00`;
  return { value: label, label };
});

type TabId = (typeof TABS)[number]['id'];

type Props = {
  staffUser: Record<string, unknown>;
  email?: string | null;
  onSaved?: () => Promise<void> | void;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

function phoneFromStaff(staff: StaffProfile) {
  const raw = String(staff.phone || '');
  if (!raw) return { phone: '', phoneCountry: DEFAULT_COUNTRY_ISO };
  if (raw.startsWith('+')) {
    const parsed = parseE164(raw);
    if (parsed) {
      return {
        phone: formatNationalNumber(parsed.iso, parsed.national),
        phoneCountry: parsed.iso,
      };
    }
  }
  return {
    phone: formatNationalNumber(DEFAULT_COUNTRY_ISO, raw),
    phoneCountry: DEFAULT_COUNTRY_ISO,
  };
}

export function StaffProfileEditor({ staffUser, email, onSaved }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('profile');
  const [form, setForm] = useState(() => normalizeStaffProfile(staffUser));
  const [phoneCountry, setPhoneCountry] = useState(
    () => phoneFromStaff(normalizeStaffProfile(staffUser)).phoneCountry,
  );
  const [whatsappNotifs, setWhatsappNotifs] = useState(
    () => (staffUser?.settings as Record<string, unknown>)?.whatsappNotifs !== false,
  );
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [workStartOpen, setWorkStartOpen] = useState(false);
  const [workEndOpen, setWorkEndOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const next = normalizeStaffProfile(staffUser);
    const phoneBits = phoneFromStaff(next);
    setForm({ ...next, phone: phoneBits.phone });
    setPhoneCountry(phoneBits.phoneCountry);
    setWhatsappNotifs(
      (staffUser?.settings as Record<string, unknown>)?.whatsappNotifs !== false,
    );
  }, [staffUser]);

  const districts = useMemo(() => getDistricts(form.city || ''), [form.city]);
  const roleMeta = ROLE_META[String(form.role || staffUser.role || 'coach')] || ROLE_META.coach;
  const activeTab = TABS.find((t) => t.id === tab)!;
  const displayEmail = String(form.email || email || '');
  const completionHints = [
    !form.photo && 'Profil fotoğrafı',
    !form.bio && 'Biyografi',
  ].filter(Boolean) as string[];

  const update = (patch: Partial<StaffProfile>) => {
    setForm((f) => normalizeStaffProfile({ ...f, ...patch }));
  };

  const validate = () => {
    if (!String(form.name || '').trim()) return 'Ad soyad gerekli.';
    if (!String(form.phone || '').trim()) return 'Telefon gerekli.';
    if (!String(form.city || '').trim() || !String(form.district || '').trim()) {
      return 'İl ve ilçe seçin.';
    }
    if (!form.gender) return 'Cinsiyet seçin.';
    if (!form.photo) return 'Profil fotoğrafı gerekli.';
    if (detectExternalContactInfo(String(form.bio || ''))) {
      return 'Biyografide harici iletişim bilgisi paylaşamazsınız. Tüm iletişim uygulama içinden yürütülmelidir.';
    }
    return '';
  };

  const onPickPhoto = async () => {
    try {
      const picked = await pickProfilePhoto();
      if (!picked) return;
      setUploadingPhoto(true);
      const prepared = await prepareProfilePhotoDataUrl(picked.uri);
      if (!prepared.ok) {
        toast(prepared.error, 'error');
        return;
      }
      update({ photo: prepared.dataUrl });
      toast('Fotoğraf seçildi — kaydetmeyi unutmayın', 'success');
    } catch (e) {
      toast(String((e as Error)?.message || 'Fotoğraf seçilemedi'), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast(err, 'warning');
      return;
    }
    if (!staffUser?.id) return;
    setSaving(true);
    try {
      const locked = lockedProfileFields(staffUser);
      const payload = {
        ...locked,
        name: String(form.name || '').trim(),
        phone: form.phone,
        title: form.title,
        gender: form.gender,
        city: form.city,
        district: form.district,
        bio: form.bio,
        photo: form.photo,
        availability: form.availability || {},
        linkedin: form.linkedin,
        instagram: form.instagram,
        youtube: form.youtube,
        website: form.website,
        workDays: form.workDays || [],
        workStart: form.workStart || '09:00',
        workEnd: form.workEnd || '17:00',
        settings: {
          ...((staffUser.settings as Record<string, unknown>) || {}),
          whatsappNotifs,
        },
      };
      const result = await updateStaffSelfProfile(String(staffUser.id), payload);
      if (!result.success) {
        toast(result.error || 'Kaydedilemedi', 'error');
        return;
      }
      toast('Profiliniz güncellendi', 'success');
      await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword) {
      toast('Mevcut şifrenizi girin.', 'error');
      return;
    }
    if (!isPasswordValid(password)) {
      toast('Yeni şifre gereksinimleri karşılanmıyor.', 'error');
      return;
    }
    if (password !== passwordConfirm) {
      toast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }
    if (currentPassword === password) {
      toast('Yeni şifre mevcut şifreden farklı olmalı.', 'error');
      return;
    }
    if (!supabase || !displayEmail) {
      toast('Oturum gerekli.', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: displayEmail,
        password: currentPassword,
      });
      if (signInError) {
        toast('Mevcut şifre hatalı.', 'error');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast('Şifreniz güncellendi', 'success');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirm('');
    } catch (err) {
      toast((err as Error).message || 'Şifre güncellenemedi', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const toggleWorkDay = (day: number) => {
    const cur = form.workDays || [];
    const next = cur.includes(day)
      ? cur.filter((d) => d !== day)
      : [...cur, day].sort((a, b) => a - b);
    update({ workDays: next });
  };

  const lockedSpecialty =
    form.specialty ||
    (form.specialties?.length ? form.specialties.join(', ') : '') ||
    '—';
  const lockedLangs = (form.languages || []).join(', ') || '—';
  const lockedExp =
    form.experienceYears === '' || form.experienceYears == null
      ? '—'
      : `${form.experienceYears} yıl`;

  return (
    <View style={styles.root}>
      <FadeIn>
        <LinearGradient
          colors={[colors.brand[500], colors.brand[600], colors.sage[600]]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroAvatarWrap}>
              {form.photo ? (
                <Image contentFit="cover" source={{ uri: String(form.photo) }} style={styles.heroAvatar} />
              ) : (
                <View style={[styles.heroAvatar, styles.heroAvatarEmpty]}>
                  <Text style={styles.heroInitials}>{initialsOf(String(form.name || 'P'))}</Text>
                </View>
              )}
              <View style={styles.rolePill}>
                <Ionicons color={colors.brand[700]} name={roleMeta.icon} size={12} />
                <Text style={styles.rolePillText}>{roleMeta.label}</Text>
              </View>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroName}>{form.name || 'Profiliniz'}</Text>
              <Text style={styles.heroSub}>{form.title || displayEmail}</Text>
              {completionHints.length > 0 ? (
                <View style={styles.heroBadge}>
                  <Ionicons color={colors.white} name="alert-circle-outline" size={14} />
                  <Text style={styles.heroBadgeText}>
                    Eksik: {completionHints.slice(0, 2).join(', ')}
                    {completionHints.length > 2 ? '…' : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.heroBadge}>
                  <Ionicons color={colors.white} name="checkmark-circle" size={14} />
                  <Text style={styles.heroBadgeText}>Profil tamamlandı</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </FadeIn>

      <View style={styles.infoBanner}>
        <Ionicons color={colors.brand[600]} name="information-circle-outline" size={18} />
        <Text style={styles.infoBannerText}>
          Uzmanlık alanları, eğitim ve sertifikalar başvurunuz onaylandığında sisteme kaydedilir;
          değişiklik için yöneticinize başvurun.
        </Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabOn]}>
              <Text style={[styles.tabText, active && styles.tabTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.tabHint}>{activeTab.hint}</Text>

      {tab === 'profile' ? (
        <ProfileSectionCard
          accent="brand"
          icon="person-outline"
          subtitle="Danışanlarınızın gördüğü profil kartı"
          title="Temel Bilgiler">
          <View style={styles.sectionGap}>
            <View style={styles.photoRow}>
              {form.photo ? (
                <Image contentFit="cover" source={{ uri: String(form.photo) }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}>
                  <Ionicons color={colors.cream[300]} name="camera-outline" size={28} />
                </View>
              )}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.fieldLabel}>
                  Profil Fotoğrafı <Text style={styles.req}>*</Text>
                </Text>
                <Pressable
                  disabled={uploadingPhoto}
                  onPress={() => void onPickPhoto()}
                  style={styles.photoBtn}>
                  {uploadingPhoto ? (
                    <ActivityIndicator color={colors.brand[600]} />
                  ) : (
                    <>
                      <Ionicons color={colors.brand[600]} name="image-outline" size={16} />
                      <Text style={styles.photoBtnText}>
                        {form.photo ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Text style={styles.hint}>
                  Net portre fotoğrafı önerilir — kadro sayfalarında görünür.
                </Text>
              </View>
            </View>

            <TextField
              label="Ad Soyad *"
              onChangeText={(name) => update({ name })}
              placeholder="Adınız Soyadınız"
              value={String(form.name || '')}
            />
            <PhoneField
              country={phoneCountry}
              label="Telefon *"
              onCountryChange={(iso) => {
                setPhoneCountry(iso);
                update({ phone: '' });
              }}
              onValueChange={(phone) => update({ phone })}
              value={String(form.phone || '')}
            />
            <TextField
              label="Unvan"
              onChangeText={(title) => update({ title })}
              placeholder="Uzman Diyetisyen"
              value={String(form.title || '')}
            />
            <GenderSelect
              onChange={(gender) => update({ gender })}
              value={(form.gender as '' | 'female' | 'male') || ''}
            />

            <View>
              <Text style={styles.fieldLabel}>
                İl <Text style={styles.req}>*</Text>
              </Text>
              <Pressable onPress={() => setCityOpen(true)} style={styles.selectBtn}>
                <Text style={[styles.selectText, !form.city && styles.selectPlaceholder]}>
                  {form.city || 'Seçin'}
                </Text>
                <Ionicons color={colors.cream[300]} name="chevron-down" size={18} />
              </Pressable>
            </View>
            <View>
              <Text style={styles.fieldLabel}>
                İlçe <Text style={styles.req}>*</Text>
              </Text>
              <Pressable
                disabled={!form.city}
                onPress={() => setDistrictOpen(true)}
                style={[styles.selectBtn, !form.city && styles.selectDisabled]}>
                <Text style={[styles.selectText, !form.district && styles.selectPlaceholder]}>
                  {form.district || (form.city ? 'Seçin' : '—')}
                </Text>
                <Ionicons color={colors.cream[300]} name="chevron-down" size={18} />
              </Pressable>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Biyografi</Text>
              <TextInput
                multiline
                onChangeText={(bio) => update({ bio })}
                placeholder="Deneyiminiz, yaklaşımınız ve danışanlarınıza nasıl destek olduğunuz…"
                placeholderTextColor={colors.cream[300]}
                style={styles.textarea}
                textAlignVertical="top"
                value={String(form.bio || '')}
              />
              <Text style={styles.hint}>
                Bu biyografi herkese açık yayınlanır — kadro sayfalarında ve genel profilinizde
                görünür.
              </Text>
            </View>

            <View style={styles.lockedBox}>
              <Text style={styles.lockedTitle}>Kilitli bilgiler</Text>
              <Text style={styles.lockedLine}>
                <Text style={styles.lockedKey}>E-posta: </Text>
                {displayEmail || '—'}
              </Text>
              <Text style={styles.lockedLine}>
                <Text style={styles.lockedKey}>Uzmanlık: </Text>
                {lockedSpecialty}
              </Text>
              <Text style={styles.lockedLine}>
                <Text style={styles.lockedKey}>Deneyim: </Text>
                {lockedExp}
              </Text>
              <Text style={styles.lockedLine}>
                <Text style={styles.lockedKey}>Diller: </Text>
                {lockedLangs}
              </Text>
              <Text style={styles.lockedNote}>
                (değişiklik için yöneticinize başvurun)
              </Text>
            </View>
          </View>
        </ProfileSectionCard>
      ) : null}

      {tab === 'schedule' ? (
        <View style={styles.sectionGap}>
          <ProfileSectionCard
            accent="sage"
            icon="time-outline"
            subtitle="Danışanlar yalnızca burada seçtiğiniz gün ve saatlerden randevu alabilir"
            title="Randevu Müsaitliği">
            <WeeklyAvailability
              onChange={(availability) => update({ availability })}
              value={form.availability || {}}
            />
          </ProfileSectionCard>

          <ProfileSectionCard
            accent="sage"
            icon="calendar-outline"
            subtitle="Atama ve genel çalışma saatleri"
            title="Çalışma Günleri">
            <View style={styles.sectionGap}>
              <View style={styles.workDays}>
                {STAFF_AVAILABILITY_WEEKDAYS.map((d) => {
                  const on = (form.workDays || []).includes(d.value);
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => toggleWorkDay(d.value)}
                      style={[styles.workDayChip, on && styles.workDayChipOn]}>
                      <Text style={[styles.workDayText, on && styles.workDayTextOn]}>
                        {d.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.workTimes}>
                <Pressable onPress={() => setWorkStartOpen(true)} style={styles.workTimeBtn}>
                  <Text style={styles.fieldLabel}>Başlangıç</Text>
                  <Text style={styles.selectText}>{form.workStart || '09:00'}</Text>
                </Pressable>
                <Pressable onPress={() => setWorkEndOpen(true)} style={styles.workTimeBtn}>
                  <Text style={styles.fieldLabel}>Bitiş</Text>
                  <Text style={styles.selectText}>{form.workEnd || '17:00'}</Text>
                </Pressable>
              </View>
            </View>
          </ProfileSectionCard>

          <ProfileSectionCard
            accent="violet"
            icon="globe-outline"
            subtitle="Yalnızca yönetim kaydı — danışanlara gösterilmez"
            title="Sosyal Medya & Web">
            <View style={styles.sectionGap}>
              <TextField
                autoCapitalize="none"
                label="LinkedIn"
                onChangeText={(linkedin) => update({ linkedin })}
                placeholder="LinkedIn URL"
                value={String(form.linkedin || '')}
              />
              <TextField
                autoCapitalize="none"
                label="Instagram"
                onChangeText={(instagram) => update({ instagram })}
                placeholder="Instagram URL"
                value={String(form.instagram || '')}
              />
              <TextField
                autoCapitalize="none"
                label="YouTube"
                onChangeText={(youtube) => update({ youtube })}
                placeholder="YouTube URL"
                value={String(form.youtube || '')}
              />
              <TextField
                autoCapitalize="none"
                label="Web sitesi"
                onChangeText={(website) => update({ website })}
                placeholder="Web sitesi URL"
                value={String(form.website || '')}
              />
            </View>
          </ProfileSectionCard>

          <ProfileSectionCard
            accent="sage"
            icon="notifications-outline"
            subtitle="Randevu ve mesaj uyarıları"
            title="Bildirimler">
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>WhatsApp bildirimleri</Text>
              <Switch
                onValueChange={setWhatsappNotifs}
                thumbColor={whatsappNotifs ? colors.white : colors.cream[200]}
                trackColor={{ false: colors.cream[300], true: colors.brand[500] }}
                value={whatsappNotifs}
              />
            </View>
            <Text style={styles.hint}>
              Kapalıysa randevu ve danışan mesajı WhatsApp bildirimleri gönderilmez. Kaydet’e
              basmayı unutmayın.
            </Text>
          </ProfileSectionCard>
        </View>
      ) : null}

      {tab === 'security' ? (
        <ProfileSectionCard
          accent="brand"
          icon="lock-closed-outline"
          subtitle="Güvenlik için önce mevcut şifrenizi doğrulayın"
          title="Şifre Değiştir">
          <View style={styles.sectionGap}>
            <TextField
              autoComplete="password"
              label="Mevcut şifre *"
              onChangeText={setCurrentPassword}
              placeholder="Şu anki şifreniz"
              secureTextEntry
              value={currentPassword}
            />
            <PasswordRules password={password} />
            <TextField
              autoComplete="password-new"
              label="Yeni şifre *"
              onChangeText={setPassword}
              secureTextEntry
              value={password}
            />
            <TextField
              autoComplete="password-new"
              label="Yeni şifre tekrarı *"
              onChangeText={setPasswordConfirm}
              secureTextEntry
              value={passwordConfirm}
            />
            <Button
              disabled={
                passwordSaving ||
                !currentPassword ||
                !password ||
                !isPasswordValid(password) ||
                password !== passwordConfirm
              }
              label={passwordSaving ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
              loading={passwordSaving}
              onPress={() => void handlePasswordSave()}
              size="md"
            />
          </View>
        </ProfileSectionCard>
      ) : null}

      <View style={styles.saveWrap}>
        <Button
          disabled={saving}
          label={saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          loading={saving}
          onPress={() => void handleSave()}
        />
      </View>

      <SelectSheet
        onClose={() => setCityOpen(false)}
        onSelect={(city) => update({ city, district: '' })}
        options={CITY_NAMES.map((c) => ({ value: c, label: c }))}
        title="İl seçin"
        value={form.city}
        visible={cityOpen}
      />
      <SelectSheet
        onClose={() => setDistrictOpen(false)}
        onSelect={(district) => update({ district })}
        options={districts.map((d) => ({ value: d, label: d }))}
        title="İlçe seçin"
        value={form.district}
        visible={districtOpen}
      />
      <SelectSheet
        onClose={() => setWorkStartOpen(false)}
        onSelect={(workStart) => update({ workStart })}
        options={WORK_TIME_OPTIONS}
        title="Çalışma başlangıcı"
        value={form.workStart}
        visible={workStartOpen}
      />
      <SelectSheet
        onClose={() => setWorkEndOpen(false)}
        onSelect={(workEnd) => update({ workEnd })}
        options={WORK_TIME_OPTIONS}
        title="Çalışma bitişi"
        value={form.workEnd}
        visible={workEndOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroAvatarWrap: { alignItems: 'center' },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  heroAvatarEmpty: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitials: { fontFamily: fonts.sansSemi, fontSize: 22, color: colors.white },
  rolePill: {
    marginTop: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rolePillText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.brand[700] },
  heroText: { flex: 1, gap: 4 },
  heroName: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.white },
  heroSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[100],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingVertical: 10,
  },
  tabOn: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  tabText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  tabTextOn: { color: colors.white },
  tabHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[300], marginTop: -4 },
  sectionGap: { gap: spacing.md },
  photoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  photo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[100],
  },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoBtnText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  fieldLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.cream[800],
    marginBottom: 6,
    opacity: 0.7,
  },
  req: { color: colors.brand[500] },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[300], lineHeight: 16 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectDisabled: { opacity: 0.5 },
  selectText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900] },
  selectPlaceholder: { color: colors.cream[300] },
  textarea: {
    minHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
  },
  lockedBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
    gap: 6,
  },
  lockedTitle: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900], marginBottom: 2 },
  lockedLine: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  lockedKey: { fontFamily: fonts.sansSemi },
  lockedNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[300], marginTop: 4 },
  workDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  workDayChip: {
    borderRadius: radius.full,
    backgroundColor: colors.cream[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  workDayChipOn: { backgroundColor: colors.brand[500] },
  workDayText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  workDayTextOn: { color: colors.white },
  workTimes: { flexDirection: 'row', gap: 10 },
  workTimeBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.mint[50],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  switchLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  saveWrap: { marginTop: spacing.sm, marginBottom: spacing.md },
});
