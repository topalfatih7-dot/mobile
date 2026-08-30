/** Web parity: Adsız `src/data/staffProfile.js` */

export type StaffProfile = {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  specialty?: string;
  specialties?: string[];
  bio?: string;
  photo?: string | null;
  city?: string;
  district?: string;
  gender?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  linkedin?: string;
  education?: unknown[];
  experienceYears?: number | string;
  experiences?: unknown[];
  certificates?: unknown[];
  languages?: string[];
  workDays?: number[];
  workStart?: string;
  workEnd?: string;
  availability?: Record<string, string[]>;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Eski `description` alanını bio'ya taşır; dizileri normalize eder */
export function normalizeStaffProfile(raw: Record<string, unknown> = {}): StaffProfile {
  const specialties = Array.isArray(raw.specialties)
    ? (raw.specialties as unknown[]).filter(Boolean).map(String)
    : raw.specialty
      ? [String(raw.specialty)]
      : [];

  const availability =
    raw.availability && typeof raw.availability === 'object' && !Array.isArray(raw.availability)
      ? (Object.fromEntries(
          Object.entries(raw.availability as Record<string, unknown>).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.map(String) : [],
          ]),
        ) as Record<string, string[]>)
      : {};

  return {
    ...raw,
    title: String(raw.title || ''),
    specialty: String(raw.specialty || specialties[0] || ''),
    specialties,
    bio: String(raw.bio || raw.description || ''),
    photo: (raw.photo as string | null) || null,
    city: String(raw.city || ''),
    district: String(raw.district || ''),
    gender: String(raw.gender || ''),
    instagram: String(raw.instagram || ''),
    youtube: String(raw.youtube || ''),
    website: String(raw.website || ''),
    linkedin: String(raw.linkedin || ''),
    education: Array.isArray(raw.education) ? raw.education : [],
    experienceYears:
      raw.experienceYears === '' || raw.experienceYears == null
        ? ''
        : Number(raw.experienceYears) || 0,
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
    certificates: Array.isArray(raw.certificates) ? raw.certificates : [],
    languages:
      Array.isArray(raw.languages) && raw.languages.length
        ? raw.languages.map(String)
        : ['Türkçe'],
    workDays: Array.isArray(raw.workDays) ? raw.workDays.map(Number) : [],
    workStart: String(raw.workStart || '09:00'),
    workEnd: String(raw.workEnd || '17:00'),
    availability,
    name: String(raw.name || ''),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    role: String(raw.role || 'coach'),
  };
}

/** Supabase staff.data JSONB payload — tek kaynak */
export function staffProfileDataPayload(data: Record<string, unknown>) {
  const n = normalizeStaffProfile(data);
  const settings =
    data?.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
      ? (data.settings as Record<string, unknown>)
      : undefined;
  return {
    phone: n.phone || '',
    title: n.title || '',
    specialty: n.specialty || '',
    specialties: n.specialties || [],
    bio: n.bio || '',
    photo: n.photo || null,
    city: n.city || '',
    district: n.district || '',
    gender: n.gender || '',
    instagram: n.instagram || '',
    youtube: n.youtube || '',
    website: n.website || '',
    linkedin: n.linkedin || '',
    education: n.education || [],
    experienceYears: Number(n.experienceYears) || 0,
    experiences: n.experiences || [],
    certificates: n.certificates || [],
    languages: n.languages || ['Türkçe'],
    workDays: n.workDays || [],
    workStart: n.workStart || '09:00',
    workEnd: n.workEnd || '17:00',
    availability: n.availability && typeof n.availability === 'object' ? n.availability : {},
    ...(settings ? { settings } : {}),
  };
}

/** Başvuru onayından sonra personelin değiştiremeyeceği alanlar */
export function lockedProfileFields(staffUser: Record<string, unknown>) {
  const base = normalizeStaffProfile(staffUser);
  return {
    specialty: base.specialty,
    specialties: base.specialties,
    experienceYears: base.experienceYears,
    languages: base.languages,
    education: base.education,
    experiences: base.experiences,
    certificates: base.certificates,
    role: base.role,
    email: base.email,
  };
}
