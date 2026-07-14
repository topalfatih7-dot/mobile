/**
 * Sağlık testi bölüm meta — web `healthTestSections` / `healthTestDietitianSections` ile uyumlu id'ler.
 * Tam soru seti henüz taşınmadı; hub / stub akışı için başlık listesi.
 */
export type HealthSectionMeta = {
  id: string;
  title: string;
  subtitle: string;
  audience: 'shared' | 'coach' | 'dietitian';
  icon:
    | 'heart-outline'
    | 'medkit-outline'
    | 'barbell-outline'
    | 'walk-outline'
    | 'woman-outline'
    | 'man-outline'
    | 'nutrition-outline'
    | 'leaf-outline'
    | 'water-outline'
    | 'fitness-outline'
    | 'list-outline';
};

export const HEALTH_SECTIONS_META: HealthSectionMeta[] = [
  {
    id: 'general',
    title: 'Genel Durum',
    subtitle: 'Ruh hali, enerji ve genel iyilik hali',
    audience: 'shared',
    icon: 'heart-outline',
  },
  {
    id: 'medical',
    title: 'Tıbbi Geçmiş',
    subtitle: 'Hastalıklar, ilaçlar ve tıbbi takip',
    audience: 'shared',
    icon: 'medkit-outline',
  },
  {
    id: 'physical',
    title: 'Fiziksel Kapasite',
    subtitle: 'Hareket geçmişi ve antrenman hazırlığı',
    audience: 'coach',
    icon: 'barbell-outline',
  },
  {
    id: 'lifestyle',
    title: 'Yaşam Tarzı',
    subtitle: 'Günlük alışkanlıklar ve davranışlar',
    audience: 'coach',
    icon: 'walk-outline',
  },
  {
    id: 'women',
    title: 'Kadın Sağlığı',
    subtitle: 'Hormonal döngü ve kadın sağlığı özel soruları',
    audience: 'shared',
    icon: 'woman-outline',
  },
  {
    id: 'men',
    title: 'Erkek Sağlığı',
    subtitle: 'Erkek sağlığına özel tarama ve belirtiler',
    audience: 'shared',
    icon: 'man-outline',
  },
  {
    id: 'diet_reason',
    title: 'Başvuru Nedeni',
    subtitle: 'Diyetisyen desteği alma amacınız ve hedefiniz',
    audience: 'dietitian',
    icon: 'list-outline',
  },
  {
    id: 'diet_health',
    title: 'Sağlık Durumu',
    subtitle: 'Tanı, ilaç, alerji, sindirim ve aile öyküsü',
    audience: 'dietitian',
    icon: 'medkit-outline',
  },
  {
    id: 'diet_lifestyle',
    title: 'Yaşam Tarzı',
    subtitle: 'Sigara, alkol, su, uyku ve stres',
    audience: 'dietitian',
    icon: 'leaf-outline',
  },
  {
    id: 'diet_activity',
    title: 'Fiziksel Aktivite',
    subtitle: 'Egzersiz alışkanlıklarınız',
    audience: 'dietitian',
    icon: 'fitness-outline',
  },
  {
    id: 'diet_nutrition',
    title: 'Beslenme Alışkanlıkları',
    subtitle: 'Öğün düzeni, içecekler ve yeme davranışları',
    audience: 'dietitian',
    icon: 'nutrition-outline',
  },
  {
    id: 'diet_women',
    title: 'Kadın Danışanlar',
    subtitle: 'Adet, gebelik ve hormonal sağlık',
    audience: 'dietitian',
    icon: 'woman-outline',
  },
  {
    id: 'diet_extra',
    title: 'Ek Bilgiler',
    subtitle: 'Geçmiş diyet deneyimi, tercihler ve koşullar',
    audience: 'dietitian',
    icon: 'water-outline',
  },
];

export type HealthTestProgress = {
  completedSections?: string[];
  [key: string]: unknown;
};

export function getCompletedSections(healthTest: unknown): string[] {
  if (!healthTest || typeof healthTest !== 'object') return [];
  const raw = (healthTest as HealthTestProgress).completedSections;
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

export function getSectionMeta(sectionId: string): HealthSectionMeta | undefined {
  return HEALTH_SECTIONS_META.find((s) => s.id === sectionId);
}
