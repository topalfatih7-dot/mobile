// Ülke telefon kodları — kayıt formundaki telefon alanı için.
// Her ülke: iso (ISO-3166 alfa-2), name (Türkçe), dial (uluslararası kod),
// flag (emoji), min/max (ulusal numara hane sayısı aralığı).

export type CountryCode = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  min: number;
  max: number;
};

export const COUNTRY_CODES: CountryCode[] = [
  { iso: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷', min: 10, max: 10 },
  { iso: 'DE', name: 'Almanya', dial: '49', flag: '🇩🇪', min: 10, max: 11 },
  { iso: 'NL', name: 'Hollanda', dial: '31', flag: '🇳🇱', min: 9, max: 9 },
  { iso: 'GB', name: 'Birleşik Krallık', dial: '44', flag: '🇬🇧', min: 10, max: 10 },
  { iso: 'US', name: 'Amerika', dial: '1', flag: '🇺🇸', min: 10, max: 10 },
  { iso: 'FR', name: 'Fransa', dial: '33', flag: '🇫🇷', min: 9, max: 9 },
  { iso: 'AT', name: 'Avusturya', dial: '43', flag: '🇦🇹', min: 9, max: 11 },
  { iso: 'BE', name: 'Belçika', dial: '32', flag: '🇧🇪', min: 8, max: 9 },
  { iso: 'CH', name: 'İsviçre', dial: '41', flag: '🇨🇭', min: 9, max: 9 },
  { iso: 'AZ', name: 'Azerbaycan', dial: '994', flag: '🇦🇿', min: 9, max: 9 },
  { iso: 'CY', name: 'Kıbrıs (KKTC)', dial: '90', flag: '🇨🇾', min: 10, max: 10 },
  { iso: 'SA', name: 'Suudi Arabistan', dial: '966', flag: '🇸🇦', min: 9, max: 9 },
  { iso: 'AE', name: 'BAE', dial: '971', flag: '🇦🇪', min: 9, max: 9 },
  { iso: 'QA', name: 'Katar', dial: '974', flag: '🇶🇦', min: 8, max: 8 },
  { iso: 'RU', name: 'Rusya', dial: '7', flag: '🇷🇺', min: 10, max: 10 },
  { iso: 'UA', name: 'Ukrayna', dial: '380', flag: '🇺🇦', min: 9, max: 9 },
  { iso: 'BG', name: 'Bulgaristan', dial: '359', flag: '🇧🇬', min: 8, max: 9 },
  { iso: 'GR', name: 'Yunanistan', dial: '30', flag: '🇬🇷', min: 10, max: 10 },
  { iso: 'IT', name: 'İtalya', dial: '39', flag: '🇮🇹', min: 9, max: 10 },
  { iso: 'ES', name: 'İspanya', dial: '34', flag: '🇪🇸', min: 9, max: 9 },
  { iso: 'SE', name: 'İsveç', dial: '46', flag: '🇸🇪', min: 7, max: 10 },
  { iso: 'NO', name: 'Norveç', dial: '47', flag: '🇳🇴', min: 8, max: 8 },
  { iso: 'DK', name: 'Danimarka', dial: '45', flag: '🇩🇰', min: 8, max: 8 },
  { iso: 'CA', name: 'Kanada', dial: '1', flag: '🇨🇦', min: 10, max: 10 },
  { iso: 'AU', name: 'Avustralya', dial: '61', flag: '🇦🇺', min: 9, max: 9 },
];

export const DEFAULT_COUNTRY_ISO = 'TR';

export function getCountry(iso: string): CountryCode {
  return COUNTRY_CODES.find((c) => c.iso === iso) || COUNTRY_CODES[0];
}

export function digitsOnly(value: unknown): string {
  return String(value || '').replace(/\D/g, '');
}

/** Ulusal numarayı ülke kurallarına göre normalize eder (çift ülke kodu, baştaki 0 vb.). */
export function normalizeNationalDigits(iso: string, raw: unknown): string {
  const country = getCountry(iso);
  let d = digitsOnly(raw);
  if ((iso === 'TR' || iso === 'CY') && d.startsWith('0')) d = d.slice(1);
  if (d.startsWith(country.dial) && d.length > country.max) d = d.slice(country.dial.length);
  return d.slice(0, country.max);
}

export type ParsedE164 = { iso: string; dial: string; national: string };

/** E.164 numarayı ülke + ulusal parçaya ayırır. */
export function parseE164(e164: string | null | undefined): ParsedE164 | null {
  const digits = digitsOnly(e164);
  if (!digits) return null;
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      const national = normalizeNationalDigits(c.iso, digits.slice(c.dial.length));
      return { iso: c.iso, dial: c.dial, national };
    }
  }
  const fallback = getCountry(DEFAULT_COUNTRY_ISO);
  return {
    iso: fallback.iso,
    dial: fallback.dial,
    national: normalizeNationalDigits(fallback.iso, digits),
  };
}

/** E.164 numarayı okunabilir biçimde gösterir: +90 505 765 43 21 */
export function formatE164(e164: string | null | undefined): string {
  if (!e164) return '—';
  const parsed = parseE164(e164);
  if (!parsed?.national) return e164;
  const formatted = formatNationalNumber(parsed.iso, parsed.national);
  return `+${parsed.dial} ${formatted}`.trim();
}

export function formatNationalNumber(iso: string, raw: unknown): string {
  const country = getCountry(iso);
  let d = digitsOnly(raw).slice(0, country.max);
  if (iso === 'TR' || iso === 'CY') {
    if (d.startsWith('0')) d = d.slice(1);
    d = d.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function isValidNationalNumber(iso: string, raw: unknown): boolean {
  const country = getCountry(iso);
  let d = digitsOnly(raw);
  if ((iso === 'TR' || iso === 'CY') && d.startsWith('0')) d = d.slice(1);
  if ((iso === 'TR' || iso === 'CY') && !d.startsWith('5')) return false;
  return d.length >= country.min && d.length <= country.max;
}

export function toE164(iso: string, raw: unknown): string {
  const country = getCountry(iso);
  const d = normalizeNationalDigits(iso, raw);
  return `+${country.dial}${d}`;
}
