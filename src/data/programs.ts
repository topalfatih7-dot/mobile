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
