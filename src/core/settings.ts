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

// Valores do formulário de configurações, como o usuário digitou.
export interface SettingsForm {
  branca: string;
  azul: string;
  roxa: string;
  marrom: string;
  streakMin: string;
  grauOverride: string;
  weeklyAvgPeriod: string;
}

// Configurações a salvar a partir do formulário: aulas por grau vazio ou 0 volta ao
// padrão, o mínimo por semana fica entre 1 e 7 e um período desconhecido vira 3 meses.
export function settingsFromForm(form: SettingsForm, previous: Settings): Settings {
  const aulas = (value: string, fallback: number) => parseInt(value) || fallback;
  const period = form.weeklyAvgPeriod as AvgPeriod;
  return {
    beltRules: {
      ...previous.beltRules,
      branca: aulas(form.branca, BELT_RULES_DEFAULTS.branca),
      azul: aulas(form.azul, BELT_RULES_DEFAULTS.azul),
      roxa: aulas(form.roxa, BELT_RULES_DEFAULTS.roxa),
      marrom: aulas(form.marrom, BELT_RULES_DEFAULTS.marrom),
    },
    streakMin: Math.max(1, Math.min(7, parseInt(form.streakMin) || 2)),
    grauOverride: form.grauOverride as GrauOverride,
    weeklyAvgPeriod: AVG_PERIODS.includes(period) ? period : '3m',
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
