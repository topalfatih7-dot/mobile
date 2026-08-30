/** LOCK: docs/mobile/domains/engagement-reminders.md */

export type HabitAction =
  | 'habit_motivation'
  | 'habit_water'
  | 'habit_meal'
  | 'habit_workout'
  | 'habit_streak'
  | 'habit_health'
  | 'habit_upsell'
  | 'habit_winback'
  | 'habit_daily_tip'
  | 'habit_program_meal'
  | 'habit_program_workout'
  | 'habit_no_activity';

export type HabitCopy = { title: string; body: string };

const MOTIVATION: HabitCopy[] = [
  { title: '✨ Değişim seni bekliyor', body: 'Gel ve başla — bugün küçük bir adım yeter.' },
  { title: '🌅 Bugün harika bir gün olabilir', body: 'İlk görevin seni içeride bekliyor.' },
  { title: '💪 Gel ve başla', body: 'Küçük adımlar büyük dönüşümlerin başlangıcıdır.' },
  { title: '🌿 Yeni bir gün, yeni bir adım', body: 'Uygulamayı aç, bugünü boş geçirme.' },
  { title: '🔥 Dönüşüm içeride', body: 'Seni bekleyen görevler var — bir bak.' },
];

const WATER: HabitCopy[] = [
  { title: '💧 Su içmeyi unutma', body: 'Bir bardak su, şimdi. Güne devam.' },
  { title: '💧 Bir bardak su, şimdi', body: 'Su içmeyi unutmayın — vücudun teşekkür eder.' },
  { title: '💧 Güne suyla devam', body: 'Kısa bir mola: bir bardak su iç.' },
  { title: '💧 Su molası', body: 'Hatırlatma: su içmeyi unutma.' },
];

const MEAL: HabitCopy[] = [
  { title: '🥗 Öğünün hazır', body: 'Listen seni bekliyor — işaretlemeyi unutma.' },
  { title: '🍽️ Listen seni bekliyor', body: 'Bugünkü öğünü aç ve tamamla.' },
  { title: '🥗 Öğünü unutma', body: 'Takvimde bugünkü listen hazır.' },
];

const WORKOUT: HabitCopy[] = [
  { title: '🏋️ Bugünkü antrenman seni bekliyor', body: '10 dakika bile fark eder — gel ve başla.' },
  { title: '💪 Hareket zamanı', body: 'Bugünkü programın hazır. Bir bak.' },
  { title: '🏃 10 dakika bile fark eder', body: 'Antrenmanını aç, ilk hareketi tamamla.' },
];

const STREAK: HabitCopy[] = [
  { title: '🔥 Serin kırılmasın', body: 'Bugünü boş geçirme — takvime bir bak.' },
  { title: '🔥 Bugünü boş geçirme', body: 'Serini canlı tutmak için bir görev yeter.' },
  { title: '⭐ Kaldığın yerden devam', body: 'Bugünkü işaretlerin seni bekliyor.' },
];

const HEALTH: HabitCopy[] = [
  { title: '❤️ Kişisel analizin seni bekliyor', body: 'Birkaç soru, skorun netleşsin. Gel ve başla.' },
  { title: '🩺 Sağlık analizin yarım', body: 'Kişisel sağlık analizin içeride duruyor.' },
];

const UPSELL: HabitCopy[] = [
  { title: '✨ Dönüşüm içeride — gel ve başla', body: 'Koç ve diyetisyen desteği bir paket uzağında.' },
  { title: '💎 Değişim seni bekliyor', body: 'Program, takvim ve mesaj için planını aç.' },
];

const WINBACK: HabitCopy[] = [
  { title: '👋 Seni özledik', body: 'Kaldığın yerden devam — değişim seni bekliyor.' },
];

const DAILY_TIP: HabitCopy[] = [
  { title: '💡 Günün ipucu', body: 'Bugün küçük bir adım yeter — panele bir bak.' },
];

const PROGRAM_MEAL: HabitCopy[] = [
  { title: '🥗 Öğün Zamanı!', body: 'Beslenme listeniz sizi bekliyor.' },
  { title: '🍽️ Öğün saati geldi', body: 'Bugünkü listeniz hazır — takvimden işaretleyin.' },
];

const PROGRAM_WORKOUT: HabitCopy[] = [
  { title: '🏋️ Antrenman Zamanı!', body: 'Bugünkü antrenmanınız başlıyor.' },
  { title: '💪 Hareket saati geldi', body: 'Programınız hazır — gel ve başla.' },
];

const NO_ACTIVITY: HabitCopy[] = [
  {
    title: '👀 Bugün henüz başlamadınız',
    body: 'Antrenman ya da beslenme kaydınız yok — hadi birlikte başlayalım!',
  },
  {
    title: '🌙 Gün bitmeden bir adım',
    body: 'Bugün henüz işaret yok. Hadi birlikte başlayalım.',
  },
];

const POOLS: Record<HabitAction, HabitCopy[]> = {
  habit_motivation: MOTIVATION,
  habit_water: WATER,
  habit_meal: MEAL,
  habit_workout: WORKOUT,
  habit_streak: STREAK,
  habit_health: HEALTH,
  habit_upsell: UPSELL,
  habit_winback: WINBACK,
  habit_daily_tip: DAILY_TIP,
  habit_program_meal: PROGRAM_MEAL,
  habit_program_workout: PROGRAM_WORKOUT,
  habit_no_activity: NO_ACTIVITY,
};

function dayIndex(dateStr: string, len: number) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  const n = Math.floor(
    (Date.UTC(y, (m || 1) - 1, d || 1) - Date.UTC(y, 0, 0)) / 86400000,
  );
  return Math.abs(n) % Math.max(len, 1);
}

export function pickHabitCopy(action: HabitAction, dateStr: string): HabitCopy {
  const pool = POOLS[action] || MOTIVATION;
  return pool[dayIndex(dateStr, pool.length)] || pool[0];
}

/** Günün ipucu bildirimi: başlık sabit, gövde API/yedek metin. */
export function pickDailyTipCopy(dateStr: string, tipBody?: string | null): HabitCopy {
  const base = pickHabitCopy('habit_daily_tip', dateStr);
  const body = String(tipBody || '').trim();
  return { title: base.title, body: body || base.body };
}

/** Öğün saati bildirimi: başlık öğün kısa adı, gövde program başlığı. */
export function pickProgramMealCopy(
  dateStr: string,
  mealShort: string,
  programTitle?: string | null,
): HabitCopy {
  const base = pickHabitCopy('habit_program_meal', dateStr);
  const short = String(mealShort || '').trim() || 'Öğün';
  const prog = String(programTitle || '').trim();
  const bodies = [
    prog ? `${prog}: bugünkü listeniz sizi bekliyor.` : base.body,
    prog ? `${prog} saati geldi — takvimden işaretleyin.` : base.body,
  ];
  return {
    title: `🥗 ${short} Zamanı!`,
    body: bodies[dayIndex(dateStr, bodies.length)] || bodies[0],
  };
}

export function pickProgramWorkoutCopy(
  dateStr: string,
  programTitle?: string | null,
): HabitCopy {
  const base = pickHabitCopy('habit_program_workout', dateStr);
  const prog = String(programTitle || '').trim();
  const bodies = [
    prog ? `${prog}: bugünkü antrenmanınız başlıyor.` : base.body,
    prog ? `${prog} hazır — gel ve başla.` : base.body,
  ];
  return {
    title: base.title,
    body: bodies[dayIndex(dateStr, bodies.length)] || bodies[0],
  };
}

export function isHabitAction(action?: string | null): action is HabitAction {
  return String(action || '').startsWith('habit_');
}
