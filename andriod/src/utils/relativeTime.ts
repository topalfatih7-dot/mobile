/** Türkçe göreli zaman etiketleri — UI listeleri (mesaj, ödeme, blog). */

export function formatRelativeTimeTr(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Dün' : `${days} gün önce`;
}

export function formatRelativeDayTr(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (dayDiff <= 0) return 'Bugün';
  if (dayDiff === 1) return 'Dün';
  return `${dayDiff} gün önce`;
}
