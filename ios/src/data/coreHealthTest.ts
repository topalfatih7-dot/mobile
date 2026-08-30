/**
 * Çekirdek "Genel Sağlık Testi" — web parity: Adsız `src/data/coreHealthTest.js`
 * Erkek: 25, Kadın: 26 soru. Kategori UI yok; hepsi zorunlu sayılır.
 */
import { HEALTH_SECTIONS } from '@/data/healthTestSections';
import {
  hasStoredAnswer,
  isDetailFilled,
  isDetailVisible,
  isFollowUpVisible,
  type HealthQuestion,
} from '@/data/healthTest';

/** Serbest metin "İsteğe bağlı" alanları — 2. analiz katı tamamlanmasından muaf. */
export const OPTIONAL_TEXT_EXEMPT_KEYS = new Set([
  'nutritionExtraNotes',
  'movementExtraNotes',
  'lifestyleExtraNotes',
  'womenExtraNotes',
  'menExtraNotes',
  'currentComplaints',
]);

/** Bölüm sırasına göre çekirdek soru anahtarları (cinsiyet özel ayrı). */
export const CORE_HEALTH_TEST_KEYS = [
  'wellbeing',
  'energy',
  'primaryGoalReason',
  'motivation',
  'chronicConditions',
  'medications',
  'lastBloodWork',
  'doctorClearance',
  'nutritionMainMeals',
  'nutritionWaterIntake',
  'nutritionMealPreparer',
  'nutritionFastFood',
  'nutritionSweets',
  'nutritionBiggestChallenge',
  'nutritionSelfRating',
  'sittingHours',
  'painAreas',
  'pastRegularExercise',
  'exerciseWillingness',
  'trainingLocation',
  'exerciseExpectations',
  'sleepHours',
  'smoking',
  'alcohol',
] as const;

export const CORE_GENDER_KEYS: Record<'male' | 'female', string[]> = {
  male: ['testosteroneConcerns'],
  female: ['pregnancy', 'breastfeeding'],
};

export type CoreHealthQuestion = HealthQuestion & {
  sectionId: string;
  sectionTitle?: string;
  sectionIcon?: string;
  audience?: string;
  coreRequired: true;
};

type QuestionEntry = {
  question: HealthQuestion;
  sectionId: string;
  sectionTitle?: string;
  sectionIcon?: string;
  audience: string;
};

const QUESTION_BY_KEY: Map<string, QuestionEntry> = (() => {
  const map = new Map<string, QuestionEntry>();
  for (const section of HEALTH_SECTIONS) {
    for (const q of section.questions || []) {
      if (q?.key) {
        map.set(q.key, {
          question: q,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIcon: section.icon,
          audience: section.audience || 'shared',
        });
      }
    }
  }
  return map;
})();

export function getCoreHealthTestKeys(gender?: string | null): string[] {
  const g = String(gender || '') === 'female' ? 'female' : String(gender || '') === 'male' ? 'male' : null;
  const genderKeys = g ? CORE_GENDER_KEYS[g] : [];
  return [...CORE_HEALTH_TEST_KEYS, ...genderKeys];
}

export function getCoreHealthTestKeySet(gender?: string | null): Set<string> {
  return new Set(getCoreHealthTestKeys(gender));
}

export function getCoreHealthTestQuestions(gender?: string | null): CoreHealthQuestion[] {
  const out: CoreHealthQuestion[] = [];
  for (const key of getCoreHealthTestKeys(gender)) {
    const entry = QUESTION_BY_KEY.get(key);
    if (!entry) continue;
    out.push({
      ...entry.question,
      sectionId: entry.sectionId,
      sectionTitle: entry.sectionTitle,
      sectionIcon: entry.sectionIcon,
      audience: entry.audience,
      coreRequired: true,
    });
  }
  return out;
}

/** Çekirdek bağlamında soru + görünür detay/follow-up dolu mu? */
export function isCoreQuestionAnswered(
  q: HealthQuestion | null | undefined,
  healthTest: Record<string, unknown> | null | undefined,
): boolean {
  if (!q) return false;
  const ht = healthTest || {};
  const parentVal = ht[q.key];
  if (!hasStoredAnswer(q, ht)) return false;

  if (q.detail && isDetailVisible(q.detail, parentVal) && !isDetailFilled(q.detail, ht)) {
    return false;
  }

  for (const fu of q.followUps || []) {
    if (!isFollowUpVisible(fu, parentVal)) continue;
    if (fu.required === false) {
      if (hasStoredAnswer(fu, ht) && !isCoreQuestionAnswered(fu, ht)) return false;
      continue;
    }
    if (!isCoreQuestionAnswered(fu, ht)) return false;
  }
  return true;
}

export function isCoreHealthTestComplete(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
): boolean {
  const questions = getCoreHealthTestQuestions(gender);
  if (!questions.length) return false;
  const ht = healthTest || {};
  return questions.every((q) => isCoreQuestionAnswered(q, ht));
}

export function getCoreHealthTestProgress(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
) {
  const questions = getCoreHealthTestQuestions(gender);
  const ht = healthTest || {};
  const answered = questions.filter((q) => isCoreQuestionAnswered(q, ht)).length;
  const total = questions.length;
  return {
    answered,
    total,
    percent: total ? Math.round((answered / total) * 100) : 0,
    complete: total > 0 && answered === total,
    started: questions.some((q) => hasStoredAnswer(q, ht)),
  };
}

export function getCoreHealthTestResumeIndex(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
): number {
  const questions = getCoreHealthTestQuestions(gender);
  const ht = healthTest || {};
  const gap = questions.findIndex((q) => !isCoreQuestionAnswered(q, ht));
  if (gap >= 0) return gap;
  return Math.max(0, questions.length - 1);
}
