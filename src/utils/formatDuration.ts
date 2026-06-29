export function formatDurationTr(ms: number): string {
  if (ms <= 0) return '0 dk';
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} dk`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}
