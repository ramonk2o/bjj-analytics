import { BELT_RULES_DEFAULTS } from './belts';
import type { BeltClass } from './types';

export type AvgPeriod = '3m' | '6m' | '12m' | 'all';
export type GrauOverride = 'auto' | '0' | '1' | '2' | '3' | '4';

export interface Settings {
  beltRules: Record<BeltClass, number>; // aulas por grau
  streakMin: number; // mínimo de treinos/semana p/ contar como "semana treinada"
  grauOverride: GrauOverride;
  weeklyAvgPeriod: AvgPeriod; // período considerado nas médias semanais/mensais
}

export const AVG_PERIODS: readonly AvgPeriod[] = ['3m', '6m', '12m', 'all'];

export function defaultSettings(): Settings {
  return {
    beltRules: { ...BELT_RULES_DEFAULTS },
    streakMin: 2,
    grauOverride: 'auto',
    weeklyAvgPeriod: '3m',
  };
}

// Everything a stats function needs besides the trainings.
export interface StatsOptions {
  settings: Settings;
  includeCurrentWeek: boolean;
  now: Date;
}

export function periodStartTime(period: AvgPeriod, now: Date): number | null {
  if (period === 'all') return null;
  const months = { '3m': 3, '6m': 6, '12m': 12 }[period] || 3;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function periodLabel(period: AvgPeriod): string {
  return {
    '3m':  'últimos 3 meses',
    '6m':  'últimos 6 meses',
    '12m': 'últimos 12 meses',
    'all': 'todo o histórico',
  }[period] || 'últimos 3 meses';
}

export function periodShort(period: AvgPeriod): string {
  return { '3m': '3m', '6m': '6m', '12m': '12m', 'all': 'tudo' }[period] || '3m';
}
