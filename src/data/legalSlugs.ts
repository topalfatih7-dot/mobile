/** LOCK: appendices/D-legal-slugs.md */
import { env } from '@/config/env';

export const LEGAL_DOCUMENTS: Record<string, { label: string; path: string }> = {
  'uyelik-ve-abonelik-sozlesmesi': {
    label: 'Üyelik ve Abonelik Sözleşmesi',
    path: '/legal/uyelik-ve-abonelik-sozlesmesi',
  },
  'mesafeli-hizmet-sozlesmesi': {
    label: 'Mesafeli Hizmet Sözleşmesi',
    path: '/legal/mesafeli-hizmet-sozlesmesi',
  },
  'iptal-ve-iade-politikasi': {
    label: 'İptal ve İade Politikası',
    path: '/legal/iptal-ve-iade-politikasi',
  },
  kvkk: { label: 'KVKK Aydınlatma Metni', path: '/kvkk' },
  'kvkk-acik-riza-metni': {
    label: 'KVKK Açık Rıza Metni',
    path: '/legal/kvkk-acik-riza-metni',
  },
  'gizlilik-politikasi': {
    label: 'Gizlilik Politikası',
    path: '/privacy',
  },
  'cerez-politikasi': { label: 'Çerez Politikası', path: '/legal/cerez-politikasi' },
  'saglik-verisi-isleme-bilgilendirmesi': {
    label: 'Sağlık Verisi İşleme Bilgilendirmesi',
    path: '/legal/saglik-verisi-isleme-bilgilendirmesi',
  },
  'veri-saklama-ve-imha-politikasi': {
    label: 'Veri Saklama ve İmha Politikası',
    path: '/legal/veri-saklama-ve-imha-politikasi',
  },
  'yapay-zeka-kullanim-politikasi': {
    label: 'Yapay Zekâ Kullanım Politikası',
    path: '/legal/yapay-zeka-kullanim-politikasi',
  },
  'topluluk-kurallari': { label: 'Topluluk Kuralları', path: '/legal/topluluk-kurallari' },
  'saglik-sorumluluk-reddi': {
    label: 'Sağlık Sorumluluk Reddi',
    path: '/legal/saglik-sorumluluk-reddi',
  },
  'antrenor-hizmet-standartlari': {
    label: 'Antrenör Hizmet Standartları',
    path: '/legal/antrenor-hizmet-standartlari',
  },
  'diyetisyen-hizmet-standartlari': {
    label: 'Diyetisyen Hizmet Standartları',
    path: '/legal/diyetisyen-hizmet-standartlari',
  },
};

const REDIRECTS: Record<string, string> = {
  privacy: 'gizlilik-politikasi',
  terms: 'uyelik-ve-abonelik-sozlesmesi',
  kvkk: 'kvkk',
};

export function resolveLegalSlug(raw?: string | null) {
  const key = String(raw || '')
    .toLowerCase()
    .trim();
  const mapped = REDIRECTS[key] || key;
  return LEGAL_DOCUMENTS[mapped] ? mapped : null;
}

export function legalUrl(slug: string) {
  const doc = LEGAL_DOCUMENTS[slug];
  if (!doc) return `${env.apiBaseUrl}/`;
  return `${env.apiBaseUrl}${doc.path}`;
}
