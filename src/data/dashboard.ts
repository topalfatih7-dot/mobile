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

export type TodayItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: IoniconName;
  gradient: Gradient;
  done: boolean;
};

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

export type QuickAction = {
  id: string;
  label: string;
  icon: IoniconName;
  gradient: Gradient;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'meal', label: 'Öğün Ekle', icon: 'camera', gradient: gradients.champagne },
  { id: 'workout', label: 'Antrenman', icon: 'barbell', gradient: gradients.energy },
  { id: 'water', label: 'Su Ekle', icon: 'water', gradient: gradients.teal },
  { id: 'measure', label: 'Ölçüm', icon: 'trending-up', gradient: gradients.primary },
];
