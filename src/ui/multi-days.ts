import { fmtDate } from '../core/format';
import type { Stats } from '../core/stats';
import { $, miniStat } from './dom';

export function renderMultiDays(stats: Stats): void {
  const daysWithAtLeast = (min: number) =>
    [...stats.dayDistribution].filter(([n]) => n >= min).reduce((s, [, c]) => s + c, 0);
  const multiDays = daysWithAtLeast(2);
  const tripleDays = daysWithAtLeast(3);

  $('multiSummary').innerHTML = [
    miniStat({
      label: 'Recorde no dia',
      value: stats.recordDayCount,
      unit: stats.recordDayCount === 1 ? 'treino' : 'treinos',
      extra: stats.recordDayDate ? fmtDate(stats.recordDayDate) : '',
      accent: true,
    }),
    miniStat({ label: 'Dias duplos+', value: multiDays, extra: `de ${stats.uniqueDays} dias` }),
    miniStat({ label: 'Dias triplos+', value: tripleDays, extra: tripleDays === 0 ? 'ainda nenhum' : 'ou mais' }),
  ].join('');

  // Barras de distribuição
  const grid = $('multiGrid');
  grid.innerHTML = '';
  const maxN = Math.max(...stats.dayDistribution.keys(), 1);
  const maxC = Math.max(...stats.dayDistribution.values(), 1);
  for (let n = 1; n <= Math.max(maxN, 3); n++) {
    const c = stats.dayDistribution.get(n) || 0;
    const row = document.createElement('div');
    row.style.display = 'contents';
    row.innerHTML = `
      <div class="multi-label">${n} treino${n === 1 ? '' : 's'}</div>
      <div class="multi-bar"><div class="multi-bar-fill" style="width:${(c / maxC) * 100}%"></div></div>
      <div class="multi-count">${c}<span class="h">d</span></div>
    `;
    grid.appendChild(row);
  }
}
