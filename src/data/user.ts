import { gradients, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

/** Demo oturum kullanıcısı (Supabase Adım 2'de gerçek veriyle değişecek). */
export const CURRENT_USER = {
  name: 'Elif Yılmaz',
  firstName: 'Elif',
  email: 'elif@example.com',
  plan: '100 Kurucu Üye',
  goal: 'Form & Güç',
  streakDays: 12,
  gradient: gradients.brand as Gradient,
};

export type ProfileStat = {
  id: string;
  label: string;
  value: string;
  unit: string;
};

export const PROFILE_STATS: ProfileStat[] = [
  { id: 'weight', label: 'Kilo', value: '64.2', unit: 'kg' },
  { id: 'workouts', label: 'Antrenman', value: '48', unit: 'seans' },
  { id: 'streak', label: 'Seri', value: '12', unit: 'gün' },
];

export type ProfileLink = {
  id: string;
  label: string;
  icon: IoniconName;
  tint: string;
};

export const PROFILE_LINKS: ProfileLink[] = [
  { id: 'membership', label: 'Üyeliğim', icon: 'card', tint: '#2478a8' },
  { id: 'coach', label: 'Koçum & Diyetisyenim', icon: 'people', tint: '#fb5b45' },
  { id: 'measurements', label: 'Ölçümlerim', icon: 'body', tint: '#7c6cf0' },
  { id: 'notifications', label: 'Bildirimler', icon: 'notifications', tint: '#f7b32b' },
  { id: 'settings', label: 'Ayarlar', icon: 'settings-sharp', tint: '#449664' },
  { id: 'support', label: 'Yardım & Destek', icon: 'help-buoy', tint: '#11b6a6' },
];
