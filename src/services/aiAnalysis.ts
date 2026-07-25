/**
 * Web parity: Adsız `src/services/aiAnalysis.js` — radar + fitness skorları (client-side).
 */
import { normalizeHealthTestForAnalysis } from '@/data/healthTest';

export const RADAR_SCORE_LABELS: Record<string, string> = {
  metabolic: 'Metabolik Sağlık',
  nutrition: 'Beslenme Kalitesi',
  activity: 'Aktivite Düzeyi',
  sleep: 'Uyku Kalitesi',
  stress: 'Stres Yönetimi',
  digestion: 'Sindirim Sağlığı',
  lifestyle: 'Yaşam Tarzı Skoru',
  overall: 'Genel Değerlendirme',
};

export type RadarScores = {
  metabolic: number;
  nutrition: number;
  activity: number;
  sleep: number;
  stress: number;
  digestion: number;
  lifestyle: number;
  overall: number;
};

function calculateBmi(weight: unknown, height: unknown): number | null {
  const w = parseFloat(String(weight ?? ''));
  const h = parseFloat(String(height ?? ''));
  if (!w || !h || h < 50) return null;
  const hm = h / 100;
  return w / (hm * hm);
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scaleMap(
  value: unknown,
  map: Record<string, number>,
  fallback = 50,
): number {
  if (value == null || value === '') return fallback;
  const key = String(value);
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  return fallback;
}

function calculateFitnessScore(profile: Record<string, unknown>): number {
  let score = 50;
  const bmi = calculateBmi(profile.weight, profile.height);
  if (bmi) {
    if (bmi >= 18.5 && bmi < 25) score += 20;
    else if (bmi >= 25 && bmi < 30) score += 5;
  }
  if (profile.fitnessLevel === 'intermediate') score += 10;
  if (profile.fitnessLevel === 'advanced') score += 20;
  if (((profile.goals as unknown[]) || []).length >= 2) score += 10;
  if (((profile.nutritionPrefs as unknown[]) || []).length >= 1) score += 10;

  const ht = normalizeHealthTestForAnalysis(
    (profile.healthTest as Record<string, unknown>) || {},
  );
  if (Number(ht.wellbeing) >= 4) score += 5;
  if (ht.energy === 'high') score += 5;
  if (
    ht.sleepQuality === 'good' ||
    ht.sleepQuality === 'excellent' ||
    ht.dietSleepQuality === 'good'
  ) {
    score += 5;
  }
  if (ht.sleepQuality === 'poor' || ht.sleepQuality === 'very_poor') score -= 5;
  if (ht.goalBelief === 'certain' || ht.goalBelief === 'believe') score += 3;
  if (ht.goalBelief === 'none' || ht.goalBelief === 'low') score -= 3;
  if (ht.stressLevel === 'low' || ht.dietStressLevel === 'low') score += 5;
  if (ht.injuries === 'yes' || (ht.painAreas as unknown[])?.length) score -= 8;
  if ((ht.chronicConditions as unknown[])?.length) score -= 5;
  if (ht.teaCoffee === 'high') score -= 3;
  if (ht.substanceUse === 'regular') score -= 10;
  if (ht.substanceUse === 'occasional') score -= 5;
  if (ht.travelFrequency === 'weekly') score -= 2;

  const rawHt = (profile.healthTest as Record<string, unknown>) || {};
  const pain = Number(ht.painScale ?? rawHt.painScale);
  if (Number.isFinite(pain) && pain >= 7) score -= 6;

  return Math.max(0, Math.min(100, score));
}

/** 360° sağlık boyut skorları — mevcut healthTest + profil üzerinden. */
export function calculateRadarScores(
  profile: Record<string, unknown> | null | undefined,
  bmi: number | null = null,
  fitnessScore: number | null = null,
): RadarScores {
  const raw = (profile?.healthTest as Record<string, unknown>) || {};
  const ht = normalizeHealthTestForAnalysis(raw);
  const bmiVal = bmi ?? calculateBmi(profile?.weight, profile?.height);

  let metabolic = 62;
  if (bmiVal) {
    if (bmiVal >= 18.5 && bmiVal < 25) metabolic += 18;
    else if (bmiVal >= 25 && bmiVal < 30) metabolic += 4;
    else if (bmiVal < 18.5) metabolic -= 8;
    else metabolic -= 16;
  }
  const chronic = Array.isArray(ht.chronicConditions)
    ? (ht.chronicConditions as string[])
    : [];
  metabolic -= Math.min(24, chronic.length * 5);
  if (raw.lastBloodWork === 'last_3_months') metabolic += 8;
  else if (raw.lastBloodWork === '3_12_months') metabolic += 3;
  else if (raw.lastBloodWork === 'never' || raw.lastBloodWork === 'over_year') {
    metabolic -= 6;
  }
  if (raw.weightChange === 'stable') metabolic += 4;
  else if (raw.weightChange === 'gained' || raw.weightChange === 'lost') {
    metabolic -= 2;
  }

  let nutrition = 58;
  nutrition += scaleMap(
    raw.dietMealsPerDay,
    { '1_2': -8, '3': 6, '4_5': 10, '6_plus': 2 },
    0,
  );
  nutrition += scaleMap(
    raw.dietSweetIntake,
    { rarely: 10, sometimes: 4, often: -8, daily: -14 },
    0,
  );
  nutrition += scaleMap(
    raw.dietEmotionalEating,
    { never: 8, rarely: 4, sometimes: -2, often: -10 },
    0,
  );
  nutrition += scaleMap(
    raw.dietWaterIntake,
    { under_1: -8, '1_2': 0, '2_3': 6, over_3: 10 },
    0,
  );
  const supplements = Array.isArray(raw.supplements)
    ? (raw.supplements as string[]).filter((v) => v !== 'none')
    : [];
  if (supplements.length > 0 && supplements.length <= 4) nutrition += 4;
  if (((profile?.nutritionPrefs as unknown[]) || []).length >= 1) nutrition += 6;

  let activity = 55;
  activity += scaleMap(
    ht.activityFrequency,
    { sedentary: -18, light: -4, moderate: 12, active: 22 },
    0,
  );
  activity += scaleMap(
    raw.trainingHistoryYears,
    { none: -8, under_6m: 0, '6m_2y': 8, '2y_plus': 14 },
    0,
  );
  activity += scaleMap(
    raw.dailySteps,
    { under_3000: -10, '3000_6000': 0, '6000_9000': 8, '9000_plus': 14 },
    0,
  );
  if (ht.injuries === 'yes') activity -= 10;
  if (raw.injuryLimitation === 'severe') activity -= 8;
  else if (raw.injuryLimitation === 'moderate') activity -= 4;

  let sleep = 60;
  sleep += scaleMap(
    raw.sleepQuality,
    { very_poor: -22, poor: -16, fair: -4, good: 12, excellent: 18 },
    0,
  );
  sleep += scaleMap(
    raw.dietSleepQuality,
    { poor: -20, fair: -6, good: 12, excellent: 18 },
    0,
  );
  sleep += scaleMap(
    raw.dietSleepHours,
    { under_5: -16, '5_6': -6, '6_7': 4, '7_8': 14, over_8: 10 },
    0,
  );
  if (raw.shiftWork === 'yes') sleep -= 10;
  else if (raw.shiftWork === 'sometimes') sleep -= 4;
  if (chronic.includes('sleep_apnea')) sleep -= 12;

  let stress = 58;
  stress += scaleMap(
    raw.anxiety,
    {
      never: 14,
      rarely: 8,
      sometimes: 0,
      often: -12,
      always: -20,
      none: 14,
      mild: 6,
      moderate: -4,
      high: -16,
    },
    0,
  );
  stress += scaleMap(
    raw.dailyStressImpact,
    { none: 14, low: 8, moderate: 0, high: -12, very_high: -18 },
    0,
  );
  stress += scaleMap(
    raw.stressCoping,
    { always: 14, often: 8, sometimes: 0, rarely: -10, never: -16 },
    0,
  );
  stress += scaleMap(
    raw.socialSupport,
    { strong: 10, partial: 4, limited: -4, none: -10 },
    0,
  );
  stress += scaleMap(
    raw.dietStressLevel,
    { low: 10, moderate: 0, high: -12, very_high: -18 },
    0,
  );

  let digestion = 68;
  const digSymptoms = Array.isArray(raw.digestiveSymptoms)
    ? (raw.digestiveSymptoms as string[]).filter((v) => v !== 'none')
    : [];
  digestion -= Math.min(36, digSymptoms.length * 8);
  if (raw.digestiveDisorders && raw.digestiveDisorders !== 'no') digestion -= 12;
  const digDiet = Array.isArray(raw.dietDigestiveSymptoms)
    ? (raw.dietDigestiveSymptoms as string[]).filter(
        (v) => v !== 'none' && v !== 'yok',
      )
    : [];
  digestion -= Math.min(20, digDiet.length * 5);
  if (
    chronic.includes('ibs') ||
    chronic.includes('reflux') ||
    chronic.includes('celiac')
  ) {
    digestion -= 10;
  }

  let lifestyle = 55;
  lifestyle += scaleMap(
    raw.wellbeing,
    {
      very_low: -16,
      low: -8,
      medium: 0,
      good: 10,
      excellent: 16,
      '1': -16,
      '2': -8,
      '3': 0,
      '4': 10,
      '5': 16,
    },
    0,
  );
  lifestyle += scaleMap(
    raw.energy,
    { very_low: -12, low: -6, moderate: 2, high: 10, very_high: 14 },
    0,
  );
  const motivation = Number(raw.motivation);
  if (Number.isFinite(motivation)) lifestyle += Math.round((motivation - 5) * 2.2);
  lifestyle += scaleMap(
    raw.lifeQuality,
    { '1': -14, '2': -6, '3': 2, '4': 10, '5': 16 },
    0,
  );
  lifestyle += scaleMap(
    raw.readinessToChange,
    { not_ready: -10, thinking: -2, ready: 6, started: 12, maintaining: 16 },
    0,
  );
  lifestyle += scaleMap(
    raw.goalBelief,
    { none: -12, low: -6, unsure: 0, believe: 8, certain: 14 },
    0,
  );
  lifestyle += scaleMap(
    raw.smoking,
    { never: 8, former: 2, occasional: -8, daily: -16 },
    0,
  );
  lifestyle += scaleMap(
    raw.alcohol,
    { none: 6, monthly: 2, weekly: -4, frequent: -12 },
    0,
  );
  const barriers = Array.isArray(raw.biggestBarrier)
    ? (raw.biggestBarrier as string[])
    : raw.biggestBarrier
      ? [String(raw.biggestBarrier)]
      : [];
  if (barriers.includes('time') || barriers.includes('motivation')) lifestyle -= 4;

  const dims = {
    metabolic: clampScore(metabolic),
    nutrition: clampScore(nutrition),
    activity: clampScore(activity),
    sleep: clampScore(sleep),
    stress: clampScore(stress),
    digestion: clampScore(digestion),
    lifestyle: clampScore(lifestyle),
  };
  const avg =
    Object.values(dims).reduce((a, b) => a + b, 0) / Object.keys(dims).length;
  const fit =
    fitnessScore != null
      ? fitnessScore
      : calculateFitnessScore(profile || {});
  const overall = clampScore(avg * 0.7 + fit * 0.3);

  return { ...dims, overall };
}
