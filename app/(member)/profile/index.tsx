import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { MembershipBadge } from '@/components/home/MembershipBadge';
import { FreeTrialExpiredProfileAlert } from '@/components/membership/FreeTrialExpiredGate';
import { HealthSummarySection } from '@/components/profile/HealthSummarySection';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { VerificationSection } from '@/components/profile/VerificationSection';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { TextField } from '@/components/ui/TextField';
import { PANEL_IMAGES } from '@/constants/panelImages';
import { useActions } from '@/context/ActionsContext';
import { useAuth } from '@/context/AuthContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { CITY_NAMES, getDistricts } from '@/data/turkeyCities';
import {
  getPlanLabel,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';
import {
  confirmEmailVerification,
  confirmPhoneVerification,
  refreshEmailVerification,
  sendEmailVerification,
  sendPhoneVerification,
} from '@/services/authVerification';
import { uploadMemberFile } from '@/services/memberMedia';
import { getRemainingDays } from '@/services/premiumMembership';
import {
  countUsedDoctorSessions,
  isOneTimePlan,
  isPackageEntryActive,
  migrateLegacyToPackages,
  resolveMemberEntitlements,
} from '@/utils/memberPackages';
import { pickProfilePhoto } from '@/utils/pickProfilePhoto';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/member/profile.md — web ProfilePage parity */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { email, logout, registeredMember, refreshAuth } = useAuth();
  const member = useMember();
  const { myPrograms, staffById, isFreeTrialExpired, refreshData } = useData();
  const { updateProfile, updateSettings } = useActions();
  const { toast } = useToast();

  const [loggingOut, setLoggingOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);

  const [name, setName] = useState(String(member?.name || ''));
  const [city, setCity] = useState(String(member?.city || ''));
  const [district, setDistrict] = useState(String(member?.district || ''));

  const membership = String(member?.membership || 'free');
  const membershipStatus = String(member?.membershipStatus || 'active');
  const settings = (member?.settings as Record<string, unknown>) || {};
  const photo = member?.photo ? String(member.photo) : '';

  const activePackages = useMemo(
    () =>
      migrateLegacyToPackages(member).filter((p: { status?: string }) =>
        isPackageEntryActive(p),
      ),
    [member],
  );

  const preferredPkgId = useMemo(() => {
    if (!activePackages.length) return null;
    const match = activePackages.find(
      (p: { planId?: string }) => p.planId === membership,
    );
    return String((match || activePackages[0]).id);
  }, [activePackages, membership]);

  const effectivePkgId =
    selectedPkgId &&
    activePackages.some((p: { id?: string }) => String(p.id) === selectedPkgId)
      ? selectedPkgId
      : preferredPkgId;

  const selectedPackage = activePackages.find(
    (p: { id?: string }) => String(p.id) === effectivePkgId,
  ) as
    | {
        id?: string;
        planId?: string;
        expiresAt?: string | null;
        packageConfig?: { doctorSessionsTotal?: number };
      }
    | undefined;

  const selectedRemainingDays = selectedPackage?.expiresAt
    ? getRemainingDays(selectedPackage.expiresAt)
    : null;
  const selectedExpiringSoon =
    selectedRemainingDays != null &&
    selectedRemainingDays > 0 &&
    selectedRemainingDays <= 7;

  const coach = member?.assignedCoachId
    ? staffById[String(member.assignedCoachId)]
    : null;
  const dietitian = member?.assignedDietitianId
    ? staffById[String(member.assignedDietitianId)]
    : null;
  const doctor = member?.assignedDoctorId
    ? staffById[String(member.assignedDoctorId)]
    : null;

  const { packageConfig } = useMemo(
    () =>
      member
        ? resolveMemberEntitlements(member as never)
        : { packageConfig: {} as Record<string, unknown> },
    [member],
  );

  /** Web ProfilePage expertCards — yalnızca pakette olan roller */
  const experts = useMemo(() => {
    const cards: {
      label: string;
      name: string;
      href: Href;
      icon: 'barbell' | 'nutrition' | 'medkit';
      color: string;
    }[] = [];
    const pkg = (packageConfig || {}) as Record<string, unknown>;
    if (packageIncludesCoach(pkg)) {
      cards.push({
        label: 'Koç',
        name: coach ? String(coach.name || '') : '',
        href: '/(member)/schedule?tab=coach',
        icon: 'barbell',
        color: colors.brand[500],
      });
    }
    if (packageIncludesDietitian(pkg)) {
      cards.push({
        label: 'Diyetisyen',
        name: dietitian ? String(dietitian.name || '') : '',
        href: '/(member)/schedule?tab=dietitian',
        icon: 'nutrition',
        color: colors.sage[500],
      });
    }
    const offersDoctor =
      packageIncludesDoctor(pkg) ||
      (Number(pkg.doctorSessionsTotal) || 0) > 0 ||
      (Number(pkg.doctorMeetingsPerMonth) || 0) > 0 ||
      Boolean(member?.assignedDoctorId);
    if (offersDoctor) {
      cards.push({
        label: 'Doktor',
        name: doctor ? String(doctor.name || '') : '',
        href: '/(member)/schedule?tab=doctor',
        icon: 'medkit',
        color: colors.warm[500],
      });
    }
    return cards;
  }, [packageConfig, coach, dietitian, doctor, member?.assignedDoctorId]);

  const quickLinks = [
    {
      t: 'Programlarım',
      sub: `${myPrograms.length} program`,
      href: '/(member)/programs' as Href,
      icon: 'clipboard' as const,
      colors: [colors.brand[500], colors.brand[600]] as [string, string],
    },
    {
      t: 'Takvim',
      sub: 'Müsaitlik',
      href: '/(member)/calendar' as Href,
      icon: 'calendar' as const,
      colors: [colors.sage[500], colors.sage[600]] as [string, string],
    },
    {
      t: 'Kalori',
      sub: 'Tahmini hesap',
      href: '/(member)/calorie' as Href,
      icon: 'flame' as const,
      colors: [colors.gold[500], colors.warm[500]] as [string, string],
    },
    {
      t: 'Destek',
      sub: 'Yardım & talepler',
      href: '/(member)/support' as Href,
      icon: 'shield' as const,
      colors: ['#8b5cf6', '#7c3aed'] as [string, string],
    },
  ];

  const openHeroEdit = () => {
    setName(String(member?.name || ''));
    setCity(String(member?.city || ''));
    setDistrict(String(member?.district || ''));
    setEditOpen(true);
  };

  const onSaveHeroEdit = async () => {
    setSaving(true);
    try {
      await updateProfile(
        {
          name: name.trim(),
          city: city.trim(),
          district: district.trim(),
        },
        { toastMsg: 'Profil güncellendi' },
      );
      setEditOpen(false);
    } catch (err) {
      toast((err as Error)?.message || 'Profil güncellenemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = async () => {
    if (!member?.id) return;
    const wasOpen = editOpen;
    try {
      const picked = await pickProfilePhoto({
        // ImagePicker, açık RN Modal üstünde iOS'ta açılmaz
        beforePick: wasOpen ? () => setEditOpen(false) : undefined,
        afterPick: wasOpen ? () => setEditOpen(true) : undefined,
      });
      // null = vazgeç / izin yok — sessiz dön
      if (!picked) return;
      setUploadingPhoto(true);
      // Web parity: members.data.photo = data URL (avatars bucket yok → Bucket not found)
      const uploaded = await uploadMemberFile({
        memberId: String(member.id),
        uri: picked.uri,
        folder: 'profile',
        contentType: 'image/jpeg',
      });
      if (!uploaded.ok) {
        toast(uploaded.error, 'error');
        return;
      }
      await updateProfile({ photo: uploaded.url }, { toastMsg: 'Profil fotoğrafı güncellendi' });
    } catch (e) {
      toast(String((e as Error)?.message || 'Fotoğraf seçilemedi'), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const refreshAll = useCallback(async () => {
    await refreshAuth();
    await refreshData();
  }, [refreshAuth, refreshData]);

  if (!member) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.empty, { paddingTop: insets.top + 40 }]}>
          <Text style={styles.emptyText}>Profil yükleniyor…</Text>
        </View>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {isFreeTrialExpired ? <FreeTrialExpiredProfileAlert /> : null}

        <FadeIn>
          <View style={styles.heroCard}>
            <View style={styles.cover}>
              <Image
                contentFit="cover"
                source={{ uri: PANEL_IMAGES.profileCover.url }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(36,120,168,0.35)', 'rgba(26,69,92,0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <Pressable
                accessibilityLabel="Profili düzenle"
                accessibilityRole="button"
                onPress={openHeroEdit}
                style={styles.editBtn}>
                <Ionicons color={colors.cream[900]} name="create-outline" size={14} />
                <Text style={styles.editBtnText}>Profili Düzenle</Text>
              </Pressable>
            </View>

            <View style={styles.identity}>
              <View style={styles.avatarWrap}>
                {photo ? (
                  <Image contentFit="cover" source={{ uri: photo }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={[colors.brand[400], colors.sage[500]]}
                    style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {String(member?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                <Pressable
                  accessibilityLabel="Fotoğraf değiştir"
                  disabled={uploadingPhoto}
                  onPress={() => void onPickPhoto()}
                  style={styles.cameraBtn}>
                  <Ionicons color={colors.white} name="camera" size={14} />
                </Pressable>
              </View>
              <Text style={styles.name}>
                {registeredMember
                  ? String(member?.name || '').trim() || 'Üye'
                  : 'Profil tamamlanacak'}
              </Text>
              <View style={styles.badgeRow}>
                <MembershipBadge
                  status={membershipStatus !== 'active' ? membershipStatus : null}
                  tier={membership}
                />
                <View style={styles.planPill}>
                  <Text style={styles.planPillText}>{getPlanLabel(membership)}</Text>
                </View>
              </View>
            </View>

            {experts.length > 0 ? (
              <View style={styles.experts}>
                {experts.map((e) => (
                  <Pressable
                    key={e.label}
                    onPress={() => router.push(e.href)}
                    style={styles.expertCard}>
                    <Ionicons color={e.color} name={e.icon} size={18} />
                    <Text style={styles.expertLabel}>{e.label}</Text>
                    <Text numberOfLines={1} style={styles.expertName}>
                      {e.name || 'Atanmadı'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </FadeIn>

        {member ? <HealthSummarySection user={member} /> : null}

        <View style={styles.quickGrid}>
          {quickLinks.map((l) => (
            <Pressable
              key={l.t}
              onPress={() => router.push(l.href)}
              style={styles.quickCard}>
              <LinearGradient colors={l.colors} style={styles.quickIcon}>
                <Ionicons color={colors.white} name={l.icon} size={18} />
              </LinearGradient>
              <Text style={styles.quickTitle}>{l.t}</Text>
              <Text style={styles.quickSub}>{l.sub}</Text>
            </Pressable>
          ))}
        </View>

        {member ? <PersonalInfoSection user={member} /> : null}

        <ProfileSectionCard
          accent="violet"
          delay={150}
          icon="shield"
          subtitle="Aktif paket süreniz"
          title="Üyelik Planınız">
          <Text style={styles.planBig}>{getPlanLabel(membership)}</Text>

          {activePackages.length > 1 ? (
            <View style={styles.pkgChips}>
              <Text style={styles.pkgChipsLabel}>Aktif Paketler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pkgChipRow}>
                  {activePackages.map(
                    (pkg: {
                      id?: string;
                      planId?: string;
                      expiresAt?: string | null;
                    }) => {
                      const isSelected = String(pkg.id) === effectivePkgId;
                      const pkgDays = pkg.expiresAt
                        ? getRemainingDays(pkg.expiresAt)
                        : null;
                      return (
                        <Pressable
                          key={String(pkg.id)}
                          onPress={() => setSelectedPkgId(String(pkg.id))}
                          style={[
                            styles.pkgChip,
                            isSelected && styles.pkgChipSelected,
                          ]}>
                          <Text
                            style={[
                              styles.pkgChipTitle,
                              isSelected && styles.pkgChipTitleOn,
                            ]}>
                            {getPlanLabel(pkg.planId)}
                          </Text>
                          <Text
                            style={[
                              styles.pkgChipMeta,
                              isSelected && styles.pkgChipMetaOn,
                            ]}>
                            {isOneTimePlan(pkg.planId)
                              ? 'Tek seferlik'
                              : pkgDays != null
                                ? `${pkgDays} gün`
                                : 'Aktif'}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </ScrollView>
            </View>
          ) : null}

          {membership !== 'free' && selectedPackage ? (
            <View style={styles.remainCard}>
              <View style={styles.remainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.remainLabel}>
                    Kalan Süre
                    {activePackages.length > 1
                      ? ` · ${getPlanLabel(selectedPackage.planId)}`
                      : ''}
                  </Text>
                  {isOneTimePlan(selectedPackage.planId) ? (
                    <>
                      <Text style={styles.remainValue}>
                        {Math.max(
                          0,
                          (Number(selectedPackage.packageConfig?.doctorSessionsTotal) ||
                            1) - countUsedDoctorSessions(member),
                        )}
                        <Text style={styles.remainUnit}> görüşme</Text>
                      </Text>
                      <Text style={styles.remainMeta}>
                        Tek seferlik paket — süre sınırı yok
                      </Text>
                    </>
                  ) : selectedPackage.expiresAt ? (
                    <>
                      <Text style={styles.remainValue}>
                        {selectedRemainingDays ?? '—'}
                        <Text style={styles.remainUnit}> gün</Text>
                      </Text>
                      <Text style={styles.remainMeta}>
                        {format(new Date(selectedPackage.expiresAt), 'd MMMM yyyy', {
                          locale: tr,
                        })}{' '}
                        tarihine kadar
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.remainMeta}>Süresiz aktif paket</Text>
                  )}
                </View>
                <View style={styles.remainIcon}>
                  <Ionicons color={colors.white} name="time" size={26} />
                </View>
              </View>
              {(selectedExpiringSoon ||
                (selectedRemainingDays != null && selectedRemainingDays <= 0)) && (
                <Text style={styles.expireWarn}>
                  {selectedRemainingDays != null && selectedRemainingDays <= 0
                    ? 'Bu paketin süresi doldu — yenilemek için destek ile iletişime geçin.'
                    : 'Bu paketin süresi yakında doluyor — yenilemek için destek ile iletişime geçin.'}
                </Text>
              )}
            </View>
          ) : null}

          {membership === 'free' ? (
            <Text style={styles.freeNote}>
              Ücretsiz plandasınız.{' '}
              <Text
                onPress={() => router.push('/(member)/profile/payments' as Href)}
                style={styles.freeLink}>
                Premium özellikler için plan yükseltin
              </Text>
            </Text>
          ) : null}

          <Pressable
            onPress={() => router.push('/(member)/profile/payments' as Href)}
            style={styles.compareBtn}>
            <Text style={styles.compareBtnText}>Planları karşılaştır / değiştir</Text>
          </Pressable>
        </ProfileSectionCard>

        <ProfileSectionCard
          accent="rose"
          delay={160}
          icon="notifications"
          subtitle="Tercihlerinizi yönetin"
          title="Bildirimler">
          <View style={styles.notifStack}>
            {[
              { key: 'emailNotifs', label: 'E-posta bildirimleri', tint: colors.brand[50] },
              { key: 'pushNotifs', label: 'Push bildirimleri', tint: colors.sage[50] },
              { key: 'soundNotifs', label: 'Bildirim sesleri', tint: '#f5f3ff' },
              { key: 'reminderNotifs', label: 'Hatırlatıcılar', tint: colors.warm[50] },
            ].map((t) => (
              <View key={t.key} style={[styles.notifRow, { backgroundColor: t.tint }]}>
                <CheckboxRow
                  checked={Boolean(settings[t.key])}
                  label={t.label}
                  onChange={(v) => void updateSettings({ [t.key]: v })}
                />
              </View>
            ))}
          </View>
        </ProfileSectionCard>

        <VerificationSection
          onConfirmEmailVerification={(code) =>
            confirmEmailVerification(code, member)
          }
          onConfirmPhoneVerification={(code, phone, countryIso, viaEmail) =>
            confirmPhoneVerification(code, phone, member, countryIso, viaEmail)
          }
          onRefresh={refreshAll}
          onRefreshStatus={() => refreshEmailVerification(member)}
          onSendEmailVerification={sendEmailVerification}
          onSendPhoneVerification={(phone, countryIso) =>
            sendPhoneVerification(phone, countryIso, member)
          }
          user={member}
          verificationStatus={{
            email: String(member.email || email || ''),
            phone: String(member.phone || ''),
            emailVerified: Boolean(member.emailVerifiedAt),
            phoneVerified: Boolean(member.phoneVerifiedAt),
            authPhone: '',
            canVerifyEmail: Boolean(member.email || email),
            canVerifyPhone: Boolean(member.phone),
          }}
        />

        <FadeIn delay={200}>
          <Button
            label={loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
            loading={loggingOut}
            onPress={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              try {
                await logout();
                toast('Çıkış yapıldı', 'info');
                router.replace('/(public)/landing' as Href);
              } finally {
                setLoggingOut(false);
              }
            }}
            variant="secondary"
          />
        </FadeIn>
      </ScrollView>

      <Modal animationType="slide" transparent visible={editOpen}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.grabHandle} />
            <Text style={styles.modalTitle}>Profil Fotoğrafı & İletişim</Text>
            <Pressable
              accessibilityLabel="Profil fotoğrafı seç"
              disabled={uploadingPhoto}
              onPress={() => void onPickPhoto()}
              style={styles.photoRow}>
              <View style={styles.photoPreview}>
                {photo ? (
                  <Image contentFit="cover" source={{ uri: photo }} style={styles.photoImg} />
                ) : (
                  <Ionicons color={colors.brand[600]} name="camera" size={22} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoLabel}>Profil fotoğrafı</Text>
                <Text style={styles.photoHint}>
                  {uploadingPhoto
                    ? 'Yükleniyor…'
                    : photo
                      ? 'Kamera veya galeriden değiştirin.'
                      : 'Kamera veya galeriden fotoğraf seçin.'}
                </Text>
              </View>
              <Ionicons color={colors.brand[500]} name="chevron-forward" size={18} />
            </Pressable>
            <TextField label="Ad Soyad" onChangeText={setName} value={name} />
            <TextField editable={false} label="E-posta" value={email || ''} />
            <Text style={styles.fieldHint}>Kayıt e-postası değiştirilemez.</Text>
            <TextField
              editable={false}
              label="Telefon"
              value={String(member.phone || '')}
            />
            <Text style={styles.fieldHint}>
              Telefon numarası kayıt sonrası değiştirilemez.
            </Text>
            <Pressable onPress={() => setCityOpen(true)} style={styles.selectBtn}>
              <Text style={styles.selectLabel}>Şehir</Text>
              <Text style={styles.selectValue}>{city || 'Şehir seçin'}</Text>
              <Ionicons color={colors.sage[600]} name="chevron-down" size={16} />
            </Pressable>
            <Pressable
              disabled={!city}
              onPress={() => setDistrictOpen(true)}
              style={[styles.selectBtn, !city && { opacity: 0.55 }]}>
              <Text style={styles.selectLabel}>İlçe</Text>
              <Text style={styles.selectValue}>
                {district || (city ? 'İlçe seçin' : '—')}
              </Text>
              <Ionicons color={colors.sage[600]} name="chevron-down" size={16} />
            </Pressable>
            <Button label="Kaydet" loading={saving} onPress={() => void onSaveHeroEdit()} />
            <Button label="Vazgeç" onPress={() => setEditOpen(false)} variant="ghost" />
          </View>
        </View>
      </Modal>

      <SelectSheet
        onClose={() => setCityOpen(false)}
        onSelect={(c) => {
          setCity(c);
          setDistrict('');
        }}
        options={CITY_NAMES.map((c) => ({ value: c, label: c }))}
        title="Şehir seçin"
        value={city}
        visible={cityOpen}
      />
      <SelectSheet
        onClose={() => setDistrictOpen(false)}
        onSelect={setDistrict}
        options={getDistricts(city).map((d) => ({ value: d, label: d }))}
        title="İlçe seçin"
        value={district}
        visible={districtOpen}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  empty: { alignItems: 'center' },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cover: { height: 140 },
  editBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[900] },
  identity: {
    alignItems: 'center',
    marginTop: -56,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  cameraBtn: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarLetter: {
    fontFamily: fonts.displayExtra,
    fontSize: 40,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  planPill: {
    backgroundColor: colors.sage[50],
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planPillText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.sage[700] },
  experts: { flexDirection: 'row', gap: 8, padding: spacing.md, paddingTop: 0 },
  expertCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.sm,
    gap: 4,
  },
  expertLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900] },
  expertName: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: 6,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  quickSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
  },
  planBig: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
  },
  pkgChips: { marginTop: spacing.md },
  pkgChipsLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: '#7c3aed',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pkgChipRow: { flexDirection: 'row', gap: 8 },
  pkgChip: {
    borderRadius: radius.full,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pkgChipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  pkgChipTitle: { fontFamily: fonts.sansSemi, fontSize: 12, color: '#5b21b6' },
  pkgChipTitleOn: { color: colors.white },
  pkgChipMeta: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: '#7c3aed',
    opacity: 0.75,
  },
  pkgChipMetaOn: { color: 'rgba(255,255,255,0.85)' },
  remainCard: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#faf5ff',
    padding: spacing.md,
  },
  remainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  remainLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: '#7c3aed',
    textTransform: 'uppercase',
  },
  remainValue: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: '#7c3aed',
  },
  remainUnit: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: '#6d28d9',
  },
  remainMeta: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  remainIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expireWarn: {
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.warm[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.warm[500],
  },
  freeNote: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    opacity: 0.65,
  },
  freeLink: { fontFamily: fonts.sansSemi, color: colors.brand[600] },
  compareBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compareBtnText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#5b21b6' },
  notifStack: { gap: 10 },
  notifRow: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[100],
    paddingHorizontal: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  grabHandle: {
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
});
