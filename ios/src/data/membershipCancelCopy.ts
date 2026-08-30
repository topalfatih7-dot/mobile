/** Üyelik iptali — web `membershipCancelCopy.js` parity */

export const MEMBERSHIP_CANCEL_SUPPORT_EMAIL = 'info@yeniform.com';

/** Destek sitesi (App Store 3.1.3(f): /plans veya checkout değil). */
export const MEMBERSHIP_SUPPORT_SITE_URL = 'https://www.yeniform.com';

/**
 * App Store 3.1.3(f) — satın alma CTA yok.
 * Satın alma uygulama içinde yok; bilgi için e-posta veya web destek.
 */
export const IOS_OUT_OF_APP_PURCHASE_NOTICE =
  'Üyelik satın alımları uygulama içerisinden yapılmamaktadır. Bilgi için info@yeniform.com adresine yazabilir veya web sitemizden bize ulaşabilirsiniz.';

export function iosLockedFeatureCopy(lead: string): string {
  const prefix = String(lead || '').trim();
  if (!prefix) return IOS_OUT_OF_APP_PURCHASE_NOTICE;
  return `${prefix} ${IOS_OUT_OF_APP_PURCHASE_NOTICE}`;
}

export const MEMBERSHIP_CANCEL_COPY = {
  packagesTitle: 'Aktif paketleriniz',
  independentNote:
    'Her paket ayrı faturalanır. Birini kapatmak diğerinin çekimini durdurmaz.',
  cardInvoice: 'Kart ve fatura',
  closeRenewal: 'Otomatik yenilemeyi kapat',
  closeNow: 'Hemen kapat',
  keepRenewal: 'Yenilemeyi açık tut',
  addPackage: 'Paket ekle / satın al',
  buyCta: 'Web’den paket ekle',
  manageNote:
    'Satın alma web üzerinden yapılır. İptal için aşağıdaki uyarıları okuyup Stripe Müşteri Portalı’nda onaylarsınız.',
  iosManageNote: iosLockedFeatureCopy(
    'Mevcut paketlerinizi görürsünüz; iptal ve kart web üzerinden yönetilir.',
  ),
  iosUnpaidDesc: 'Bu özellik bu pakette yer almaz.',
  iosMembershipBody: iosLockedFeatureCopy('Ücretsiz hesap için Kayıt Ol.'),
  iosLandingLead:
    'Koç, diyetisyen ve doktor desteği tek uygulamada. Ücretsiz başla. Üyelik satın alımları uygulama içerisinden yapılmamaktadır.',
  iosTrialBody:
    'Ücretsiz deneme süreniz sona erdi. Ücretli özellikler kapandı.',
  iosExpiredBanner: 'Ücretli özellikler kapandı.',
  iosUpsellSub: IOS_OUT_OF_APP_PURCHASE_NOTICE,
  iosPaymentsSub: 'Paketleriniz, iptal ve kart',
  iosHealthPitch: IOS_OUT_OF_APP_PURCHASE_NOTICE,
  iosOnboardingSub:
    'Hesabını oluştur; ücretsiz üye olarak devam et. Üyelik satın alımları uygulama içerisinden yapılmamaktadır.',
  iosCalorieLockedLead: 'Metin ile kalori analizi bu pakette yer almaz.',
  iosCalorieLocked: iosLockedFeatureCopy(
    'Metin ile kalori analizi bu pakette yer almaz.',
  ),
  iosScheduleLockedLead: {
    coach: 'Koç randevusu bu pakette yer almaz.',
    dietitian: 'Diyetisyen randevusu bu pakette yer almaz.',
    doctor: 'Doktor görüşmesi bu pakette yer almaz.',
  },
  iosScheduleLocked: {
    coach: iosLockedFeatureCopy('Koç randevusu bu pakette yer almaz.'),
    dietitian: iosLockedFeatureCopy(
      'Diyetisyen randevusu bu pakette yer almaz.',
    ),
    doctor: iosLockedFeatureCopy('Doktor görüşmesi bu pakette yer almaz.'),
  },
  doctorTitle: 'Doktor Paketi tek seferliktir',
  doctorBody:
    'Bu paket abonelik değildir; self-servis iptal yoktur. İptal veya iade için info@yeniform.com adresine yazın.',
  doctorMail: 'info@yeniform.com adresine yaz',
  renewalOffBadge: 'Yenileme kapalı',
  renewalOffBanner: (dateLabel: string, planLabel: string) =>
    `${planLabel}: yenileme kapalı · ${dateLabel} tarihine kadar erişiminiz sürer.`,
  stackingTitle: 'Mevcut paketleriniz durur',
  stackingBody:
    'Bu satın alma mevcut aboneliklerinizi kapatmaz. İstemediğiniz paketi önce Ödeme Yönetimi’nden kapatın. Unutursanız her paket kendi döneminde kartınızdan çekilmeye devam eder.',
  stackingAck: 'Mevcut paketlerimin durduğunu ve ayrı faturalanacağını anlıyorum.',
  periodTitle: 'Otomatik yenilemeyi kapat',
  periodLead: (planLabel: string, dateLabel: string) =>
    `${planLabel} aboneliğiniz ${dateLabel} tarihinde sona erecek. O güne kadar erişiminiz açık kalır; bu paket için yeni çekim olmaz.`,
  periodBullets: [
    'Diğer paketleriniz etkilenmez; kapatmadıklarınız çekilmeye devam eder.',
    'Bitiş tarihinden önce Ödeme Yönetimi’nden yenilemeyi tekrar açabilirsiniz.',
    'Onay Stripe Müşteri Portalı’nda tamamlanır.',
  ],
  periodCta: 'Portal’da onayla',
  immediateTitle: 'Üyeliği hemen kapat',
  immediateLead: (planLabel: string, dateLabel: string) =>
    `${planLabel} süreniz ${dateLabel} tarihine kadar ödenmiş. Hemen kapatırsanız erişim bugün kesilir; ödenen ücret iade edilmez.`,
  immediateBullets: [
    'Kalan günler yanar; para iadesi yoktur.',
    'Yarınki görüşmeniz dahil bu pakete bağlı gelecek randevular iptal edilir.',
    'Koç / diyetisyen hakkı bu paketten düşer. Başka aktif paketiniz varsa onlar durur.',
    'Bu işlem geri alınamaz.',
    'İstisnai durumlar için info@yeniform.com',
  ],
  immediateAck:
    'Erişimin bugün kesileceğini, iade olmayacağını ve gelecek randevuların iptal edileceğini okudum, kabul ediyorum.',
  immediateCta: 'Portal’da hemen kapat',
  resumeTitle: 'Yenilemeyi açık tut',
  resumeLead: (planLabel: string, dateLabel: string) =>
    `${planLabel} için yenileme yeniden açılır. ${dateLabel} tarihinde kartınızdan dönem tutarı çekilir ve erişim devam eder.`,
  resumeCta: 'Yenilemeyi aç',
  portalFail: 'Portal açılamadı.',
  resumeFail: 'Yenileme açılamadı.',
  noSession: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
  needAck: 'Devam etmek için onay kutusunu işaretleyin.',
  resumedToast: 'Yenileme yeniden açıldı.',
  durationHint:
    'Kartınızdan seçtiğiniz dönem tutarı tahsil edilir. İptal: Ödeme Yönetimi’nde uyarıları okuyun, ardından Stripe Portalı’nda onaylayın.',
};
