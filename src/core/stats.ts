import { DAY_MS, WEEK_MS, isoWeekKey, parseDateStr, startOfDay, weekStartOf } from './dates';
import { periodStartTime, type StatsOptions } from './settings';
import type { Training } from './types';

export interface WeekStreak { start: Date; end: Date; length: number }
export interface WeekGap { beforeEnd: Date; afterStart: Date; voidStart: Date; voidEnd: Date; length: number }
export interface CumulativePoint { dateStr: string; date: Date; total: number }
export interface ActivityWeek { start: Date; end: Date; count: number; official: number; unofficial: number; isCurrent: boolean }
export type TrendDir = 'up' | 'down' | 'flat';

export interface RecentActivity {
  weeks: ActivityWeek[];
  slope: number;
  trendDir: TrendDir;
  trendLabel: string;
  last4Avg: number;
  peak12: number;
  peak12Week: ActivityWeek | null;
  currentCount: number;
}

export interface Stats {
  total: number;
  uniqueDays: number;
  totalDays: number;
  totalWeekdays: number;
  uniqueWeekdays: number;
  trainedRatio: number;
  // Streaks por SEMANA
  longest: number;
  longestStart: Date | null;
  longestEnd: Date | null;
  longestGap: WeekGap | null;
  currentStreak: number;
  streakIsActive: boolean;
  daysSinceLast: number;
  weeksSinceLastTraining: number | null;
  streaks: WeekStreak[];
  gaps: WeekGap[];
  // Frequência
  weeklyAvg: string; // toFixed(1)
  monthlyAvg: string; // toFixed(1)
  dowCounts: number[];
  dowCountsUnof: number[];
  dowDayCounts: number[];
  byMonth: Map<string, number>;
  byMonthOfficial: Map<string, number>;
  byMonthUnofficial: Map<string, number>;
  byWeek: Map<string, { count: number; official: number; unofficial: number; start: Date }>;
  mostActiveMonth: { key: string; count: number } | null;
  leastActiveMonth: { key: string; count: number } | null;
  mostActiveWeek: { key: string; count: number; start: Date } | null;
  dayDistribution: Map<number, number>; // treinos no dia -> nº de dias
  recordDayCount: number;
  recordDayDate: string | null;
  officialCount: number;
  unofficialCount: number;
  mixedDays: number;
  cumulative: CumulativePoint[];
  cumulativeAll: CumulativePoint[];
  // Marco e atividade recente
  nextMilestoneTotal: number;
  nextMilestoneRemaining: number;
  nextMilestoneEta: Date | null;
  recentActivity: RecentActivity;
  first: Training;
  last: Training;
}

export const NEXT_MILESTONE_STEP = 50;

// Tira a semana atual (ainda em andamento) quando o toggle está desligado.
export function filterCurrentWeek(list: Training[], includeCurrentWeek: boolean, now: Date): Training[] {
  if (includeCurrentWeek) return list;
  const thisWeekStart = weekStartOf(now).getTime();
  return list.filter(t => weekStartOf(t.date).getTime() < thisWeekStart);
}

// list = treinos medidos; allList = lista completa (oficial + não oficial), usada pra
// streaks/gaps e barras semanais, pra que o filtro de "oficial" não crie gaps falsos
// quando houve treino fora da academia.
export function computeStats(list: Training[], allList: Training[] | null, opts: StatsOptions): Stats | null {
  const { settings, includeCurrentWeek, now } = opts;
  if (!list.length) return null;
  if (!allList || !allList.length) allList = list;

  const thisWeekStartTime = weekStartOf(now).getTime();
  list = filterCurrentWeek(list, includeCurrentWeek, now);
  allList = filterCurrentWeek(allList, includeCurrentWeek, now);
  const firstTraining = list[0];
  const lastTraining = list[list.length - 1];
  if (!firstTraining || !lastTraining) return null;

  const dates = list.map(t => t.dateStr).sort();
  const uniqueDays = new Set(dates).size;

  const allDates = [...new Set(dates)].sort();
  const lastDate = parseDateStr(allDates[allDates.length - 1]!);
  const daysSinceLast = Math.round((startOfDay(now).getTime() - lastDate.getTime()) / DAY_MS);

  // ===== Streaks por SEMANA =====
  // Só conta como "semana treinada" a semana com >= streakMin treinos.
  // Gap = semanas consecutivas sem atingir o mínimo entre duas semanas treinadas.
  const trainingsByWeek = new Map<number, number>();
  allList.forEach(t => {
    const k = weekStartOf(t.date).getTime();
    trainingsByWeek.set(k, (trainingsByWeek.get(k) || 0) + 1);
  });
  const sortedWeekTimes = [...trainingsByWeek]
    .filter(([, cnt]) => cnt >= settings.streakMin)
    .map(([k]) => k)
    .sort((a, b) => a - b);

  const streaks: WeekStreak[] = [];
  const gaps: WeekGap[] = [];
  let longest = 0;
  let longestStart: Date | null = null;
  let longestEnd: Date | null = null;
  if (sortedWeekTimes.length) {
    let segStart = sortedWeekTimes[0]!, segEnd = segStart, cur = 1;
    for (let i = 0; i < sortedWeekTimes.length; i++) {
      const wt = sortedWeekTimes[i]!;
      if (i > 0) {
        const prev = sortedWeekTimes[i - 1]!;
        const diffWeeks = Math.round((wt - prev) / WEEK_MS);
        if (diffWeeks === 1) {
          cur++; segEnd = wt;
        } else {
          streaks.push({ start: new Date(segStart), end: new Date(segEnd + 6 * DAY_MS), length: cur });
          gaps.push({
            beforeEnd: new Date(prev + 6 * DAY_MS),
            afterStart: new Date(wt),
            voidStart: new Date(prev + WEEK_MS),
            voidEnd: new Date(wt - DAY_MS),
            length: diffWeeks - 1,
          });
          cur = 1; segStart = wt; segEnd = wt;
        }
      }
      if (cur > longest) {
        longest = cur;
        longestStart = new Date(segStart);
        longestEnd = new Date(segEnd + 6 * DAY_MS);
      }
    }
    streaks.push({ start: new Date(segStart), end: new Date(segEnd + 6 * DAY_MS), length: cur });
  }

  let longestGap: WeekGap | null = null;
  gaps.forEach(g => { if (!longestGap || g.length > longestGap.length) longestGap = g; });

  // Streak atual: termina na semana de referência ou na anterior. A semana de
  // referência é a atual com o toggle ligado, ou a passada com ele desligado.
  const refWeekStart = includeCurrentWeek ? thisWeekStartTime : thisWeekStartTime - WEEK_MS;
  const lastTrainedWeekTime = sortedWeekTimes.length ? sortedWeekTimes[sortedWeekTimes.length - 1]! : null;
  const weeksSinceLastTraining = lastTrainedWeekTime !== null
    ? Math.round((refWeekStart - lastTrainedWeekTime) / WEEK_MS)
    : null;
  const streakIsActive = weeksSinceLastTraining !== null && weeksSinceLastTraining <= 1;
  const currentStreak = streakIsActive && streaks.length ? streaks[streaks.length - 1]!.length : 0;

  // Período total. Com o toggle desligado, vai só até o domingo anterior.
  const first = parseDateStr(allDates[0]!);
  const last = includeCurrentWeek ? now : new Date(thisWeekStartTime - 1);
  const totalCalendarDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1);
  const totalWeekdays = (() => {
    let count = Math.floor(totalCalendarDays / 7) * 5;
    const remainder = totalCalendarDays % 7;
    const startDow = first.getDay();
    for (let i = 0; i < remainder; i++) {
      const dow = (startDow + i) % 7;
      if (dow >= 1 && dow <= 5) count++;
    }
    return Math.max(1, count);
  })();
  const uniqueWeekdays = [...new Set(list.map(t => t.dateStr))].filter(ds => {
    const dow = parseDateStr(ds).getDay();
    return dow >= 1 && dow <= 5;
  }).length;
  const trainedRatio = uniqueWeekdays / totalWeekdays;

  // === Período configurável para média semanal/mensal ===
  // Se o período começa antes do primeiro treino, recua para o primeiro treino real
  // (evita inflar o denominador).
  const pStart = periodStartTime(settings.weeklyAvgPeriod, now);
  const avgFirst = pStart !== null && pStart > first.getTime() ? new Date(pStart) : first;
  const avgLast = last;
  const avgPeriodDays = Math.max(1, Math.round((avgLast.getTime() - avgFirst.getTime()) / DAY_MS) + 1);
  const totalWeeks = Math.max(1, (avgLast.getTime() - avgFirst.getTime()) / WEEK_MS);
  const totalMonths = Math.max(1, avgPeriodDays / 30.4375);
  const avgPeriodList = list.filter(t =>
    t.date.getTime() >= avgFirst.getTime() && t.date.getTime() <= avgLast.getTime(),
  );
  const weeklyAvg = (avgPeriodList.length / totalWeeks).toFixed(1);
  const monthlyAvg = (avgPeriodList.length / totalMonths).toFixed(1);

  // Dia da semana
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  const dowCountsUnof = [0, 0, 0, 0, 0, 0, 0];
  const dowDaySets = dowCounts.map(() => new Set<string>());
  list.forEach(t => {
    const dow = t.date.getDay();
    dowCounts[dow]!++;
    dowDaySets[dow]!.add(t.dateStr);
  });
  allList.filter(t => !t.official).forEach(t => { dowCountsUnof[t.date.getDay()]!++; });
  const dowDayCounts = dowDaySets.map(s => s.size);

  // Por mês
  const byMonth = new Map<string, number>();
  const byMonthOfficial = new Map<string, number>();
  const byMonthUnofficial = new Map<string, number>();
  list.forEach(t => {
    const k = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(k, (byMonth.get(k) || 0) + 1);
    if (t.official) byMonthOfficial.set(k, (byMonthOfficial.get(k) || 0) + 1);
    else byMonthUnofficial.set(k, (byMonthUnofficial.get(k) || 0) + 1);
  });
  let mostActiveMonth: Stats['mostActiveMonth'] = null;
  let leastActiveMonth: Stats['leastActiveMonth'] = null;
  byMonth.forEach((count, key) => {
    if (!mostActiveMonth || count > mostActiveMonth.count) mostActiveMonth = { key, count };
    if (!leastActiveMonth || count < leastActiveMonth.count) leastActiveMonth = { key, count };
  });

  // Semana mais ativa (inclui não oficiais)
  const byWeek: Stats['byWeek'] = new Map();
  allList.forEach(t => {
    const k = isoWeekKey(t.date);
    let w = byWeek.get(k);
    if (!w) { w = { count: 0, official: 0, unofficial: 0, start: weekStartOf(t.date) }; byWeek.set(k, w); }
    w.count++;
    if (t.official) w.official++; else w.unofficial++;
  });
  let mostActiveWeek: Stats['mostActiveWeek'] = null;
  byWeek.forEach((v, k) => {
    if (!mostActiveWeek || v.count > mostActiveWeek.count) mostActiveWeek = { key: k, count: v.count, start: v.start };
  });

  // Dias com múltiplos treinos
  const trainingsPerDay = new Map<string, number>();
  list.forEach(t => trainingsPerDay.set(t.dateStr, (trainingsPerDay.get(t.dateStr) || 0) + 1));
  const dayDistribution = new Map<number, number>();
  let recordDayCount = 0;
  let recordDayDate: string | null = null;
  trainingsPerDay.forEach((cnt, ds) => {
    dayDistribution.set(cnt, (dayDistribution.get(cnt) || 0) + 1);
    if (cnt > recordDayCount) { recordDayCount = cnt; recordDayDate = ds; }
  });

  // Oficial vs não oficial
  const officialCount = list.filter(t => t.official).length;
  const unofficialCount = list.length - officialCount;
  const dayOfficialFlag = new Map<string, { o: boolean; u: boolean }>();
  list.forEach(t => {
    let v = dayOfficialFlag.get(t.dateStr);
    if (!v) { v = { o: false, u: false }; dayOfficialFlag.set(t.dateStr, v); }
    if (t.official) v.o = true; else v.u = true;
  });
  let mixedDays = 0;
  dayOfficialFlag.forEach(v => { if (v.o && v.u) mixedDays++; });

  // Séries acumuladas
  const cumulativeOf = (arr: Training[]): CumulativePoint[] =>
    arr.slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((t, i) => ({ dateStr: t.dateStr, date: t.date, total: i + 1 }));
  const cumulative = cumulativeOf(list);
  const cumulativeAll = cumulativeOf(allList);

  // ===== Próximo marco de 50 treinos =====
  const nextMilestoneTotal = (Math.floor(list.length / NEXT_MILESTONE_STEP) + 1) * NEXT_MILESTONE_STEP;
  const nextMilestoneRemaining = nextMilestoneTotal - list.length;
  const perWeek = parseFloat(weeklyAvg) || 0;
  let nextMilestoneEta: Date | null = null;
  if (perWeek > 0) {
    nextMilestoneEta = new Date(now);
    nextMilestoneEta.setDate(nextMilestoneEta.getDate() + Math.round((nextMilestoneRemaining / perWeek) * 7));
  }

  // ===== Atividade por semana: do começo até a semana de referência =====
  const firstWeekStart = weekStartOf(first);
  const lastWeekStart = includeCurrentWeek ? thisWeekStartTime : thisWeekStartTime - WEEK_MS;
  const totalWeeksSpan = Math.max(1, Math.round((lastWeekStart - firstWeekStart.getTime()) / WEEK_MS) + 1);

  const weekBucket = new Map<number, { official: number; unofficial: number }>();
  allList.forEach(t => {
    const k = weekStartOf(t.date).getTime();
    let b = weekBucket.get(k);
    if (!b) { b = { official: 0, unofficial: 0 }; weekBucket.set(k, b); }
    if (t.official) b.official++; else b.unofficial++;
  });

  const recentWeeks: ActivityWeek[] = [];
  for (let i = 0; i < totalWeeksSpan; i++) {
    const start = new Date(firstWeekStart.getTime() + i * WEEK_MS);
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const b = weekBucket.get(start.getTime()) || { official: 0, unofficial: 0 };
    recentWeeks.push({
      start, end,
      count: b.official + b.unofficial,
      official: b.official,
      unofficial: b.unofficial,
      isCurrent: i === totalWeeksSpan - 1,
    });
  }

  // Tendência: só as últimas 12 semanas, pra ficar estável
  const tail = recentWeeks.slice(-12);
  const ys = tail.map(w => w.count);
  const meanX = tail.length ? tail.reduce((s, _, i) => s + i, 0) / tail.length : 0;
  const meanY = ys.length ? ys.reduce((s, v) => s + v, 0) / ys.length : 0;
  let num = 0, den = 0;
  ys.forEach((y, x) => { num += (x - meanX) * (y - meanY); den += (x - meanX) ** 2; });
  const slope = den === 0 ? 0 : num / den;
  const totalChange = slope * Math.max(0, tail.length - 1);
  let trendDir: TrendDir = 'flat', trendLabel = 'estável';
  const threshold = Math.max(1, meanY * 0.25);
  if (totalChange > threshold) { trendDir = 'up'; trendLabel = 'subindo'; }
  else if (totalChange < -threshold) { trendDir = 'down'; trendLabel = 'caindo'; }
  const last4 = recentWeeks.slice(-4);
  const last4Avg = last4.length ? last4.reduce((s, w) => s + w.count, 0) / last4.length : 0;
  const peak12 = ys.length ? Math.max(...ys) : 0;
  const peak12Week = ys.length ? tail[ys.lastIndexOf(peak12)] ?? null : null;

  return {
    total: list.length,
    uniqueDays,
    totalDays: totalCalendarDays,
    totalWeekdays,
    uniqueWeekdays,
    trainedRatio,
    longest, longestStart, longestEnd,
    longestGap,
    currentStreak,
    streakIsActive,
    daysSinceLast,
    weeksSinceLastTraining,
    streaks, gaps,
    weeklyAvg,
    monthlyAvg,
    dowCounts,
    dowCountsUnof,
    dowDayCounts,
    byMonth,
    byMonthOfficial,
    byMonthUnofficial,
    byWeek,
    mostActiveMonth, leastActiveMonth,
    mostActiveWeek,
    dayDistribution,
    recordDayCount, recordDayDate,
    officialCount, unofficialCount,
    mixedDays,
    cumulative,
    cumulativeAll,
    nextMilestoneTotal, nextMilestoneRemaining, nextMilestoneEta,
    recentActivity: {
      weeks: recentWeeks,
      slope,
      trendDir,
      trendLabel,
      last4Avg,
      peak12,
      peak12Week,
      currentCount: recentWeeks.length ? recentWeeks[recentWeeks.length - 1]!.count : 0,
    },
    first: firstTraining,
    last: lastTraining,
  };
}
