/**
 * Telegram bildirimi — web `telegramNotify.js` portu (docs/rn-migration/06).
 * Bot token sunucuda; istemci yalnızca secret header + event gönderir.
 */
import { apiUrl } from '@/config/env';

function readNotifySecret(): string {
  const value = process.env.EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET;
  return typeof value === 'string' ? value.trim() : '';
}

export async function notifyTelegram(event: string, payload: Record<string, unknown> = {}) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = readNotifySecret();
    if (secret) headers['X-Notify-Secret'] = secret;

    await fetch(apiUrl('/api/telegram-notify'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, ...payload, at: new Date().toISOString() }),
    });
  } catch {
    // Bildirim hatası uygulama akışını kesmemeli
  }
}
