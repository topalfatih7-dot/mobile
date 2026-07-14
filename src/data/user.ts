import type { IoniconName } from '@/types';
import { colors } from '@/constants/theme';

export type ProfileStat = {
  id: string;
  label: string;
  value: string;
  unit: string;
};

export type ProfileLink = {
  id: string;
  label: string;
  icon: IoniconName;
  tint: string;
};

export const PROFILE_LINKS: ProfileLink[] = [
  { id: 'membership', label: 'Üyeliğim', icon: 'card', tint: colors.teal[600] },
  { id: 'coach', label: 'Koçum & Diyetisyenim', icon: 'people', tint: colors.coral[500] },
  { id: 'measurements', label: 'Ölçümlerim', icon: 'body', tint: colors.champagne },
  { id: 'notifications', label: 'Bildirimler', icon: 'notifications', tint: colors.warning },
  { id: 'settings', label: 'Ayarlar', icon: 'settings-sharp', tint: colors.teal[700] },
  { id: 'support', label: 'Yardım & Destek', icon: 'help-buoy', tint: colors.teal[400] },
];
