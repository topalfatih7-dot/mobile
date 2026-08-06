/**
 * Health test engine — web parity: Adsız `src/data/healthTest.js`
 * Flat `members.data.healthTest` shape (all question keys at top level).
 */
import { HEALTH_SECTIONS as RAW_SECTIONS } from '@/data/healthTestSections';

export type HealthOption = {
  value: string;
  label: string;
  emoji?: string;
  desc?: string;
  exclusive?: boolean;
  batteryLevel?: number;
  stars?: number;
};

export type HealthDetail = {
  key: string;
  when?: string | string[] | null;
  placeholder?: string;
};

export type SoftWarning = {
  message: string;
  when?: (ht: Record<string, unknown>) => boolean;
  requireAll?: Array<{
    key: string;
    equals?: string;
    includes?: string[];
  }>;
};

export type HealthQuestion = {
  key: string;
  type: string;
  required?: boolean;
  label: string;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: HealthOption[];
  detail?: HealthDetail;
  followUps?: HealthQuestion[];
  softWarning?: SoftWarning;
  infoNote?: string | ((ht: Record<string, unknown>) => string | null);
  infoNoteWhen?: string | string[];
  footerNote?: string;
  // enriched by getSectionQuestions / getApplicableQuestions
  sectionId?: string;
  sectionTitle?: string;
  sectionIcon?: string;
  audience?: string;
};

export type HealthSectionDef = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  audience?: string;
  genderOnly?: string;
  questions: HealthQuestion[];
};

export const HEALTH_SECTIONS = RAW_SECTIONS as HealthSectionDef[];

export const HEALTH_AUDIENCE_META: Record<
  string,
  { label: string; chipBg: string; chipText: string }
> = {
  shared: { label: 'Genel', chipBg: '#fef3c7', chipText: '#92400e' },
  coach: { label: 'Hareket', chipBg: '#dceef7', chipText: '#1f6289' },
  dietitian: { label: 'Beslenme', chipBg: '#e0f0e6', chipText: '#2d6242' },
};

function emptyValueForType(type: string) {
  if (type === 'multi' || type === 'file') return [];
  return '';
}

function registerQuestionKeys(obj: Record<string, unknown>, q: HealthQuestion) {
  if (!q?.key) return;
  obj[q.key] = emptyValueForType(q.type);
  if (q.detail) obj[q.detail.key] = '';
  (q.followUps || []).forEach((fu) => registerQuestionKeys(obj, fu));
}

export const EMPTY_HEALTH_TEST: Record<string, unknown> = (() => {
  const obj: Record<string, unknown> = {};
  HEALTH_SECTIONS.forEach((s) => {
    s.questions.forEach((q) => registerQuestionKeys(obj, q));
  });
  return obj;
})();

function normalizeGender(gender?: string | null): string {
  const g = String(gender || '')
    .toLowerCase()
    .trim();
  if (g === 'female' || g === 'kadın' || g === 'kadin' || g === 'f') return 'female';
  if (g === 'male' || g === 'erkek' || g === 'm') return 'male';
  return g;
}

/** Koşullu detay / follow-up gösterilsin mi? */
export function isDetailVisible(
  detail: HealthDetail | HealthQuestion | null | undefined,
  parentValue: unknown,
): boolean {
  if (!detail) return false;
  const when = (detail as HealthDetail).when;
  if (when == null) return true;
  if (Array.isArray(parentValue)) {
    if (Array.isArray(when)) return when.some((w) => parentValue.includes(w));
    return parentValue.includes(when);
  }
  if (Array.isArray(when)) return when.includes(parentValue as string);
  return parentValue === when;
}

export function isFollowUpVisible(followUp: HealthQuestion, parentValue: unknown) {
  return isDetailVisible(followUp as unknown as HealthDetail, parentValue);
}

export function isDetailFilled(
  detail: HealthDetail | undefined,
  healthTest: Record<string, unknown> | null | undefined,
) {
  if (!detail) return true;
  const val = healthTest?.[detail.key];
  return typeof val === 'string' && val.trim().length > 0;
}

function isFollowUpFilled(
  followUp: HealthQuestion,
  healthTest: Record<string, unknown> | null | undefined,
) {
  if (!followUp) return true;
  return (
    hasStoredAnswer(followUp, healthTest) &&
    isQuestionFullyAnswered(followUp, healthTest)
  );
}

export function getSoftWarningMessage(
  q: HealthQuestion | null | undefined,
  healthTest: Record<string, unknown> | null | undefined,
): string | null {
  const sw = q?.softWarning;
  if (!sw?.message) return null;
  const ht = healthTest || {};

  if (typeof sw.when === 'function') {
    return sw.when(ht) ? sw.message : null;
  }

  const rules = sw.requireAll || [];
  const ok = rules.every((rule) => {
    const val = ht[rule.key];
    if (rule.equals != null) return val === rule.equals;
    if (Array.isArray(rule.includes)) {
      if (!Array.isArray(val)) return false;
      return rule.includes.some((v) => (val as string[]).includes(v));
    }
    return false;
  });
  return ok ? sw.message : null;
}

export function isQuestionFullyAnswered(
  q: HealthQuestion | null | undefined,
  healthTest: Record<string, unknown> | null | undefined,
): boolean {
  if (!q) return false;
  const parentVal = healthTest?.[q.key];
  const detailVisible = Boolean(q.detail && isDetailVisible(q.detail, parentVal));
  const visibleFollowUps = (q.followUps || []).filter((fu) =>
    isFollowUpVisible(fu, parentVal),
  );

  const dependentsOk = () => {
    if (detailVisible && !isDetailFilled(q.detail, healthTest)) return false;
    for (const fu of visibleFollowUps) {
      if (fu.required === false) {
        if (hasStoredAnswer(fu, healthTest) && !isFollowUpFilled(fu, healthTest)) {
          return false;
        }
        continue;
      }
      if (!isFollowUpFilled(fu, healthTest)) return false;
    }
    return true;
  };

  if (!q.required) {
    if (!hasStoredAnswer(q, healthTest)) return true;
    return dependentsOk();
  }

  if (!hasStoredAnswer(q, healthTest)) return false;
  return dependentsOk();
}

/** AI analizi ve eski kayıtlar için yeni cevapları kanonik değerlere çevirir. */
export function normalizeHealthTestForAnalysis(
  ht: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!ht) return {};
  const n: Record<string, unknown> = { ...ht };

  const wellbeingMap: Record<string, string> = {
    very_low: '1',
    low: '2',
    medium: '3',
    good: '4',
    excellent: '5',
  };
  if (typeof n.wellbeing === 'string' && wellbeingMap[n.wellbeing]) {
    n.wellbeing = wellbeingMap[n.wellbeing];
  }

  if (
    n.injuries === 'yes_ongoing' ||
    n.injuries === 'yes_recovered' ||
    n.injuries === 'yes_partial'
  ) {
    n.injuries = 'yes';
  }

  if (
    n.medications === 'regular' ||
    n.medications === 'occasional' ||
    n.medications === 'both'
  ) {
    n.medications = 'yes';
  }
  if (n.medications === 'none') n.medications = 'no';

  const activityMap: Record<string, string> = {
    '0': 'sedentary',
    '1_2': 'light',
    '3_4': 'moderate',
    '5_plus': 'active',
  };
  if (typeof n.activityFrequency === 'string' && activityMap[n.activityFrequency]) {
    n.activityFrequency = activityMap[n.activityFrequency];
  }

  const sittingMap: Record<string, string> = {
    under_4: '<4',
    '4_6': '4-8',
    '7_9': '8+',
    '10_plus': '8+',
  };
  if (typeof n.sittingHours === 'string' && sittingMap[n.sittingHours]) {
    n.sittingHours = sittingMap[n.sittingHours];
  }

  const teaMap: Record<string, string> = {
    '0_1': 'low',
    '2_3': 'moderate',
    '4_5': 'moderate',
    '6_plus': 'high',
  };
  if (typeof n.teaCoffee === 'string' && teaMap[n.teaCoffee]) {
    n.teaCoffee = teaMap[n.teaCoffee];
  }

  const substanceMap: Record<string, string> = { no: 'none', yes: 'regular' };
  if (typeof n.substanceUse === 'string' && substanceMap[n.substanceUse]) {
    n.substanceUse = substanceMap[n.substanceUse];
  }

  const smokeMap: Record<string, string> = {
    never: 'no',
    daily: 'yes',
    former: 'quit',
    occasional: 'yes',
  };
  if (typeof n.smoking === 'string' && smokeMap[n.smoking]) {
    n.smoking = smokeMap[n.smoking];
  }

  const alcoholMap: Record<string, string> = {
    none: 'never',
    monthly: 'rarely',
    weekly: 'regularly',
    frequent: 'regularly',
  };
  if (typeof n.alcohol === 'string' && alcoholMap[n.alcohol]) {
    n.alcohol = alcoholMap[n.alcohol];
  }

  const clearanceLegacy: Record<string, string> = {
    no_need: 'no',
    not_yet: 'unsure',
  };
  if (typeof n.doctorClearance === 'string' && clearanceLegacy[n.doctorClearance]) {
    n.doctorClearance = clearanceLegacy[n.doctorClearance];
  }

  if (Array.isArray(n.chronicConditions)) {
    n.chronicConditions = (n.chronicConditions as string[]).filter((v) => v !== 'none');
    if ((n.chronicConditions as string[]).includes('heartDisease')) {
      n.chronicConditions = [
        ...new Set([
          ...(n.chronicConditions as string[]).filter((v) => v !== 'heartDisease'),
          'heart',
        ]),
      ];
    }
  }

  if (Array.isArray(n.familyHistory)) {
    n.familyHistory = (n.familyHistory as string[]).filter(
      (v) => v !== 'none' && v !== 'unknown',
    );
    if ((n.familyHistory as string[]).includes('heartDisease')) {
      n.familyHistory = [
        ...new Set([
          ...(n.familyHistory as string[]).filter((v) => v !== 'heartDisease'),
          'heart',
        ]),
      ];
    }
  }

  if (n.energy === 'very_high') n.energy = 'high';

  for (const key of ['primaryGoalReason', 'biggestBarrier']) {
    if (typeof n[key] === 'string' && n[key]) n[key] = [n[key]];
  }

  return n;
}

export function getHealthPackageContext(_packageConfig: Record<string, unknown> = {}) {
  return { hasCoach: true, hasDietitian: true };
}

function sectionApplies(section: HealthSectionDef, gender: string) {
  if (section.genderOnly && section.genderOnly !== gender) return false;
  return true;
}

export function getApplicableSections(
  gender?: string | null,
  _packageConfig: Record<string, unknown> | null = null,
): HealthSectionDef[] {
  const g = normalizeGender(gender);
  return HEALTH_SECTIONS.filter((s) => sectionApplies(s, g));
}

export function getApplicableQuestions(
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
): HealthQuestion[] {
  return getApplicableSections(gender, packageConfig).flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIcon: section.icon,
      audience: section.audience || 'shared',
    })),
  );
}

export function hasStoredAnswer(
  q: HealthQuestion | null | undefined,
  healthTest: Record<string, unknown> | null | undefined,
): boolean {
  if (!q) return false;
  const val = healthTest?.[q.key];
  if (q.type === 'multi' || q.type === 'file') {
    if (typeof val === 'string' && val.trim()) return true;
    return Array.isArray(val) && val.length > 0;
  }
  if (q.type === 'scale') {
    if (val === '' || val == null) return false;
    const num = Number(val);
    return Number.isFinite(num);
  }
  if (q.type === 'text' || q.type === 'time') {
    return typeof val === 'string' && val.trim().length > 0;
  }
  return val !== '' && val != null;
}

export function isQuestionAnswered(
  q: HealthQuestion,
  healthTest: Record<string, unknown> | null | undefined,
) {
  return isQuestionFullyAnswered(q, healthTest);
}

export function getHealthTestResumeState(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
  opts: { healthAck?: boolean; disclaimer?: boolean } = {},
) {
  const questions = getApplicableQuestions(gender, packageConfig);
  if (!questions.length) return { questionIndex: 0, phase: 'questions' as const };

  if (!opts.healthAck || !opts.disclaimer) {
    return { questionIndex: 0, phase: 'ack' as const };
  }

  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest };

  let lastAnsweredIndex = -1;
  for (let i = 0; i < questions.length; i++) {
    if (hasStoredAnswer(questions[i], ht)) lastAnsweredIndex = i;
  }

  const firstRequiredGap = questions.findIndex((q) => !isQuestionFullyAnswered(q, ht));
  if (firstRequiredGap >= 0) {
    return { questionIndex: firstRequiredGap, phase: 'questions' as const };
  }

  const allPass = questions.every((q) => isQuestionAnswered(q, ht));
  if (allPass) {
    return { questionIndex: 0, phase: 'questions' as const };
  }

  const nextIndex = Math.min(lastAnsweredIndex + 1, questions.length - 1);
  return { questionIndex: Math.max(0, nextIndex), phase: 'questions' as const };
}

export function hasHealthTestProgress(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
) {
  const questions = getApplicableQuestions(gender, packageConfig);
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest };
  return questions.some((q) => hasStoredAnswer(q, ht));
}

export function isSectionComplete(
  sectionOrId: HealthSectionDef | string,
  healthTest: Record<string, unknown> | null | undefined,
): boolean {
  const section =
    typeof sectionOrId === 'string'
      ? HEALTH_SECTIONS.find((s) => s.id === sectionOrId)
      : sectionOrId;
  if (!section?.questions?.length) return false;
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest };
  const required = section.questions.filter((q) => q.required);

  if (required.length === 0) {
    return section.questions.every(
      (q) => hasStoredAnswer(q, ht) && isQuestionFullyAnswered(q, ht),
    );
  }

  return section.questions.every((q) => isQuestionFullyAnswered(q, ht));
}

export function getSectionQuestions(
  sectionId: string,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
): HealthQuestion[] {
  const section = getApplicableSections(gender, packageConfig).find(
    (s) => s.id === sectionId,
  );
  if (!section) return [];
  return section.questions.map((q) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    audience: section.audience || 'shared',
  }));
}

export function getSectionProgress(
  section: HealthSectionDef,
  healthTest: Record<string, unknown> | null | undefined,
) {
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest };
  const required = section.questions.filter((q) => q.required);
  const tracked = required.length > 0 ? required : section.questions;
  const requiredAnswered = tracked.filter((q) =>
    required.length > 0 ? isQuestionFullyAnswered(q, ht) : hasStoredAnswer(q, ht),
  ).length;
  const started = section.questions.some(
    (q) =>
      hasStoredAnswer(q, ht) ||
      (q.detail && isDetailFilled(q.detail, ht)) ||
      (q.followUps || []).some((fu) => hasStoredAnswer(fu, ht)),
  );
  const complete = isSectionComplete(section, ht);
  return {
    requiredTotal: tracked.length,
    requiredAnswered,
    complete,
    started,
    percent: tracked.length
      ? Math.round((requiredAnswered / tracked.length) * 100)
      : 0,
  };
}

export function getSectionResumeState(
  section: HealthSectionDef,
  healthTest: Record<string, unknown> | null | undefined,
) {
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest };
  const mapped = section.questions.map((q) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    audience: section.audience || 'shared',
  }));

  const firstRequiredGap = mapped.findIndex((q) => !isQuestionFullyAnswered(q, ht));
  if (firstRequiredGap >= 0) {
    return { questionIndex: firstRequiredGap, phase: 'questions' as const };
  }

  const allPass = mapped.every((q) => isQuestionAnswered(q, ht));
  if (allPass) {
    return {
      questionIndex: Math.max(0, mapped.length - 1),
      phase: 'questions' as const,
    };
  }

  let lastAnsweredIndex = -1;
  for (let i = 0; i < mapped.length; i++) {
    if (hasStoredAnswer(mapped[i], ht)) lastAnsweredIndex = i;
  }
  return {
    questionIndex: Math.max(0, lastAnsweredIndex + 1),
    phase: 'questions' as const,
  };
}

export function getHealthTestHubSections(
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
  healthTest: Record<string, unknown> | null | undefined = {},
) {
  return getApplicableSections(gender, packageConfig).map((section) => ({
    section,
    progress: getSectionProgress(section, healthTest),
  }));
}

export function countCompletedSections(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
) {
  return getApplicableSections(gender, packageConfig).filter((s) =>
    isSectionComplete(s, healthTest),
  ).length;
}

export function getOverallHealthTestProgress(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
) {
  const sections = getApplicableSections(gender, packageConfig);
  if (!sections.length) return { completed: 0, total: 0, percent: 0 };
  const completed = countCompletedSections(healthTest, gender, packageConfig);
  return {
    completed,
    total: sections.length,
    percent: Math.round((completed / sections.length) * 100),
  };
}

export function isHealthTestComplete(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  packageConfig: Record<string, unknown> | null = null,
) {
  return getApplicableSections(gender, packageConfig).every((s) =>
    isSectionComplete(s, healthTest),
  );
}

/** Compat alias used by screens / layout */
export function allApplicableComplete(
  gender: string | null | undefined,
  healthTest: Record<string, unknown> | null | undefined,
  packageConfig?: Record<string, unknown> | null,
) {
  return isHealthTestComplete(healthTest, gender, packageConfig);
}

/** Compat wrapper — sectionId based progress */
export function sectionProgress(
  sectionId: string,
  healthTest: Record<string, unknown> | null | undefined,
) {
  const section = HEALTH_SECTIONS.find((s) => s.id === sectionId);
  if (!section) {
    return { done: 0, total: 0, complete: false, started: false, percent: 0 };
  }
  const p = getSectionProgress(section, healthTest);
  return {
    done: p.requiredAnswered,
    total: p.requiredTotal,
    complete: p.complete,
    started: p.started,
    percent: p.percent,
  };
}

export function getSectionMeta(sectionId: string) {
  const def = HEALTH_SECTIONS.find((s) => s.id === sectionId);
  if (!def) return null;
  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle || '',
    icon: def.icon,
    audience: def.audience || 'shared',
  };
}

function formatAnswerDisplay(
  q: HealthQuestion,
  v: unknown,
  _healthTest: Record<string, unknown>,
): string | null {
  if (q.type === 'multi') {
    if (!Array.isArray(v) || v.length === 0) return null;
    return v
      .map((val) => q.options?.find((o) => o.value === val)?.label || String(val))
      .join(', ');
  }
  if (q.type === 'file') {
    if (!Array.isArray(v) || v.length === 0) return null;
    return `${v.length} dosya yüklendi`;
  }
  if (q.type === 'scale') {
    if (v === '' || v == null) return null;
    return `${v} / 10`;
  }
  if (q.type === 'text' || q.type === 'time') {
    if (!v) return null;
    return q.type === 'time' ? String(v).replace(':', '.') : String(v);
  }
  if (v === '' || v == null) return null;
  return q.options?.find((o) => o.value === v)?.label || String(v);
}

export function describeHealthTest(
  healthTest: Record<string, unknown> | null | undefined,
  gender?: string | null,
  _packageConfig: Record<string, unknown> | null = null,
) {
  if (!healthTest) return [];
  const g = normalizeGender(gender);
  const sections = HEALTH_SECTIONS.filter((section) => {
    if (!sectionApplies(section, g)) return false;
    return section.questions.some((q) => {
      const v = healthTest[q.key];
      if (q.type === 'multi' || q.type === 'file') {
        return Array.isArray(v) && v.length > 0;
      }
      return v !== '' && v != null;
    });
  });
  return sections
    .map((section) => {
      const items: { label: string; value: string }[] = [];
      section.questions.forEach((q) => {
        const v = healthTest[q.key];
        const display = formatAnswerDisplay(q, v, healthTest);
        if (display == null) return;
        items.push({ label: q.label, value: display });
        if (q.detail && isDetailVisible(q.detail, v) && healthTest[q.detail.key]) {
          items.push({ label: 'Açıklama', value: String(healthTest[q.detail.key]) });
        }
        (q.followUps || []).forEach((fu) => {
          if (!isFollowUpVisible(fu, v)) return;
          const fuDisplay = formatAnswerDisplay(fu, healthTest[fu.key], healthTest);
          if (fuDisplay == null) return;
          items.push({ label: fu.label, value: fuDisplay });
          if (
            fu.detail &&
            isDetailVisible(fu.detail, healthTest[fu.key]) &&
            healthTest[fu.detail.key]
          ) {
            items.push({
              label: 'Açıklama',
              value: String(healthTest[fu.detail.key]),
            });
          }
        });
      });
      return {
        id: section.id,
        title: section.title,
        audience: section.audience || 'shared',
        items,
      };
    })
    .filter((s) => s.items.length > 0);
}

export function toggleExclusiveMulti(
  current: unknown,
  value: string,
  options: HealthOption[] = [],
): string[] {
  const arr = Array.isArray(current)
    ? (current as string[])
    : typeof current === 'string' && current
      ? [current]
      : [];
  const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value);
  const isExclusive = exclusiveValues.includes(value);

  if (arr.includes(value)) {
    return arr.filter((x) => x !== value);
  }
  if (isExclusive) return [value];
  return [...arr.filter((x) => !exclusiveValues.includes(x)), value];
}

export function clearHiddenFollowUps(
  q: HealthQuestion,
  parentValue: unknown,
  patch: Record<string, unknown> = {},
): Record<string, unknown> {
  const next = { ...patch };
  (q.followUps || []).forEach((fu) => {
    if (!isFollowUpVisible(fu, parentValue)) {
      next[fu.key] = emptyValueForType(fu.type);
      if (fu.detail) next[fu.detail.key] = '';
      Object.assign(next, clearHiddenFollowUps(fu, next[fu.key] ?? '', {}));
    }
  });
  if (q.detail && !isDetailVisible(q.detail, parentValue)) {
    next[q.detail.key] = '';
  }
  return next;
}

export function isGenderOnlySection(sectionId: string) {
  return ['women', 'men'].includes(sectionId);
}
