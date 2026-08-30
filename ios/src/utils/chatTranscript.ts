import { format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';

export type ChatRow<T extends { id: string }> =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'msg'; id: string; message: T };

export function formatChatDayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return 'Bugün';
  if (isYesterday(d)) return 'Dün';
  return format(d, 'd MMMM yyyy', { locale: tr });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return format(d, 'yyyy-MM-dd');
}

/** Kronolojik mesajlar → inverted FlatList satırları (yeniler önce; gün ayırıcıları dahil). */
export function toInvertedChatRows<T extends { id: string; createdAt: string }>(
  messages: T[],
): ChatRow<T>[] {
  const chrono = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const rows: ChatRow<T>[] = [];
  let lastDay = '';
  for (const message of chrono) {
    const day = dayKey(message.createdAt);
    if (day !== lastDay) {
      rows.push({
        kind: 'date',
        id: `day-${day}`,
        label: formatChatDayLabel(message.createdAt),
      });
      lastDay = day;
    }
    rows.push({ kind: 'msg', id: message.id, message });
  }
  return rows.reverse();
}
