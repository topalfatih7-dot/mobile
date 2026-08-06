/**
 * Web parity: Adsız `src/services/healthScoreAnalysis.js`
 * YeniForm Sağlık Skoru — 8 boyut + overall + staffBrief + history.
 */
import { describeHealthTest } from '@/data/healthTest';
import { apiUrl, getApiAuthHeaders } from '@/services/api';
import { isUiOnly } from '@/config/runtime';

/** healthAnalysis şema sürümü — eski radar özetleri yenilenir */
export const HEALTH_ANALYSIS_VERSION = 10;

const AI_FETCH_TIMEOUT_MS = 15_000;

export const HEALTH_SCORE_KEYS = [
  'general',
  'nutrition',
  'movement',
  'sleep',
  'stress',
  'lifestyle',
  'motivation',
  'readiness',
] as const;

export type HealthScoreKey = (typeof HEALTH_SCORE_KEYS)[number];

export const HEALTH_SCORE_META: Record<
  HealthScoreKey,
  { label: string; emoji: string; barColor: string; textColor: string }
> = {
  general: {
    label: 'Genel Sağlık',
    emoji: '❤️',
    barColor: '#2d8fc4',
    textColor: '#1f6289',
  },
  nutrition: {
    label: 'Beslenme',
    emoji: '🍎',
    barColor: '#449664',
    textColor: '#2d6242',
  },
  movement: {
    label: 'Hareket',
    emoji: '🏋️',
    barColor: '#e8894f',
    textColor: '#c4923a',
  },
  sleep: {
    label: 'Uyku',
    emoji: '🌙',
    barColor: '#4aa3d4',
    textColor: '#2478a8',
  },
  stress: {
    label: 'Stres',
    emoji: '🧘',
    barColor: '#5fad7f',
    textColor: '#357a50',
  },
  lifestyle: {
    label: 'Yaşam Tarzı',
    emoji: '🌿',
    barColor: '#449664',
    textColor: '#2d6242',
  },
  motivation: {
    label: 'Motivasyon',
    emoji: '🔥',
    barColor: '#e8894f',
    textColor: '#c4923a',
  },
  readiness: {
    label: 'Hazır Oluş',
    emoji: '🚦',
    barColor: '#dc2626',
    textColor: '#b91c1c',
  },
};

export const STAFF_BRIEF_KEYS = [
  'general',
  'nutrition',
  'movement',
  'risks',
  'actions',
] as const;

export type StaffBriefKey = (typeof STAFF_BRIEF_KEYS)[number];

export const STAFF_BRIEF_META: Record<StaffBriefKey, { label: string }> = {
  general: { label: 'Genel durum' },
  nutrition: { label: 'Beslenme' },
  movement: { label: 'Hareket' },
  risks: { label: 'Riskler' },
  actions: { label: 'Aksiyon' },
};

export const HEALTH_SCORE_HISTORY_MAX = 24;

export type HealthScores = Record<HealthScoreKey, number>;

export type StaffBrief = Record<StaffBriefKey, string>;

export type HealthScoreAnalysis = {
  version: number;
  generatedAt: string;
  scores: Partial<HealthScores>;
  overallScore: number;
  summary: string;
  staffBrief: StaffBrief;
  aiGenerated: boolean;
  aiAttemptedAt: string;
  fallbackReason?: string;
  bmi?: number | null;
  bmiCategory?: string | null;
  dailyCalories?: number | null;
  fitnessScore?: number | null;
  coachRecommendations?: unknown;
  dietitianRecommendations?: unknown;
  radarScores?: Record<string, number>;
};

export type HealthScoreHistoryEntry = {
  at: string;
  overallScore: number;
  scores: Partial<HealthScores>;
};

function formatAiError(error: unknown): string {
  const raw = String(error || '');
  const lower = raw.toLowerCase();
  if (raw.includes('429') || lower.includes('quota') || lower.includes('limit')) {
    return 'Analiz limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.';
  }
  if (raw === 'Failed to fetch' || lower.includes('fetch failed') || lower.includes('network')) {
    return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  }
  if (raw === 'timeout' || lower.includes('abort')) {
    return 'Analiz zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  if (raw.includes('503') || raw.includes('502')) {
    return 'Analiz servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
  }
  return 'Skor hesaplanamadı. Lütfen daha sonra tekrar deneyin.';
}

/** Skor snapshot'ını history dizisine ekler / aynı gün kaydını günceller. */
export function appendHealthScoreHistory(
  prevHistory: HealthScoreHistoryEntry[] | null | undefined,
  analysis: HealthScoreAnalysis | null | undefined,
): HealthScoreHistoryEntry[] {
  if (analysis?.overallScore == null && analysis?.overallScore !== 0) {
    return prevHistory || [];
  }
  const at = analysis?.aiAttemptedAt || new Date().toISOString();
  const day = String(at).slice(0, 10);
  const entry: HealthScoreHistoryEntry = {
    at,
    overallScore: analysis.overallScore,
    scores: { ...(analysis.scores || {}) },
  };
  const list = Array.isArray(prevHistory) ? [...prevHistory] : [];
  const sameDayIdx = list.findIndex((h) => String(h?.at || '').slice(0, 10) === day);
  if (sameDayIdx >= 0) list[sameDayIdx] = entry;
  else list.push(entry);
  list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return list.slice(-HEALTH_SCORE_HISTORY_MAX);
}

export function buildFallbackStaffBrief(
  scores: Partial<HealthScores> = {},
  overallScore = 50,
): StaffBrief {
  const s = scores || {};
  const weak = HEALTH_SCORE_KEYS.filter((k) => (s[k] ?? 50) < 50).map(
    (k) => HEALTH_SCORE_META[k]?.label || k,
  );
  const strong = HEALTH_SCORE_KEYS.filter((k) => (s[k] ?? 50) >= 70).map(
    (k) => HEALTH_SCORE_META[k]?.label || k,
  );

  return {
    general: `Danışanın genel sağlık skoru ${overallScore}/100. ${strong.length ? `Güçlü alanlar: ${strong.join(', ')}.` : 'Belirgin bir üstün alan öne çıkmıyor.'} ${weak.length ? `Dikkat gerektiren alanlar: ${weak.join(', ')}.` : 'Kritik düşük alan görünmüyor.'} Program planlamasında bu dengeyi göz önünde bulundurun.`,
    nutrition: `Beslenme skoru ${s.nutrition ?? '—'}/100. Öğün düzeni, hidrasyon ve sebze/meyve alışkanlıkları diyetisyen görüşmelerinde önceliklendirilmelidir. Aşırı işlenmiş gıda ve atıştırmalık sıklığı varsa kademeli azaltma hedefleri koyun.`,
    movement: `Hareket skoru ${s.movement ?? '—'}/100. Antrenman yoğunluğu ve frekansı mevcut kapasiteye göre ayarlanmalı; motivasyon (${s.motivation ?? '—'}) ve hazır oluş (${s.readiness ?? '—'}) skorları progressions için rehber alınabilir.`,
    risks: `Uyku (${s.sleep ?? '—'}) ve stres yönetimi (${s.stress ?? '—'}) skorları toparlanma riskini etkiler. Yaşam tarzı skoru ${s.lifestyle ?? '—'}; sigara/alkol/ekran gibi faktörler varsa yük artışı temkinli yapılmalıdır. Tıbbi geçmişteki uyarılar varsa program öncesi netleştirin.`,
    actions: `Önümüzdeki 2–4 haftada en düşük skorlu 1–2 alana odaklanın. Koç ve diyetisyen aynı hedef dilini kullansın; kısa check-in'lerle adherence takip edin. Skor güncellemelerini sağlık testi yenilemeleriyle izleyin.`,
  };
}

function normalizeStaffBrief(raw: unknown): StaffBrief | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as StaffBrief;
  for (const key of STAFF_BRIEF_KEYS) {
    const text = String(obj[key] || '').trim();
    if (!text) return null;
    out[key] = text.slice(0, 1200);
  }
  return out;
}

async function fetchJsonWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = AI_FETCH_TIMEOUT_MS,
): Promise<{ res: Response; data: Record<string, unknown> }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { res, data };
  } finally {
    clearTimeout(timer);
  }
}

function clamp(n: unknown, fallback = 50): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function scaleMap(
  value: unknown,
  map: Record<string, number>,
  fallback = 0,
): number {
  if (value == null || value === '') return fallback;
  const key = String(value);
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  return fallback;
}

/** describeHealthTest çıktısını kategori özetlerine çevirir. */
export function buildCategorySummaries(
  healthTest: Record<string, unknown> | null | undefined,
  gender: string | null | undefined,
  packageConfig: Record<string, unknown> | null = null,
): Record<string, string> {
  const sections = describeHealthTest(healthTest, gender, packageConfig);
  const buckets: Record<string, string[]> = {
    general: [],
    medical: [],
    nutrition: [],
    physical: [],
    lifestyle: [],
    special: [],
  };

  for (const sec of sections) {
    const lines = (sec.items || []).map((it) => `${it.label}: ${it.value}`);
    if (sec.id === 'general') buckets.general.push(...lines);
    else if (sec.id === 'medical') buckets.medical.push(...lines);
    else if (sec.id === 'nutrition') buckets.nutrition.push(...lines);
    else if (sec.id === 'physical') buckets.physical.push(...lines);
    else if (sec.id === 'lifestyle') buckets.lifestyle.push(...lines);
    else if (sec.id === 'women' || sec.id === 'men') buckets.special.push(...lines);
  }

  const join = (arr: string[]) => (arr.length ? arr.slice(0, 24).join('\n') : '—');
  return {
    general: join(buckets.general),
    medical: join(buckets.medical),
    nutrition: join(buckets.nutrition),
    physical: join(buckets.physical),
    lifestyle: join(buckets.lifestyle),
    special: join(buckets.special),
  };
}

/** AI başarısız olursa yeni soru anahtarlarından deterministik skor. */
export function computeFallbackHealthScores(
  profile: Record<string, unknown> = {},
): HealthScoreAnalysis {
  const ht = (profile.healthTest || {}) as Record<string, unknown>;
  let general = 55;
  general += scaleMap(ht.wellbeing, {
    very_low: -20,
    low: -10,
    medium: 0,
    good: 12,
    excellent: 18,
  });
  general += scaleMap(ht.energy, {
    very_low: -14,
    low: -8,
    moderate: 2,
    high: 10,
    very_high: 14,
  });
  general += scaleMap(ht.anxiety, {
    never: 12,
    rarely: 6,
    sometimes: 0,
    often: -10,
    always: -16,
  });
  general += scaleMap(ht.lifeQuality, {
    '1': -14,
    '2': -6,
    '3': 2,
    '4': 10,
    '5': 16,
  });

  let nutrition = 55;
  nutrition += scaleMap(ht.nutritionSelfRating, {
    very_poor: -22,
    needs_work: -12,
    moderate: 0,
    good: 12,
    excellent: 18,
  });
  nutrition += scaleMap(ht.nutritionWaterIntake, {
    under_1l: -12,
    '1_1_5l': -4,
    '1_5_2l': 4,
    '2_3l': 10,
    over_3l: 12,
  });
  nutrition += scaleMap(ht.nutritionVegetables, {
    very_low: -10,
    insufficient: -6,
    moderate: 2,
    sufficient: 8,
    excellent: 12,
  });
  nutrition += scaleMap(ht.nutritionFruit, {
    very_low: -6,
    insufficient: -3,
    moderate: 2,
    sufficient: 6,
    excellent: 8,
  });
  nutrition += scaleMap(ht.nutritionSweets, {
    never: 8,
    '1_week': 4,
    '2_3_week': -4,
    almost_daily: -12,
  });
  nutrition += scaleMap(ht.nutritionFastFood, {
    never: 8,
    '1_2_month': 4,
    '1_week': -2,
    '2_3_week': -8,
    '4_plus_week': -14,
  });

  let movement = 52;
  movement += scaleMap(ht.movementFeel, {
    very_sedentary: -18,
    mostly_sitting: -10,
    occasional: 0,
    mostly_active: 12,
    very_active: 18,
  });
  movement += scaleMap(ht.activitySelfRating, {
    very_low: -16,
    low: -8,
    moderate: 2,
    good: 12,
    excellent: 16,
  });
  movement += scaleMap(ht.stairsCapacity, {
    easily: 10,
    mild: 2,
    hard: -10,
    need_help: -16,
  });
  movement += scaleMap(ht.briskWalk30, {
    easily: 10,
    with_effort: 2,
    '10_15_only': -8,
    cannot: -14,
  });
  movement += scaleMap(ht.exerciseWillingness, {
    very_willing: 10,
    willing: 6,
    unsure: 0,
    not_much: -6,
    not_at_all: -12,
  });
  const pains = Array.isArray(ht.painAreas)
    ? ht.painAreas.filter((v) => v !== 'none')
    : [];
  movement -= Math.min(16, pains.length * 3);

  let sleep = 55;
  sleep += scaleMap(ht.dailySleepQuality || ht.sleepQuality, {
    very_poor: -22,
    poor: -14,
    fair: -2,
    good: 12,
    excellent: 18,
  });
  sleep += scaleMap(ht.sleepHours, {
    under_5: -18,
    '5_6': -8,
    '6_7': 2,
    '7_8': 14,
    '8_9': 10,
    over_9: 4,
  });
  sleep += scaleMap(ht.morningRested, {
    never: -14,
    rarely: -8,
    sometimes: 0,
    often: 8,
    always: 14,
  });
  sleep += scaleMap(ht.fallAsleepDifficulty, {
    never: 10,
    rarely: 6,
    sometimes: 0,
    often: -10,
    every_night: -16,
  });
  sleep += scaleMap(ht.nightWaking, {
    no: 10,
    rarely: 4,
    sometimes: -2,
    often: -10,
    every_night: -16,
  });

  let stress = 55;
  stress += scaleMap(ht.dailyStressImpact, {
    none: 16,
    low: 8,
    moderate: 0,
    high: -12,
    very_high: -18,
  });
  stress += scaleMap(ht.stressCoping, {
    always: 14,
    often: 8,
    sometimes: 0,
    rarely: -10,
    never: -16,
  });
  stress += scaleMap(ht.anxiety, {
    never: 12,
    rarely: 6,
    sometimes: 0,
    often: -10,
    always: -16,
  });

  let lifestyle = 55;
  lifestyle += scaleMap(ht.smoking, {
    never: 10,
    former: 4,
    occasional: -8,
    daily: -16,
  });
  lifestyle += scaleMap(ht.alcohol, {
    none: 8,
    monthly: 2,
    '1_2_week': -4,
    '3_plus_week': -10,
    daily: -16,
  });
  lifestyle += scaleMap(ht.screenTime, {
    under_2: 8,
    '2_4': 4,
    '4_6': 0,
    '6_8': -6,
    over_8: -12,
  });
  lifestyle += scaleMap(ht.workSchedule, {
    regular_day: 6,
    shift: -6,
    night: -10,
    irregular: -8,
    not_working: 2,
  });
  lifestyle += scaleMap(ht.lifeQualityOverall, {
    very_poor: -16,
    poor: -8,
    fair: 0,
    good: 10,
    excellent: 16,
  });

  let motivation = 50;
  const mot = Number(ht.motivation);
  if (Number.isFinite(mot)) motivation = clamp(mot * 10);
  motivation += scaleMap(ht.goalBelief, {
    none: -16,
    low: -8,
    unsure: 0,
    believe: 10,
    certain: 16,
  });

  let readiness = 50;
  readiness += scaleMap(ht.readinessToChange, {
    not_ready: -18,
    thinking: -6,
    ready: 8,
    started: 14,
    maintaining: 18,
  });
  readiness += scaleMap(ht.exerciseWillingness, {
    very_willing: 8,
    willing: 4,
    unsure: 0,
    not_much: -6,
    not_at_all: -12,
  });

  const scores: HealthScores = {
    general: clamp(general),
    nutrition: clamp(nutrition),
    movement: clamp(movement),
    sleep: clamp(sleep),
    stress: clamp(stress),
    lifestyle: clamp(lifestyle),
    motivation: clamp(motivation),
    readiness: clamp(readiness),
  };
  const overallScore = clamp(
    HEALTH_SCORE_KEYS.reduce((s, k) => s + scores[k], 0) / HEALTH_SCORE_KEYS.length,
  );

  const staffBrief = buildFallbackStaffBrief(scores, overallScore);
  return {
    version: HEALTH_ANALYSIS_VERSION,
    generatedAt: new Date().toISOString().split('T')[0],
    scores,
    overallScore,
    summary:
      'Cevaplarınıza göre kişisel sağlık skorunuz hesaplandı. Düzenli güncellemelerle skoru yükseltebilirsiniz.',
    staffBrief,
    aiGenerated: false,
    aiAttemptedAt: new Date().toISOString(),
  };
}

export function needsHealthScoreRefresh(
  analysis: HealthScoreAnalysis | null | undefined,
  _healthTest?: Record<string, unknown> | null,
): boolean {
  if (!analysis?.overallScore && analysis?.overallScore !== 0) return true;
  if (!analysis?.scores || typeof analysis.scores !== 'object') return true;
  if ((analysis.version || 0) < HEALTH_ANALYSIS_VERSION) return true;
  for (const key of HEALTH_SCORE_KEYS) {
    if (analysis.scores[key] == null) return true;
  }
  if (!normalizeStaffBrief(analysis.staffBrief)) return true;
  if (analysis.radarScores && !analysis.scores) return true;
  return false;
}

export async function fetchAiHealthScore({
  profile,
  categorySummaries,
}: {
  profile: Record<string, unknown>;
  categorySummaries: Record<string, string>;
}): Promise<
  | (HealthScoreAnalysis & { ok: true })
  | { ok: false; timedOut?: boolean; error: string }
> {
  if (isUiOnly()) {
    return { ok: false, error: 'Demo modda AI skor kapalı.' };
  }
  try {
    const { res, data } = await fetchJsonWithTimeout(apiUrl('/api/ai-nutrition-tips'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        task: 'health-score',
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          height: profile?.height,
          weight: profile?.weight,
          goals: profile?.goals || [],
          fitnessLevel: profile?.fitnessLevel,
        },
        categorySummaries,
      }),
    });
    if (!res.ok || !data.ok) {
      return { ok: false, error: formatAiError(data.error || res.statusText) };
    }
    const scores = (data.scores || {}) as Partial<HealthScores>;
    const overallScore = clamp(data.overallScore);
    const staffBrief =
      normalizeStaffBrief(data.staffBrief) ||
      buildFallbackStaffBrief(scores, overallScore);
    return {
      ok: true,
      version: HEALTH_ANALYSIS_VERSION,
      generatedAt: new Date().toISOString().split('T')[0],
      scores,
      overallScore,
      summary: String(data.summary || ''),
      staffBrief,
      aiGenerated: true,
      aiAttemptedAt: new Date().toISOString(),
    };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    const aborted = err?.name === 'AbortError';
    return {
      ok: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'timeout' : err.message),
    };
  }
}

/** AI dene; başarısızsa yedek skor döndür. */
export async function resolveHealthScoreAnalysis(
  profile: Record<string, unknown>,
): Promise<HealthScoreAnalysis> {
  const prev = (profile.healthAnalysis || {}) as HealthScoreAnalysis;
  const categorySummaries = buildCategorySummaries(
    profile?.healthTest as Record<string, unknown>,
    profile?.gender as string,
    (profile?.packageConfig as Record<string, unknown>) || null,
  );
  const ai = await fetchAiHealthScore({ profile, categorySummaries });
  if (ai.ok) {
    return {
      ...ai,
      bmi: prev.bmi ?? null,
      bmiCategory: prev.bmiCategory ?? null,
      dailyCalories: prev.dailyCalories ?? null,
      fitnessScore: prev.fitnessScore ?? null,
      coachRecommendations: prev.coachRecommendations,
      dietitianRecommendations: prev.dietitianRecommendations,
    };
  }
  const fallback = computeFallbackHealthScores(profile);
  return {
    ...fallback,
    bmi: prev.bmi ?? null,
    bmiCategory: prev.bmiCategory ?? null,
    dailyCalories: prev.dailyCalories ?? null,
    fitnessScore: prev.fitnessScore ?? null,
    coachRecommendations: prev.coachRecommendations,
    dietitianRecommendations: prev.dietitianRecommendations,
    fallbackReason: ai.error || 'AI skor üretilemedi',
  };
}
