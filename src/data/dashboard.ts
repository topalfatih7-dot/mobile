import { gradients, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

export type DailyStat = {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: IoniconName;
  gradient: Gradient;
  progress: number;
};

export const DAILY_STATS: DailyStat[] = [
  { id: 'cal', label: 'Kalori', value: '1.240', unit: 'kcal', icon: 'flame', gradient: gradients.coral, progress: 0.62 },
  { id: 'steps', label: 'Adım', value: '7.850', unit: 'adım', icon: 'walk', gradient: gradients.ocean, progress: 0.78 },
  { id: 'water', label: 'Su', value: '1.6', unit: 'L', icon: 'water', gradient: gradients.teal, progress: 0.53 },
  { id: 'active', label: 'Aktif', value: '48', unit: 'dk', icon: 'fitness', gradient: gradients.violet, progress: 0.8 },
];

/** Günlük hedef tamamlama (hero ring). */
export const DAILY_GOAL = {
  progress: 0.68,
  completed: 4,
  total: 6,
};

export type TodayItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: IoniconName;
  gradient: Gradient;
  done: boolean;
};

export const TODAY_PLAN: TodayItem[] = [
  { id: 't1', title: 'Üst Vücut Antrenmanı', subtitle: '8 hareket · 45 dk', time: '09:00', icon: 'barbell', gradient: gradients.coral, done: true },
  { id: 't2', title: 'Ara Öğün — Yoğurt & Meyve', subtitle: '320 kcal', time: '11:00', icon: 'nutrition', gradient: gradients.forest, done: true },
  { id: 't3', title: 'Koç Görüşmesi — Mehmet K.', subtitle: 'Video görüşme · 30 dk', time: '15:30', icon: 'videocam', gradient: gradients.brand, done: false },
  { id: 't4', title: 'Akşam Yürüyüşü', subtitle: 'Hedef 3.000 adım', time: '19:00', icon: 'walk', gradient: gradients.violet, done: false },
];

export type NextSession = {
  id: string;
  sessionType: 'coach' | 'dietitian';
  coach: string;
  role: string;
  type: string;
  date: string;
  time: string;
  durationMin: number;
  rawDate: string;
};

export const NEXT_SESSION: NextSession = {
  id: 'demo',
  sessionType: 'coach',
  coach: 'Mehmet Kaya',
  role: 'Kişisel Koç',
  type: 'Video Görüşme',
  date: 'Bugün',
  time: '15:30',
  durationMin: 30,
  rawDate: '2026-06-29',
};

export type QuickAction = {
  id: string;
  label: string;
  icon: IoniconName;
  gradient: Gradient;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'meal', label: 'Öğün Ekle', icon: 'camera', gradient: gradients.amber },
  { id: 'workout', label: 'Antrenman', icon: 'barbell', gradient: gradients.coral },
  { id: 'water', label: 'Su Ekle', icon: 'water', gradient: gradients.teal },
  { id: 'measure', label: 'Ölçüm', icon: 'trending-up', gradient: gradients.violet },
];

export const WEEKLY_ACTIVITY: { day: string; value: number }[] = [
  { day: 'Pzt', value: 0.55 },
  { day: 'Sal', value: 0.82 },
  { day: 'Çar', value: 0.4 },
  { day: 'Per', value: 0.95 },
  { day: 'Cum', value: 0.68 },
  { day: 'Cmt', value: 0.32 },
  { day: 'Paz', value: 0.6 },
];
