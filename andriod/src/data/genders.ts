/** Üye kaydı ve profil — yalnızca Kadın / Erkek (belirtmek istemiyorum seçeneği yok). */
export const MEMBER_GENDERS = [
  { value: 'female' as const, label: 'Kadın' },
  { value: 'male' as const, label: 'Erkek' },
];

export type MemberGender = (typeof MEMBER_GENDERS)[number]['value'];

export const MEMBER_GENDER_LABELS: Record<MemberGender, string> = Object.fromEntries(
  MEMBER_GENDERS.map((g) => [g.value, g.label]),
) as Record<MemberGender, string>;

export function isValidMemberGender(value: unknown): value is MemberGender {
  return MEMBER_GENDERS.some((g) => g.value === value);
}
