/** Local calendar day as YYYY-MM-DD (not UTC, so "today" matches the user's clock). */
export function localDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(day: string, n: number): string {
  const dt = parseDay(day);
  dt.setDate(dt.getDate() + n);
  return localDay(dt);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

/** Monday-based start of the week containing `day`. */
export function weekStart(day: string): string {
  const dow = (parseDay(day).getDay() + 6) % 7;
  return addDays(day, -dow);
}

export function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}
