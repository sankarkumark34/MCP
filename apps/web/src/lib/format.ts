export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMs = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(Math.abs(diffMs) / 60000);
  const future = diffMs > 0;
  let text: string;
  if (minutes < 1) text = 'less than a minute';
  else if (minutes < 60) text = `${minutes} min`;
  else if (minutes < 60 * 24) text = `${Math.round(minutes / 60)} h`;
  else text = `${Math.round(minutes / (60 * 24))} d`;
  return future ? `in ${text}` : `${text} ago`;
}

export function apiErrorMessage(err: unknown): string {
  const e = err as { data?: { message?: string | string[] }; error?: string };
  const msg = e?.data?.message;
  if (Array.isArray(msg)) return msg.join('; ');
  if (typeof msg === 'string') return msg;
  if (typeof e?.error === 'string') return e.error;
  return 'Request failed. Please try again.';
}
