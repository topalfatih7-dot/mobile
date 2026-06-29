export type AppNotification = {
  id: string;
  type?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  threadId?: string;
  staffRole?: string;
};

export function parseMemberNotifications(raw: unknown): AppNotification[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id || ''),
        type: row.type ? String(row.type) : undefined,
        title: String(row.title || 'Bildirim'),
        message: String(row.message || ''),
        read: Boolean(row.read),
        createdAt: String(row.createdAt || ''),
        threadId: row.threadId ? String(row.threadId) : undefined,
        staffRole: row.staffRole ? String(row.staffRole) : undefined,
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function countUnreadNotifications(notifications: AppNotification[]) {
  return notifications.filter((item) => !item.read).length;
}

export function formatNotificationTime(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
