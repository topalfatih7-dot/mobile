import { env } from '@/config/env';

export const BRAND = {
  name: 'Yeni Form',
  shortName: 'Yeni Form',
  domain: 'yeniform.com',
  siteUrl: env.siteUrl,
  tagline: 'Herkes için çevrimiçi koçluk ve wellness',
  assets: {
    logo: require('../../assets/brand/brand-logo.png'),
    mark: require('../../assets/brand/brand-mark.png'),
  },
} as const;

/** Admin e-postası — şifre kodda tutulmaz; web `brand.js` ile aynı varsayılan. */
export const ADMIN_EMAIL = env.adminEmail;

export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  name: 'Yeni Form Admin',
} as const;
