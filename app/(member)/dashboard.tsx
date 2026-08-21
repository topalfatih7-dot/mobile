import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { WeeklyAdherenceCard } from '@/components/dashboard/WeeklyAdherenceCard';
import { WeightChart } from '@/components/dashboard/WeightChart';
import { ActivationChecklist } from '@/components/dashboard/ActivationChecklist';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { MembershipBadge } from '@/components/home/MembershipBadge';
import { QuickLinkTile } from '@/components/home/QuickLinkTile';
import { StatCard } from '@/components/home/StatCard';
import { FreeTrialExpiredGate } from '@/components/membership/FreeTrialExpiredGate';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { Button } from '@/components/ui/Button';
import { PANEL_IMAGES } from '@/constants/panelImages';
import { useActions } from '@/context/ActionsContext';
import { useAuth } from '@/context/AuthContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { getPlanLabel, isPaidMembership, packageIncludesDoctor } from '@/data/membershipPlans';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { listCancelAtPeriodEndPackages } from '@/utils/memberPackages';
import { useDailyTip } from '@/hooks/useDailyTip';
import { useHealthAnalysisSync } from '@/hooks/useHealthAnalysisSync';
import { getHealthTestLockState } from '@/services/healthScoreAnalysis';
import { getRemainingDays } from '@/services/premiumMembership';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { blogPostHref, resolveBlogCover } from '@/utils/blog';
import { resolveFirstName } from '@/utils/displayName';
import { buildWeeklyAdherence } from '@/utils/memberProgress';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/member/dashboard.md
 * Web parity: Adsız DashboardPage.jsx
 */
export default function MemberDashboard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const { email } = useAuth();
  const member = useMember();
  const { myPrograms, isFreeTrialExpired, isUnpaidMember, posts } = useData();
  const { tip: dailyTip, loading: tipLoading } = useDailyTip();
  const {
    analysis: healthAnalysis,
    history: healthScoreHistory,
    loading: healthScoreLoading,
    detailedComplete,
    error: healthScoreError,
  } = useHealthAnalysisSync();
  const healthAnalysisReady = Boolean(
    healthAnalysis &&
      healthAnalysis.overallScore != null &&
      healthAnalysis.scores,
  );
  const healthLockState = useMemo(() => {
    const ht = (member?.healthTest as Record<string, unknown>) || {};
    return getHealthTestLockState({
      healthAnalysis: healthAnalysis,
      detailedComplete,
      optionalCompletedAt: ht.optionalCompletedAt
        ? String(ht.optionalCompletedAt)
        : null,
    });
  }, [member?.healthTest, healthAnalysis, detailedComplete]);
  const { submitSuccessStory } = useActions();
  const { toast } = useToast();
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyDuration, setStoryDuration] = useState('');
  const [storyConsent, setStoryConsent] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const offerWebPurchase = canOfferWebPurchase();

  const membership = String(member?.membership || 'free');
  const membershipStatus = String(member?.membershipStatus || 'active');
  const freeTrialExpiresAt = member?.freeTrialExpiresAt
    ? String(member.freeTrialExpiresAt)
    : null;
  const premiumExpiresAt = member?.premiumExpiresAt ? String(member.premiumExpiresAt) : null;
  const premiumStartedAt = member?.premiumStartedAt ? String(member.premiumStartedAt) : null;

  const premiumRemainingDays = useMemo(
    () => getRemainingDays(premiumExpiresAt),
    [premiumExpiresAt],
  );
  const showExpiringBanner = Boolean(
    isPaidMembership(membership) &&
      (membershipStatus === 'expiring' ||
        (premiumRemainingDays != null &&
          premiumRemainingDays > 0 &&
          premiumRemainingDays <= 7)),
  );
  const cancelPendingPackages = useMemo(
    () => listCancelAtPeriodEndPackages(member),
    [member],
  );
  const showPaidExpiredBanner = Boolean(
    membership === 'free' &&
      premiumStartedAt &&
      !freeTrialExpiresAt &&
      !isFreeTrialExpired,
  );

  const weekly = useMemo(
    () =>
      buildWeeklyAdherence(
        myPrograms,
        (member?.completedActivities as Record<string, string[]>) || {},
        member as never,
      ),
    [myPrograms, member],
  );

  const coachSessions =
    (member?.coachSessions as { status?: string; date?: string; title?: string }[]) || [];
  const dietitianSessions =
    (member?.dietitianSessions as { status?: string; date?: string; title?: string }[]) || [];
  const doctorSessions =
    (member?.doctorSessions as { status?: string; date?: string; title?: string }[]) || [];
  const nextCoach = coachSessions.find(
    (s) => s.status === 'scheduled' && s.date && new Date(s.date) > new Date(),
  );
  const nextDietitian = dietitianSessions.find(
    (s) => s.status === 'scheduled' && s.date && new Date(s.date) > new Date(),
  );
  const nextDoctor = doctorSessions.find(
    (s) => s.status === 'scheduled' && s.date && new Date(s.date) > new Date(),
  );
  const packageConfig =
    (member?.packageConfig as Record<string, unknown>) || {};
  const showDoctorStat =
    packageIncludesDoctor(packageConfig) ||
    (Number(packageConfig.doctorSessionsTotal) || 0) > 0 ||
    Boolean(member?.assignedDoctorId);

  const progress =
    (member?.progress as { weight?: { date?: string; value?: number }[] }) || {};
  const weightData = Array.isArray(progress.weight) ? progress.weight : [];
  const latestPosts = useMemo(
    () =>
      [...posts]
        .filter((post) => post.published)
        .sort(
          (a, b) =>
            new Date(String(b.createdAt || 0)).getTime() -
            new Date(String(a.createdAt || 0)).getTime(),
        )
        .slice(0, 3),
    [posts],
  );
  const firstName = resolveFirstName({
    name: String(member?.name || ''),
    email: email || undefined,
  });
  const today = new Date();

  const resetStoryForm = () => {
    setStoryText('');
    setStoryDuration('');
    setStoryConsent(false);
  };

  const handleStoryClose = () => {
    if (storySaving) return;
    setStoryOpen(false);
  };

  const handleStorySubmit = async () => {
    if (storySaving) return;
    setStorySaving(true);
    const r = await submitSuccessStory({
      story: storyText,
      duration: storyDuration,
      consent: storyConsent,
    });
    setStorySaving(false);
    if (!r.ok) {
      toast(r.error, 'warning');
      return;
    }
    resetStoryForm();
    setStoryOpen(false);
  };

  if (isFreeTrialExpired) {
    return <FreeTrialExpiredGate />;
  }

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <ActivationChecklist
          userId={member?.id ? String(member.id) : null}
          membership={membership}
          packageConfig={packageConfig}
          healthAck={member?.healthAck}
          disclaimer={member?.disclaimer}
          healthTest={(member?.healthTest as Record<string, unknown>) || null}
          gender={member?.gender ? String(member.gender) : null}
          myPrograms={isUnpaidMember ? [] : myPrograms}
          coachSessions={coachSessions}
          dietitianSessions={dietitianSessions}
          doctorSessions={doctorSessions}
        />

        <FadeIn>
          <View style={styles.hero}>
            <Image
              contentFit="cover"
              source={{ uri: PANEL_IMAGES.dashboardHero.url }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(26,69,92,0.15)', 'rgba(26,69,92,0.78)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <Text numberOfLines={1} style={styles.heroDate}>
                {format(today, 'd MMMM yyyy, EEEE', { locale: tr })}
              </Text>
              <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
                {firstName}, bugün harika bir gün olabilir
              </Text>
              <Text style={styles.heroSub}>
                Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak
                ilerleyin.
              </Text>
              <View style={[styles.heroCtas, isNarrow && styles.heroCtasNarrow]}>
                <Pressable
                  onPress={() => router.push('/(member)/calendar')}
                  style={styles.ctaPrimary}>
                  <Ionicons color={colors.brand[700]} name="calendar" size={15} />
                  <Text style={styles.ctaPrimaryText} numberOfLines={1}>
                    Bugünkü Programım
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(member)/health-test' as Href)}
                  style={styles.ctaGhost}>
                  <Ionicons color={colors.white} name="heart" size={15} />
                  <Text style={styles.ctaGhostText} numberOfLines={1}>
                    Kişisel Sağlık Analizi
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={40}>
          <HealthScoreCard
            analysis={healthAnalysis}
            complete={healthAnalysisReady}
            error={healthScoreError}
            history={healthScoreHistory}
            loading={healthScoreLoading}
            lockState={healthLockState}
            scoresOnly={isUnpaidMember}
          />
        </FadeIn>

        <FadeIn delay={60}>
          <View style={styles.tip}>
            <View style={[styles.tipIcon, tipLoading && styles.pulse]}>
              <Ionicons color={colors.white} name="sparkles" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipLabel}>Günün ipucu</Text>
              <Text style={[styles.tipBody, tipLoading && { opacity: 0.6 }]}>{dailyTip}</Text>
            </View>
          </View>
        </FadeIn>

        {membership === 'free' && freeTrialExpiresAt && !isFreeTrialExpired ? (
          <FadeIn delay={90}>
            <View style={styles.bannerAmber}>
              <Ionicons color={colors.gold[500]} name="diamond" size={18} />
              <Text style={styles.bannerAmberText}>
                Deneme süreniz:{' '}
                <Text style={styles.bold}>
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(freeTrialExpiresAt).getTime() - Date.now()) / 3600000,
                    ),
                  )}{' '}
                  saat
                </Text>{' '}
                kaldı.
              </Text>
              {offerWebPurchase ? (
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Üye Ol</Text>
              </Pressable>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        {cancelPendingPackages.length > 0 ? (
          <FadeIn delay={90}>
            <View style={styles.bannerAmber}>
              <Ionicons color={colors.warm[500]} name="pause-circle" size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Yenileme kapalı</Text>
                <Text style={styles.bannerSub}>
                  {cancelPendingPackages
                    .map(
                      (pkg: {
                        currentPeriodEnd?: string | null;
                        expiresAt?: string | null;
                        planId?: string;
                      }) => {
                        const periodEnd = pkg.currentPeriodEnd || pkg.expiresAt;
                        return MEMBERSHIP_CANCEL_COPY.renewalOffBanner(
                          periodEnd
                            ? format(new Date(periodEnd), 'd MMMM yyyy', { locale: tr })
                            : 'dönem sonu',
                          getPlanLabel(pkg.planId),
                        );
                      },
                    )
                    .join(' ')}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={[styles.bannerBtn, { backgroundColor: colors.warm[500] }]}>
                <Text style={styles.bannerBtnText}>Ödeme Yönetimi</Text>
              </Pressable>
            </View>
          </FadeIn>
        ) : null}

        {showExpiringBanner ? (
          <FadeIn delay={100}>
            <View style={styles.bannerAmber}>
              <Ionicons color={colors.warm[500]} name="time" size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  Paket süreniz bitmek üzere
                  {premiumRemainingDays != null ? (
                    <>
                      {' '}
                      — <Text style={styles.bold}>{premiumRemainingDays} gün</Text> kaldı
                    </>
                  ) : null}
                </Text>
                <Text style={styles.bannerSub}>
                  {offerWebPurchase
                    ? 'Kesintisiz devam için planınızı yenileyin. Son gün dahil erişiminiz sürer.'
                    : 'Son gün dahil erişiminiz sürer. İptal için Ödeme Yönetimi.'}
                </Text>
              </View>
              {offerWebPurchase ? (
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={[styles.bannerBtn, { backgroundColor: colors.warm[500] }]}>
                <Text style={styles.bannerBtnText}>Yenile</Text>
              </Pressable>
              ) : (
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={[styles.bannerBtn, { backgroundColor: colors.warm[500] }]}>
                <Text style={styles.bannerBtnText}>Ödeme Yönetimi</Text>
              </Pressable>
              )}
            </View>
          </FadeIn>
        ) : null}

        {showPaidExpiredBanner ? (
          <FadeIn delay={110}>
            <View style={styles.bannerBrand}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitleDark}>Paket süreniz doldu</Text>
                <Text style={styles.bannerSubDark}>
                  {offerWebPurchase
                    ? 'Ücretli özellikler kapandı. Devam etmek için bir plan seçip yenileyin.'
                    : MEMBERSHIP_CANCEL_COPY.iosExpiredBanner}
                </Text>
              </View>
              {offerWebPurchase ? (
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={styles.pillBrand}>
                <Text style={styles.pillBrandText}>Planı Yenile</Text>
              </Pressable>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        {membership === 'free' && !showPaidExpiredBanner ? (
          <FadeIn delay={120}>
            <View style={styles.bannerBrand}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitleDark}>Daha fazlasını keşfedin</Text>
                <Text style={styles.bannerSubDark}>
                  {offerWebPurchase
                    ? 'Birebir koç & diyetisyen desteği için ücretli planlarımız'
                    : MEMBERSHIP_CANCEL_COPY.iosUpsellSub}
                </Text>
              </View>
              {offerWebPurchase ? (
              <Pressable
                onPress={() => router.push('/(member)/profile/payments')}
                style={styles.pillBrand}>
                <Text style={styles.pillBrandText}>Planları İncele</Text>
              </Pressable>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={140}>
          <View style={styles.rowBetween}>
            <MembershipBadge
              status={membershipStatus !== 'active' ? membershipStatus : null}
              tier={membership}
            />
            <Pressable
              onPress={() => router.push('/(member)/support')}
              style={styles.supportChip}>
              <Ionicons color={colors.cream[800]} name="chatbubble-ellipses-outline" size={14} />
              <Text style={styles.supportText}>Destek Alanı</Text>
            </Pressable>
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={styles.stats}>
            <StatCard
              accent="brand"
              icon="diamond"
              label="Aktif Plan"
              onPress={() => router.push('/(member)/profile/payments')}
              sub={membership === 'free' ? 'Sağlık testi' : 'Koç & Diyetisyen destekli'}
              value={getPlanLabel(membership)}
            />
            <StatCard
              accent="sage"
              icon="barbell"
              label="Sonraki Koç"
              onPress={() => router.push('/(member)/schedule?tab=coach' as Href)}
              sub={nextCoach?.title || 'Planlanmadı'}
              value={
                nextCoach?.date
                  ? format(new Date(nextCoach.date), 'd MMM', { locale: tr })
                  : '—'
              }
            />
            <StatCard
              accent="warm"
              icon="nutrition"
              label="Sonraki Diyetisyen"
              onPress={() => router.push('/(member)/schedule?tab=dietitian' as Href)}
              sub={nextDietitian?.title || 'Planlanmadı'}
              value={
                nextDietitian?.date
                  ? format(new Date(nextDietitian.date), 'd MMM', { locale: tr })
                  : '—'
              }
            />
            {showDoctorStat ? (
              <StatCard
                accent="brand"
                icon="medkit"
                label="Sonraki Doktor"
                onPress={() => router.push('/(member)/schedule?tab=doctor' as Href)}
                sub={nextDoctor?.title || 'Planlanmadı'}
                value={
                  nextDoctor?.date
                    ? format(new Date(nextDoctor.date), 'd MMM', { locale: tr })
                    : '—'
                }
              />
            ) : null}
            <StatCard
              accent="gold"
              icon="flame"
              label="Seri"
              sub="Kesintisiz gün"
              value={`${Number(member?.streak ?? 0)} gün`}
            />
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <View style={styles.charts}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Kilo Trendi</Text>
              {weightData.length ? (
                <WeightChart data={weightData} />
              ) : (
                <View style={styles.chartEmpty}>
                  <Ionicons color={colors.cream[300]} name="trending-up" size={28} />
                  <Text style={styles.chartEmptyText}>Kilo kayıtlarınız burada görünecek</Text>
                </View>
              )}
            </View>
            <WeeklyAdherenceCard
              accent="brand"
              data={weekly}
              emptyMessage="Antrenman verileriniz burada görünecek"
              icon="barbell-outline"
              metric="workout"
              title="Antrenman Takibi"
            />
            <WeeklyAdherenceCard
              accent="sage"
              data={weekly}
              emptyMessage="Diyetisyen listeniz eklendikçe öğün verileri burada görünür"
              icon="nutrition-outline"
              metric="meal"
              title="Öğün Takibi"
            />
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={styles.quick}>
            <QuickLinkTile
              icon="calendar"
              onPress={() => router.push('/(member)/calendar')}
              sub="Günlük programınızı görün"
              title="Program Takvimi"
              tone="brand"
            />
            <QuickLinkTile
              icon="clipboard"
              onPress={() => router.push('/(member)/programs')}
              sub={
                myPrograms.length > 0
                  ? `${myPrograms.length} aktif program`
                  : 'Koç & diyetisyen programları'
              }
              title="Programlarım"
              tone="sage"
            />
            <QuickLinkTile
              icon="play"
              onPress={() => router.push('/(member)/library')}
              sub="Egzersiz & beslenme videoları"
              title="Video Kütüphanesi"
              tone="cream"
            />
            <QuickLinkTile
              icon="star"
              onPress={() => setStoryOpen(true)}
              sub="Yolculuğunla başkalarına ilham ver"
              title="Başarı Hikayeni Paylaş"
              tone="gold"
            />
          </View>
        </FadeIn>

        {latestPosts.length > 0 ? (
          <FadeIn delay={280}>
            <View style={styles.blogSection}>
              <View style={styles.blogHeader}>
                <View style={styles.blogHeading}>
                  <Ionicons color={colors.brand[500]} name="book-outline" size={20} />
                  <Text style={styles.blogSectionTitle}>Sizin için okumalar</Text>
                </View>
                <Pressable onPress={() => router.push('/(public)/blog' as Href)}>
                  <Text style={styles.blogAll}>Tümünü gör →</Text>
                </Pressable>
              </View>
              {latestPosts.map((post) => {
                const category = String(post.category || 'Yaşam');
                const cover = resolveBlogCover(post);
                return (
                  <Pressable
                    key={String(post.id)}
                    onPress={() => router.push(blogPostHref(post) as Href)}
                    style={styles.blogCard}>
                    <Image
                      accessibilityLabel={cover.alt}
                      contentFit="cover"
                      source={{ uri: cover.url }}
                      style={styles.blogCover}
                    />
                    <View style={styles.blogBody}>
                      <Text style={styles.blogCategory}>{category}</Text>
                      <Text numberOfLines={2} style={styles.blogTitle}>
                        {String(post.title || '')}
                      </Text>
                      {post.excerpt ? (
                        <Text numberOfLines={2} style={styles.blogExcerpt}>
                          {String(post.excerpt)}
                        </Text>
                      ) : null}
                      {post.readMinutes ? (
                        <Text style={styles.blogRead}>{String(post.readMinutes)} dk okuma</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </FadeIn>
        ) : null}
      </ScrollView>

      {storyOpen ? (
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleStoryClose} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Başarı Hikayesi Gönder</Text>
            <View style={styles.modalHint}>
              <Ionicons color={colors.gold[500]} name="star" size={18} />
              <Text style={styles.modalHintText}>
                Deneyiminizi paylaşarak başkalarına ilham verin. Hikayeniz ekibimizce
                incelendikten sonra yayınlanır.
              </Text>
            </View>
            <TextInput
              editable={!storySaving}
              multiline
              onChangeText={setStoryText}
              placeholder="Yolculuğunuzu kısaca anlatın... (nasıl başladınız, neler değişti, nasıl hissediyorsunuz)"
              placeholderTextColor={colors.cream[300]}
              style={styles.modalInput}
              value={storyText}
            />
            <TextInput
              editable={!storySaving}
              onChangeText={setStoryDuration}
              placeholder="Program süreniz (ör. 12 hafta)"
              placeholderTextColor={colors.cream[300]}
              style={styles.modalInputSingle}
              value={storyDuration}
            />
            <Pressable
              disabled={storySaving}
              onPress={() => setStoryConsent((v) => !v)}
              style={styles.consentRow}>
              <View style={[styles.checkbox, storyConsent && styles.checkboxOn]}>
                {storyConsent ? (
                  <Ionicons color={colors.white} name="checkmark" size={14} />
                ) : null}
              </View>
              <Text style={styles.consentText}>
                Hikayemin platformda paylaşılmasına onay veriyorum. Tıbbi sonuç veya garanti
                iddiası içermeyeceğini kabul ediyorum.
              </Text>
            </Pressable>
            <Button
              disabled={storySaving}
              label={storySaving ? 'Gönderiliyor…' : 'Gönder'}
              onPress={() => void handleStorySubmit()}
            />
            <Button
              disabled={storySaving}
              label="Kapat"
              onPress={handleStoryClose}
              variant="ghost"
            />
          </View>
        </View>
      ) : null}
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  hero: {
    minHeight: 248,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  heroContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: 8,
  },
  heroDate: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.88)',
    flexShrink: 1,
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  heroTitleNarrow: {
    fontSize: 20,
    lineHeight: 26,
  },
  heroSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.92)',
    flexShrink: 1,
  },
  heroCtas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroCtasNarrow: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ctaPrimaryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[700],
    flexShrink: 1,
  },
  ctaGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ctaGhostText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.white,
    flexShrink: 1,
  },
  tip: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.35)',
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { opacity: 0.7 },
  tipLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.gold[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tipBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[900],
    marginTop: 2,
  },
  bannerAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  bannerAmberText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
  },
  bannerTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  bannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.8,
    marginTop: 2,
  },
  bannerBtn: {
    flexShrink: 0,
    backgroundColor: colors.gold[500],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  bannerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    padding: spacing.md,
  },
  bannerTitleDark: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  bannerSubDark: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 2,
  },
  pillBrand: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillBrandText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  bold: { fontFamily: fonts.sansBold },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  supportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  supportText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.cream[800] },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  charts: { gap: spacing.md },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    minHeight: 140,
  },
  chartTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
    marginBottom: spacing.sm,
  },
  chartEmpty: {
    flex: 1,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartEmptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.5,
    textAlign: 'center',
  },
  quick: { gap: spacing.md },
  blogSection: { gap: spacing.sm },
  blogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  blogHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blogSectionTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream[900],
  },
  blogAll: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600] },
  blogCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  blogCover: { width: 112, minHeight: 116 },
  blogBody: { flex: 1, padding: spacing.md },
  blogCategory: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.brand[700],
  },
  blogTitle: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.cream[900],
  },
  blogExcerpt: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    color: colors.cream[800],
    opacity: 0.6,
  },
  blogRead: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.5,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '92%',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  modalHint: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    padding: spacing.md,
  },
  modalHintText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.75,
  },
  modalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlignVertical: 'top',
    color: colors.cream[900],
  },
  modalInputSingle: {
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[50],
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.cream[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  consentText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.75,
  },
});
