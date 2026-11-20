import { daysAgo, parseDateStr, toDateStr } from './dates';
import type { Training } from './types';

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

// Texto abaixo do streak atual. Sem streak ativo, há quantas semanas não se atinge o
// mínimo; com streak, um dos rótulos, conforme a última semana que atingiu: a de
// referência (labels[0]) ou a anterior (labels[1]).
export function streakExtra(weeksSince: number | null, currentStreak: number, streakMin: number, labels: [string, string]): string {
  if (currentStreak === 0) return weeksSince ? `${weeksSince} sem sem ${streakMin}+ treinos` : '—';
  return weeksSince === 0 ? labels[0] : labels[1];
}

// Quando foi o último treino: hoje, ontem ou há N dias.
export function fmtLastTrainingAgo(last: Date, now: Date): string {
  const days = daysAgo(last, now);
  return days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
}

// Nome do arquivo do snapshot, com o dia local (não o UTC, que à noite já é o dia seguinte).
export function snapshotFilename(now: Date): string {
  return `jiu-jitsu-report-${toDateStr(now)}.html`;
}

// "+N não oficial(is)", como aparece nos totais e nas semanas.
export function fmtUnofficialCount(count: number): string {
  return `+${count} não oficial${count === 1 ? '' : 's'}`;
}

// Total de treinos: os não oficiais aparecem à parte, e nada quando não há.
export function unofficialTotal(trainings: Training[]): { count: number; inline: string; label: string } {
  const count = trainings.filter(t => !t.official).length;
  return count
    ? { count, inline: `+${count}`, label: fmtUnofficialCount(count) }
    : { count: 0, inline: '', label: '' };
}
