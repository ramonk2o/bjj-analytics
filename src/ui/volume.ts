import { DOW_NAMES, fmtMonthKeyLong, fmtWeekStart } from '../core/format';
import type { Stats } from '../core/stats';
import { $, miniStat } from './dom';

export function renderVolumeMetrics(stats: Stats): void {
  const { total, uniqueDays, weeklyAvg, monthlyAvg, dowCounts, mostActiveMonth, mostActiveWeek } = stats;
  const peakDow = dowCounts.indexOf(Math.max(...dowCounts));
  const items = [
    miniStat({ label: 'Total de treinos', value: total, extra: `${uniqueDays} ${uniqueDays === 1 ? 'dia diferente' : 'dias diferentes'}` }),
    miniStat({ label: 'Média semanal', value: weeklyAvg, unit: '/sem' }),
    miniStat({ label: 'Média mensal', value: monthlyAvg, unit: '/mês' }),
    miniStat({ label: 'Dia mais forte', value: DOW_NAMES[peakDow]!, extra: `${dowCounts[peakDow]} treinos no total`, accent: true }),
  ];
  if (mostActiveMonth) {
    items.push(miniStat({ label: 'Mês mais ativo', value: mostActiveMonth.count, unit: 'treinos', extra: fmtMonthKeyLong(mostActiveMonth.key) }));
  }
  if (mostActiveWeek) {
    items.push(miniStat({ label: 'Semana mais ativa', value: mostActiveWeek.count, unit: 'treinos', extra: fmtWeekStart(mostActiveWeek.start) }));
  }
  $('volumeMetrics').innerHTML = items.join('');
}
