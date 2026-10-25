export const DAY_MS = 86400000;
export const WEEK_MS = 7 * DAY_MS;

export function parseDateStr(ds: string): Date {
  return new Date(ds + 'T00:00:00');
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startOfDay(d: Date): Date {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
}

export function addDays(d: Date, days: number): Date {
  const dd = new Date(d);
  dd.setDate(dd.getDate() + days);
  return dd;
}

// Dias inteiros entre a data e hoje (arredonda pra baixo).
export function daysAgo(d: Date | string, now: Date): number {
  const date = typeof d === 'string' ? parseDateStr(d) : d;
  return Math.floor((startOfDay(now).getTime() - date.getTime()) / DAY_MS);
}

// Semana ISO (segunda → domingo): início da semana à meia-noite local.
export function weekStartOf(d: Date): Date {
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (dd.getDay() + 6) % 7; // Mon=0
  dd.setDate(dd.getDate() - dayNum);
  dd.setHours(0, 0, 0, 0);
  return dd;
}

export function isoWeekKey(d: Date): string {
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (dd.getDay() + 6) % 7; // Mon=0
  dd.setDate(dd.getDate() - dayNum + 3);
  const firstThursday = dd.getTime();
  const yearStart = new Date(dd.getFullYear(), 0, 1);
  const weekNum = 1 + Math.round(((firstThursday - yearStart.getTime()) / DAY_MS - 3 + ((yearStart.getDay() + 6) % 7)) / 7);
  return `${dd.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
