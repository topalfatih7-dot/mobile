/**
 * Web parity: Adsız `utils/healthProfile.getMissingAnalysisProfileFields`
 */
export function getMissingAnalysisProfileFields(
  profile: Record<string, unknown> | null | undefined = {},
): { key: string; label: string }[] {
  const p = profile || {};
  const missing: { key: string; label: string }[] = [];
  const hasAge =
    Boolean(p.birthDate) || (p.age != null && Number(p.age) > 0);
  const weight = parseFloat(String(p.weight ?? ''));
  const height = parseFloat(String(p.height ?? ''));

  if (!hasAge) missing.push({ key: 'birthDate', label: 'Doğum tarihi' });
  if (!weight || weight < 30) missing.push({ key: 'weight', label: 'Kilo' });
  if (!height || height < 120) missing.push({ key: 'height', label: 'Boy' });
  if (!p.gender) missing.push({ key: 'gender', label: 'Cinsiyet' });

  return missing;
}

export function hasCompleteAnalysisProfile(
  profile: Record<string, unknown> | null | undefined,
) {
  return getMissingAnalysisProfileFields(profile).length === 0;
}
