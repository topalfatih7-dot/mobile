import { gradients, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

export type Program = {
  id: string;
  title: string;
  category: string;
  level: string;
  weeks: number;
  perWeek: string;
  progress: number;
  icon: IoniconName;
  gradient: Gradient;
  coach: string;
};

export type FeaturedProgramData = {
  id: string;
  title: string;
  tag: string;
  weeks: number;
  sessionsDone: number;
  sessionsTotal: number;
  progress: number;
  gradient: Gradient;
  nextLabel: string;
};

export const PROGRAM_CATEGORIES = ['Tümü', 'Antrenman', 'Beslenme', 'Wellness'];

export const PROGRAMS: Program[] = [
  { id: 'p1', title: 'Güç & Kondisyon', category: 'Antrenman', level: 'Orta seviye', weeks: 8, perWeek: 'Haftada 4 antrenman', progress: 0.45, icon: 'barbell', gradient: gradients.coral, coach: 'Mehmet Kaya' },
  { id: 'p2', title: 'Dengeli Beslenme', category: 'Beslenme', level: 'Tüm seviyeler', weeks: 12, perWeek: 'Günde 5 öğün', progress: 0.6, icon: 'nutrition', gradient: gradients.forest, coach: 'Dyt. Aslı Demir' },
  { id: 'p3', title: 'Zihin & Nefes', category: 'Wellness', level: 'Başlangıç', weeks: 4, perWeek: 'Günde 10 dk', progress: 0.2, icon: 'leaf', gradient: gradients.violet, coach: 'Yeni Form' },
  { id: 'p4', title: 'HIIT Yağ Yakım', category: 'Antrenman', level: 'İleri seviye', weeks: 6, perWeek: 'Haftada 3 antrenman', progress: 0.1, icon: 'flash', gradient: gradients.amber, coach: 'Mehmet Kaya' },
];
