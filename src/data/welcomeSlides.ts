import { gradients, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

export type WelcomeHighlight = {
  icon: IoniconName;
  label: string;
};

export type WelcomeSlide = {
  id: string;
  icon: IoniconName;
  gradient: Gradient;
  /** Hero etrafında uçuşan mini aksan baloncukları. */
  bubbles: IoniconName[];
  badge: string;
  title: string;
  subtitle: string;
  highlights: WelcomeHighlight[];
};

/** Noom / Headspace tarzı intro — canlı, mobil-native değer önerisi slaytları. */
export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: 'coach',
    icon: 'barbell',
    gradient: gradients.brand,
    bubbles: ['heart', 'flash', 'medal'],
    badge: 'KİŞİSEL KOÇLUK',
    title: 'Kişisel koçun\nher an yanında',
    subtitle:
      'Uzman koçların sana özel antrenman planı hazırlar. Evde ya da salonda — tamamen senin ritminde.',
    highlights: [
      { icon: 'clipboard', label: 'Özel program' },
      { icon: 'videocam', label: 'Video görüşme' },
    ],
  },
  {
    id: 'nutrition',
    icon: 'nutrition',
    gradient: gradients.forest,
    bubbles: ['leaf', 'water', 'restaurant'],
    badge: 'BESLENME DESTEĞİ',
    title: 'Sana özel\nbeslenme planı',
    subtitle:
      'Diyetisyenin hedeflerine uygun beslenme listesi oluşturur ve süreci birlikte takip edersiniz.',
    highlights: [
      { icon: 'list', label: 'Günlük liste' },
      { icon: 'camera', label: 'Kalori tarama' },
    ],
  },
  {
    id: 'progress',
    icon: 'trending-up',
    gradient: gradients.violet,
    bubbles: ['trophy', 'sparkles', 'flame'],
    badge: 'GERÇEK SONUÇLAR',
    title: 'İlerlemeni gör,\nhedefe ulaş',
    subtitle:
      'Günlük hedefler, ölçümler ve motivasyon — dönüşüm yolculuğun tek bir uygulamada toplanır.',
    highlights: [
      { icon: 'stats-chart', label: 'İlerleme grafiği' },
      { icon: 'ribbon', label: 'Başarı rozetleri' },
    ],
  },
];
