/** Web `exerciseTurkish.js` — yalnızca UI etiket / temizlik yardımcıları (RN). */

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export const EXERCISE_LOCATION_LABELS: Record<string, string> = {
  office: 'Ofis',
  home: 'Ev',
  gym: 'Salon',
};

export function formatExerciseLocations(locations: unknown): string[] {
  if (!Array.isArray(locations) || !locations.length) return [];
  return locations.map((loc) => EXERCISE_LOCATION_LABELS[String(loc)] || String(loc));
}

/** description içine gömülen "Uygulama adımları" bloğunu kaldırır. */
export function stripEmbeddedInstructionBlock(description: unknown): string {
  return String(description || '')
    .replace(/\s*Uygulama ad[ıi]mlar[ıi]:[\s\S]*$/i, '')
    .trim();
}

export function normalizeInstructionSteps(instructions: unknown): string[] {
  if (!Array.isArray(instructions)) return [];
  return instructions
    .map((step) => {
      if (typeof step === 'string') return step.trim();
      if (step && typeof step === 'object') {
        const obj = step as Record<string, unknown>;
        return String(obj.text || obj.description || obj.step || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}
