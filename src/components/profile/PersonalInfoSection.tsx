import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BirthDateField } from '@/components/ui/BirthDateField';
import { Button } from '@/components/ui/Button';
import { ChoiceChip, type ChoiceTone } from '@/components/ui/ChoiceChip';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { PhoneField } from '@/components/ui/PhoneField';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { TextField } from '@/components/ui/TextField';
import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { useActions } from '@/context/ActionsContext';
import { useToast } from '@/context/ToastContext';
import {
  DEFAULT_COUNTRY_ISO,
  formatE164,
  formatNationalNumber,
  isValidNationalNumber,
  parseE164,
  toE164,
} from '@/data/countryCodes';
import { MEMBER_GENDERS, isValidMemberGender } from '@/data/genders';
import { CITY_NAMES, getDistricts } from '@/data/turkeyCities';
import { uploadMemberFile } from '@/services/memberMedia';
import type { MemberRecord } from '@/services/mappers';
import { ageFromBirthDate, birthDateError, formatBirthDate } from '@/utils/birthDate';
import { pickProfilePhoto } from '@/utils/pickProfilePhoto';
import { colors, fonts, radius, spacing } from '@/theme';

const GOALS: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: ChoiceTone;
}[] = [
  { value: 'weight', label: 'Kilo Yönetimi', icon: 'scale-outline', tone: 'sky' },
  { value: 'fatburn', label: 'Yağ Yakımı', icon: 'flame-outline', tone: 'coral' },
  { value: 'muscle', label: 'Kas Kazanımı', icon: 'barbell-outline', tone: 'brand' },
  { value: 'tone', label: 'Formda Kalmak', icon: 'heart-outline', tone: 'rose' },
  { value: 'endurance', label: 'Dayanıklılık', icon: 'flash-outline', tone: 'amber' },
  { value: 'habit', label: 'Sağlıklı Alışkanlık', icon: 'leaf-outline', tone: 'sage' },
];

const FITNESS_LEVELS: {
  value: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: ChoiceTone;
}[] = [
  {
    value: 'beginner',
    label: 'Başlangıç',
    hint: 'Yeni başlıyorum',
    icon: 'ellipse-outline',
    tone: 'sky',
  },
  {
    value: 'intermediate',
    label: 'Orta',
    hint: 'Düzenli antrenman',
    icon: 'triangle-outline',
    tone: 'amber',
  },
  {
    value: 'advanced',
    label: 'İleri',
    hint: 'Yoğun tempo',
    icon: 'trophy-outline',
    tone: 'coral',
  },
];

const NUTRITION_PREFS: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: ChoiceTone;
}[] = [
  { value: 'balanced', label: 'Dengeli', icon: 'nutrition-outline', tone: 'sage' },
  { value: 'high-protein', label: 'Yüksek Protein', icon: 'barbell-outline', tone: 'brand' },
  { value: 'vegetarian', label: 'Vejetaryen', icon: 'leaf-outline', tone: 'amber' },
  { value: 'vegan', label: 'Vegan', icon: 'flower-outline', tone: 'emerald' },
  { value: 'low-carb', label: 'Düşük Karb.', icon: 'restaurant-outline', tone: 'rose' },
];

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  waist: { min: 40, max: 200 },
} as const;

function rangeError(field: keyof typeof LIMITS, value: string): string {
  if (value === '' || value == null) return '';
  const num = Number(value);
  const { min, max } = LIMITS[field];
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`;
  return '';
}

type Props = { user: MemberRecord };

/** Web PersonalInfoSection parity. */
export function PersonalInfoSection({ user }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const twoCol = width >= 640;
  const { updateProfile } = useActions();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  type FormState = {
    name: string;
    email: string;
    phone: string;
    phoneCountry: string;
    birthDate: string;
    gender: '' | 'female' | 'male';
    city: string;
    district: string;
    weight: string;
    height: string;
    waist: string;
    photo: string | null;
    goals: string[];
    fitnessLevel: string;
    nutritionPrefs: string[];
  };

  const [form, setForm] = useState<FormState>(() => ({
    name: String(user.name || ''),
    email: String(user.email || ''),
    phone: '',
    phoneCountry: String(user.phoneCountry || DEFAULT_COUNTRY_ISO),
    birthDate: String(user.birthDate || ''),
    gender:
      user.gender === 'female' || user.gender === 'male' ? user.gender : '',
    city: String(user.city || ''),
    district: String(user.district || ''),
    weight: String(user.weight || ''),
    height: String(user.height || ''),
    waist: String(user.waist || ''),
    photo: user.photo ? String(user.photo) : null,
    goals: Array.isArray(user.goals) ? [...user.goals] : [],
    fitnessLevel: String(user.fitnessLevel || 'beginner'),
    nutritionPrefs: Array.isArray(user.nutritionPrefs)
      ? [...user.nutritionPrefs]
      : [],
  }));

  const districts = getDistricts(form.city);
  const errors = {
    birthDate: birthDateError(form.birthDate),
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    waist: rangeError('waist', form.waist),
  };

  const phoneFromUser = () => {
    if (!user.phone) {
      return {
        phone: '',
        phoneCountry: String(user.phoneCountry || DEFAULT_COUNTRY_ISO),
      };
    }
    const parsed = parseE164(String(user.phone));
    return {
      phone: parsed
        ? formatNationalNumber(parsed.iso, parsed.national)
        : String(user.phone),
      phoneCountry: String(user.phoneCountry || parsed?.iso || DEFAULT_COUNTRY_ISO),
    };
  };

  const openEditor = () => {
    const phoneFields = phoneFromUser();
    setForm({
      name: String(user.name || ''),
      email: String(user.email || ''),
      ...phoneFields,
      birthDate: String(user.birthDate || ''),
      gender:
        user.gender === 'female' || user.gender === 'male' ? user.gender : '',
      city: String(user.city || ''),
      district: String(user.district || ''),
      weight: String(user.weight || ''),
      height: String(user.height || ''),
      waist: String(user.waist || ''),
      photo: user.photo ? String(user.photo) : null,
      goals: Array.isArray(user.goals) ? [...user.goals] : [],
      fitnessLevel: String(user.fitnessLevel || 'beginner'),
      nutritionPrefs: Array.isArray(user.nutritionPrefs)
        ? [...user.nutritionPrefs]
        : [],
    });
    setOpen(true);
  };

  const onPickPhoto = async () => {
    if (!user.id) return;
    try {
      const picked = await pickProfilePhoto({
        // ImagePicker, açık RN Modal üstünde iOS'ta açılmaz
        beforePick: () => setOpen(false),
        afterPick: () => setOpen(true),
      });
      // null = vazgeç / izin yok — sessiz dön
      if (!picked) return;
      setUploadingPhoto(true);
      // Web parity: members.data.photo = data URL (avatars bucket yok)
      const uploaded = await uploadMemberFile({
        memberId: String(user.id),
        uri: picked.uri,
        folder: 'profile',
        contentType: 'image/jpeg',
      });
      if (!uploaded.ok) {
        toast(uploaded.error, 'error');
        return;
      }
      setForm((f) => ({ ...f, photo: uploaded.url }));
      toast('Fotoğraf seçildi — kaydetmeyi unutmayın', 'success');
    } catch (e) {
      toast(String((e as Error)?.message || 'Fotoğraf seçilemedi'), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const genderLocked = Boolean(user.gender);
    const nextGender = genderLocked ? String(user.gender) : form.gender;
    if (!isValidMemberGender(nextGender)) {
      toast('Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.', 'warning');
      return;
    }
    if (!user.phone && !form.phone?.trim()) {
      toast('Telefon numarası zorunludur.', 'warning');
      return;
    }
    if (!user.phone && form.phone && !isValidNationalNumber(form.phoneCountry, form.phone)) {
      toast('Geçerli bir cep telefonu numarası girin.', 'warning');
      return;
    }
    if (errors.birthDate || errors.weight || errors.height || errors.waist) {
      toast('Lütfen geçerli bilgiler girin', 'warning');
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        name: form.name,
        birthDate: form.birthDate,
        city: form.city,
        district: form.district,
        weight: form.weight,
        height: form.height,
        waist: form.waist,
        photo: form.photo,
        goals: form.goals,
        fitnessLevel: form.fitnessLevel,
        nutritionPrefs: form.nutritionPrefs,
        gender: nextGender,
        age: form.birthDate ? ageFromBirthDate(form.birthDate) : '',
      };
      if (!user.phone && form.phone) {
        patch.phone = toE164(form.phoneCountry, form.phone);
        patch.phoneCountry = form.phoneCountry;
      }
      await updateProfile(patch, { toastMsg: 'Kişisel bilgileriniz kaydedildi.' });
      setOpen(false);
    } catch (err) {
      toast(
        (err as Error)?.message || 'Bilgiler kaydedilemedi. Tekrar deneyin.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (value: string) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(value)
        ? f.goals.filter((g) => g !== value)
        : [...f.goals, value],
    }));
  };

  const toggleNutrition = (value: string) => {
    setForm((f) => ({
      ...f,
      nutritionPrefs: f.nutritionPrefs.includes(value)
        ? f.nutritionPrefs.filter((p) => p !== value)
        : [...f.nutritionPrefs, value],
    }));
  };

  const completionHints = [
    !user.birthDate && 'Doğum tarihi',
    !user.gender && 'Cinsiyet',
    !user.weight && 'Kilo',
    !user.height && 'Boy',
    !(user.goals as string[] | undefined)?.length && 'Hedef',
  ].filter(Boolean) as string[];

  const infoRows: [string, string][] = [
    ['Ad Soyad', String(user.name || '—')],
    ['E-posta', String(user.email || '—')],
    ['Telefon', user.phone ? formatE164(String(user.phone)) : '—'],
    ['Doğum Tarihi', formatBirthDate(user.birthDate ? String(user.birthDate) : '')],
    [
      'Cinsiyet',
      MEMBER_GENDERS.find((g) => g.value === user.gender)?.label || '—',
    ],
    [
      'Şehir / İlçe',
      user.city
        ? `${user.city}${user.district ? ` / ${user.district}` : ''}`
        : '—',
    ],
    ['Kilo', user.weight ? `${user.weight} kg` : '—'],
    ['Boy', user.height ? `${user.height} cm` : '—'],
    ['Bel', user.waist ? `${user.waist} cm` : '—'],
    [
      'Hedefler',
      Array.isArray(user.goals) && user.goals.length
        ? user.goals
            .map((g) => GOALS.find((x) => x.value === g)?.label || String(g))
            .join(', ')
        : '—',
    ],
    [
      'Spor Seviyesi',
      FITNESS_LEVELS.find((f) => f.value === user.fitnessLevel)?.label || '—',
    ],
    [
      'Beslenme',
      Array.isArray(user.nutritionPrefs) && user.nutritionPrefs.length
        ? user.nutritionPrefs
            .map(
              (p) =>
                NUTRITION_PREFS.find((x) => x.value === p)?.label || String(p),
            )
            .join(', ')
        : '—',
    ],
  ];

  return (
    <>
      <ProfileSectionCard
        accent="brand"
        action={
          <Pressable onPress={openEditor} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Düzenle</Text>
          </Pressable>
        }
        delay={100}
        icon="person"
        subtitle="Profilinizi ve hedeflerinizi tamamlayın"
        title="Kişisel Bilgiler">
        {completionHints.length > 0 ? (
          <View style={styles.hintBanner}>
            <Ionicons color={colors.warm[500]} name="alert-circle" size={16} />
            <Text style={styles.hintBannerText}>
              Eksik: {completionHints.join(', ')} — profilinizi tamamlayın.
            </Text>
          </View>
        ) : null}

        <View style={styles.infoGrid}>
          {infoRows.map(([k, v]) => (
            <View
              key={k}
              style={[styles.infoCell, twoCol ? styles.infoCellHalf : styles.infoCellFull]}>
              <Text style={styles.infoLabel}>{k}</Text>
              <Text style={styles.infoValue}>{v}</Text>
            </View>
          ))}
        </View>
      </ProfileSectionCard>

      <Modal animationType="slide" transparent visible={open}>
        <View style={styles.backdrop}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Kişisel Bilgiler</Text>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Pressable
                disabled={uploadingPhoto}
                onPress={() => void onPickPhoto()}
                style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {form.photo ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: form.photo }}
                      style={styles.photoImg}
                    />
                  ) : (
                    <Ionicons color={colors.brand[600]} name="camera" size={22} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.photoLabel}>Profil fotoğrafı</Text>
                  <Text style={styles.photoHint}>
                    {uploadingPhoto
                      ? 'Yükleniyor…'
                      : form.photo
                        ? 'Kamera veya galeriden değiştirin.'
                        : 'Kamera veya galeriden fotoğraf seçin.'}
                  </Text>
                </View>
                <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
              </Pressable>

              <TextField
                icon="person-outline"
                label="Ad Soyad"
                onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                value={form.name}
              />
              <TextField
                editable={false}
                icon="mail-outline"
                label="E-posta"
                value={form.email}
              />
              <Text style={styles.fieldHint}>Kayıt e-postası değiştirilemez.</Text>

              <PhoneField
                country={form.phoneCountry}
                disabled={Boolean(user.phone)}
                hint={
                  user.phone
                    ? 'Telefon numarası kayıt sonrası değiştirilemez.'
                    : 'Telefon numaranızı ekleyin.'
                }
                onCountryChange={(iso) =>
                  setForm((f) => ({ ...f, phoneCountry: iso, phone: '' }))
                }
                onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
                value={form.phone}
              />

              <BirthDateField
                error={errors.birthDate}
                onChange={(birthDate) => setForm((f) => ({ ...f, birthDate }))}
                value={form.birthDate}
              />
              <GenderSelect
                hint={
                  user.gender
                    ? 'Cinsiyet kayıt sonrası değiştirilemez.'
                    : 'Kadın veya Erkek seçin.'
                }
                locked={Boolean(user.gender)}
                onChange={(gender) => setForm((f) => ({ ...f, gender }))}
                value={
                  form.gender === 'female' || form.gender === 'male' ? form.gender : ''
                }
              />

              <Pressable onPress={() => setCityOpen(true)} style={styles.selectBtn}>
                <Text style={styles.selectLabel}>Şehir</Text>
                <Text style={styles.selectValue}>{form.city || 'Şehir seçin'}</Text>
                <Ionicons color={colors.sage[600]} name="chevron-down" size={16} />
              </Pressable>
              <Pressable
                disabled={!form.city}
                onPress={() => setDistrictOpen(true)}
                style={[styles.selectBtn, !form.city && styles.selectDisabled]}>
                <Text style={styles.selectLabel}>İlçe</Text>
                <Text style={styles.selectValue}>
                  {form.district || (form.city ? 'İlçe seçin' : '—')}
                </Text>
                <Ionicons color={colors.sage[600]} name="chevron-down" size={16} />
              </Pressable>

              <View style={styles.triple}>
                <View style={styles.tripleItem}>
                  <TextField
                    accent="warm"
                    error={errors.weight}
                    keyboardType="decimal-pad"
                    label="Kilo"
                    onChangeText={(weight) => setForm((f) => ({ ...f, weight }))}
                    value={form.weight}
                  />
                </View>
                <View style={styles.tripleItem}>
                  <TextField
                    error={errors.height}
                    keyboardType="decimal-pad"
                    label="Boy"
                    onChangeText={(height) => setForm((f) => ({ ...f, height }))}
                    value={form.height}
                  />
                </View>
                <View style={styles.tripleItem}>
                  <TextField
                    accent="warm"
                    error={errors.waist}
                    keyboardType="decimal-pad"
                    label="Bel"
                    onChangeText={(waist) => setForm((f) => ({ ...f, waist }))}
                    value={form.waist}
                  />
                </View>
              </View>

              <View style={styles.prefSection}>
                <Text style={[styles.prefTitle, { color: colors.warm[500] }]}>Hedefler</Text>
                <View style={styles.chipGrid}>
                  {GOALS.map((g) => (
                    <View key={g.value} style={styles.chipWrap}>
                      <ChoiceChip
                        icon={g.icon}
                        label={g.label}
                        onPress={() => toggleGoal(g.value)}
                        selected={form.goals.includes(g.value)}
                        tone={g.tone}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.prefSection}>
                <Text style={[styles.prefTitle, { color: colors.brand[700] }]}>
                  Spor Seviyesi
                </Text>
                <View style={styles.chipGrid}>
                  {FITNESS_LEVELS.map((f) => (
                    <View key={f.value} style={styles.chipWrap}>
                      <ChoiceChip
                        hint={f.hint}
                        icon={f.icon}
                        label={f.label}
                        onPress={() => setForm((prev) => ({ ...prev, fitnessLevel: f.value }))}
                        selected={form.fitnessLevel === f.value}
                        tone={f.tone}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.prefSection}>
                <Text style={[styles.prefTitle, { color: colors.sage[700] }]}>
                  Beslenme Tercihleri
                </Text>
                <View style={styles.chipGrid}>
                  {NUTRITION_PREFS.map((p) => (
                    <View key={p.value} style={styles.chipWrap}>
                      <ChoiceChip
                        icon={p.icon}
                        label={p.label}
                        onPress={() => toggleNutrition(p.value)}
                        selected={form.nutritionPrefs.includes(p.value)}
                        tone={p.tone}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <Button
                label={saving ? 'Kaydediliyor…' : 'Kaydet'}
                loading={saving}
                onPress={() => void handleSave()}
              />
              <Button
                label="Vazgeç"
                onPress={() => !saving && setOpen(false)}
                variant="ghost"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SelectSheet
        onClose={() => setCityOpen(false)}
        onSelect={(city) => setForm((f) => ({ ...f, city, district: '' }))}
        options={CITY_NAMES.map((c) => ({ value: c, label: c }))}
        title="Şehir seçin"
        value={form.city}
        visible={cityOpen}
      />
      <SelectSheet
        onClose={() => setDistrictOpen(false)}
        onSelect={(district) => setForm((f) => ({ ...f, district }))}
        options={districts.map((d) => ({ value: d, label: d }))}
        title="İlçe seçin"
        value={form.district}
        visible={districtOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  editBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: 12,
    marginBottom: spacing.sm,
  },
  hintBannerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.warm[500],
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCell: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[100],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 0,
  },
  infoCellFull: {
    width: '100%',
    flexGrow: 0,
  },
  infoCellHalf: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '100%',
  },
  infoLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 2,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.cream[900],
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    maxHeight: '92%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  photoHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    marginTop: 2,
  },
  fieldHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: -4,
  },
  selectBtn: {
    minHeight: 56,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.sage[200],
    backgroundColor: colors.sage[50],
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectDisabled: { opacity: 0.55 },
  selectLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.sage[700],
    width: 40,
  },
  selectValue: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.cream[900],
  },
  triple: { flexDirection: 'row', gap: 8 },
  tripleItem: { flex: 1 },
  prefSection: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
    gap: spacing.sm,
  },
  prefTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    textAlign: 'center',
  },
  chipGrid: { gap: 8 },
  chipWrap: { width: '100%' },
});
