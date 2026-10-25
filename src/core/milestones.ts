import { WEEK_MS, addDays, weekStartOf } from './dates';
import { fmtMonthYear } from './format';
import type { StatsOptions } from './settings';
import { computeStats, type Stats } from './stats';
import type { Training } from './types';

export interface Badge {
  name: string;
  icon: string;
  desc: string;
  progress: number; // 0..1
  unlocked: boolean;
  eta: string | null;
  isNext: boolean;
}

export interface BadgeGroup {
  title: string;
  badges: Badge[];
}

const TRAINING_TARGETS = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];
const UNOFFICIAL_TARGETS = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500];
const STREAK_TARGETS = [2, 4, 8, 12, 16, 26, 52, 78, 104, 156]; // semanas: até 3 anos
const MULTI_DAY_TARGETS = [2, 3]; // sem 4-no-dia (raro demais pra valer badge)

const FULL_WEEK_DEFS = [
  { runs: 1, name: 'Semana cheia',   icon: '🗓️', desc: 'todos os dias úteis de uma semana' },
  { runs: 2, name: 'Quinzena cheia', icon: '📆', desc: '2 semanas seguidas, dias úteis 100%' },
  { runs: 3, name: 'Tríade cheia',   icon: '🔥', desc: '3 semanas seguidas, dias úteis 100%' },
];

function trainIcon(n: number): string {
  if (n >= 10000) return '🌟';
  if (n >= 7500) return '🪐';
  if (n >= 5000) return '☄️';
  if (n >= 3000) return '🌌';
  if (n >= 2000) return '🚀';
  if (n >= 1500) return '🛸';
  if (n >= 1000) return '🏆';
  if (n >= 750) return '👑';
  if (n >= 500) return '💎';
  if (n >= 300) return '🥇';
  if (n >= 200) return '🥈';
  if (n >= 100) return '💯';
  if (n >= 50) return '🔥';
  if (n >= 25) return '⭐';
  return '🎯';
}

function unofIcon(n: number): string {
  if (n >= 10000) return '🌍';
  if (n >= 7500) return '🏔️';
  if (n >= 5000) return '🗻';
  if (n >= 3000) return '🌋';
  if (n >= 2000) return '🏞️';
  if (n >= 1500) return '🌅';
  if (n >= 1000) return '🌄';
  if (n >= 500) return '🌳';
  if (n >= 200) return '🌲';
  if (n >= 100) return '🍃';
  if (n >= 50) return '🌿';
  if (n >= 25) return '🌱';
  return '☘️';
}

function streakIcon(n: number): string {
  if (n >= 156) return '👑';
  if (n >= 104) return '⚡';
  if (n >= 78) return '🚀';
  if (n >= 52) return '🏆';
  if (n >= 26) return '🔥';
  if (n >= 12) return '💪';
  if (n >= 8) return '🎯';
  return '✨';
}

function multiIcon(n: number): string {
  if (n >= 4) return '🚀';
  if (n >= 3) return '⚔️';
  return '⚡';
}

// Semanas "cheias": todos os dias úteis (seg–sex) com pelo menos 1 treino.
// Devolve os inícios dessas semanas em ordem crescente.
export function fullWeekStarts(trainings: Training[]): number[] {
  const hitsByWeek = new Map<number, Set<number>>();
  trainings.forEach(t => {
    const dow = t.date.getDay();
    if (dow < 1 || dow > 5) return;
    const k = weekStartOf(t.date).getTime();
    let s = hitsByWeek.get(k);
    if (!s) { s = new Set(); hitsByWeek.set(k, s); }
    s.add(dow);
  });
  const weeks: number[] = [];
  hitsByWeek.forEach((s, k) => { if (s.size >= 5) weeks.push(k); });
  return weeks.sort((a, b) => a - b);
}

// Percorre runs de semanas consecutivas; chama onWeek com o tamanho do run até ali.
function eachRun(weeks: number[], onWeek: (run: number) => void): void {
  let run = 0, prev: number | null = null;
  weeks.forEach(k => {
    run = prev !== null && Math.round((k - prev) / WEEK_MS) === 1 ? run + 1 : 1;
    onWeek(run);
    prev = k;
  });
}

// `trainings` é a lista efetiva (oficiais + não oficiais); `stats` vem dos oficiais.
// As ETAs usam a média semanal do período: dos oficiais e, nos não oficiais, a deles.
export function computeMilestones(stats: Stats, trainings: Training[], opts: StatsOptions): BadgeGroup[] {
  const { now } = opts;
  const totalTrainings = stats.total;
  const unofficial = trainings.filter(t => !t.official);
  const totalUnofficial = unofficial.length;

  // Dias com >= N treinos (usando todos os treinos)
  const allPerDay = new Map<string, number>();
  trainings.forEach(t => allPerDay.set(t.dateStr, (allPerDay.get(t.dateStr) || 0) + 1));

  const fullWeeks = fullWeekStarts(trainings);
  let longestFullWeekRun = 0;
  eachRun(fullWeeks, run => { if (run > longestFullWeekRun) longestFullWeekRun = run; });

  const etaStr = (remaining: number, perWeek: number): string | null => {
    if (remaining <= 0 || perWeek <= 0) return null;
    return `~${fmtMonthYear(addDays(now, Math.round((remaining / perWeek) * 7)))}`;
  };

  const perWeek = parseFloat(stats.weeklyAvg) || 0;
  const perWeekUnof = parseFloat(computeStats(unofficial, unofficial, opts)?.weeklyAvg ?? '') || 0;

  const ladder = (
    targets: number[], current: number, label: (t: number) => string,
    icon: (t: number) => string, perWeekRate: number,
  ): Badge[] => {
    const next = targets.find(t => t > current);
    return targets.map(target => {
      const unlocked = current >= target;
      const isNext = target === next;
      const remaining = Math.max(0, target - current);
      return {
        name: label(target),
        icon: icon(target),
        desc: unlocked ? 'desbloqueado' : (isNext ? `${remaining} para chegar` : `${current}/${target}`),
        progress: unlocked ? 1 : Math.min(1, current / target),
        unlocked,
        eta: !unlocked && isNext ? etaStr(remaining, perWeekRate) : null,
        isNext: isNext && !unlocked,
      };
    });
  };

  const limitBadges: Badge[] = MULTI_DAY_TARGETS.map(target => {
    let c = 0;
    allPerDay.forEach(cnt => { if (cnt >= target) c++; });
    const unlocked = c >= 1;
    return {
      name: `${target} no mesmo dia`,
      icon: multiIcon(target),
      desc: unlocked ? `${c} ${c === 1 ? 'vez' : 'vezes'}` : 'ainda não',
      progress: unlocked ? 1 : 0,
      unlocked,
      eta: null,
      isNext: !unlocked,
    };
  });
  FULL_WEEK_DEFS.forEach(def => {
    const unlocked = longestFullWeekRun >= def.runs;
    let desc: string;
    if (unlocked) {
      // Quantas vezes alcançou um run de pelo menos N semanas
      let achieved = 0;
      eachRun(fullWeeks, run => { if (run === def.runs) achieved++; });
      desc = achieved > 0 ? `${achieved} ${achieved === 1 ? 'vez' : 'vezes'} · ${def.desc}` : def.desc;
    } else {
      desc = `${longestFullWeekRun}/${def.runs} · ${def.desc}`;
    }
    limitBadges.push({
      name: def.name,
      icon: def.icon,
      desc,
      progress: unlocked ? 1 : longestFullWeekRun / def.runs,
      unlocked,
      eta: null,
      isNext: !unlocked && longestFullWeekRun + 1 === def.runs,
    });
  });

  return [
    { title: 'Treinos', badges: ladder(TRAINING_TARGETS, totalTrainings, t => `${t} treinos`, trainIcon, perWeek) },
    { title: 'Treinos não oficiais', badges: ladder(UNOFFICIAL_TARGETS, totalUnofficial, t => `${t} não oficiais`, unofIcon, perWeekUnof) },
    // Streaks usam stats.longest, que já considera todos os treinos
    { title: 'Streaks (semanas consecutivas)', badges: ladder(STREAK_TARGETS, stats.longest, t => `${t} sem`, streakIcon, 0) },
    { title: 'Teste de limites', badges: limitBadges },
  ];
}

// Número de colunas que divide o total sem deixar badge sozinha numa linha.
export function chooseCols(n: number): number {
  for (let c = 5; c >= 2; c--) {
    if (n % c === 0) return c;
  }
  return n;
}
