import { parseDateStr } from './dates';

export const DOW_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? parseDateStr(d) : d;
}

export function fmtDate(d: Date | string): string {
  return toDate(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(d: Date | string): string {
  return toDate(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export function fmtSpan(days: number): string {
  if (days >= 365) {
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30.4375);
    return `${y}a${m ? ' ' + m + 'm' : ''}`;
  } else if (days >= 60) {
    return `${Math.floor(days / 30.4375)}m`;
  }
  return `${days}d`;
}

// Tempo na faixa: anos+meses se >= 1 ano, meses+dias se >= 60d, senão dias.
export function fmtBeltTime(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30.4375);
    return `${years}a${months ? ' ' + months + 'm' : ''} na faixa`;
  } else if (days >= 60) {
    const months = Math.floor(days / 30.4375);
    const rest = days - Math.round(months * 30.4375);
    return `${months}m${rest > 0 ? ' ' + rest + 'd' : ''} na faixa`;
  }
  return `há ${days} ${days === 1 ? 'dia' : 'dias'} na faixa`;
}

export function fmtMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1]}/${String(y).slice(2)}`;
}

export function fmtMonthKeyLong(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function fmtWeekStart(d: Date): string {
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.getDate()}/${d.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}`;
}
