import { DOW_NAMES } from '../core/format';
import type { Stats } from '../core/stats';
import { $ } from './dom';

const MON_TO_SUN = [1, 2, 3, 4, 5, 6, 0];

export function renderDow(stats: Stats): void {
  const grid = $('dowGrid');
  grid.innerHTML = '';
  const max = Math.max(...stats.dowCounts, 1);
  MON_TO_SUN.forEach(i => {
    const c = stats.dowCounts[i]!;
    const row = document.createElement('div');
    row.style.display = 'contents';
    row.innerHTML = `
      <div class="dow-label">${DOW_NAMES[i]}</div>
      <div class="dow-bar"><div class="dow-bar-fill" style="width:${(c / max) * 100}%"></div></div>
      <div class="dow-count">${c}</div>
    `;
    grid.appendChild(row);
  });
}

export function renderDowHeatmap(stats: Stats): void {
  const grid = $('dowHeatmap');
  grid.innerHTML = '';
  const totals = stats.dowCounts.map((c, i) => c + stats.dowCountsUnof[i]!);
  const maxC = Math.max(...totals, 1);
  const peakIdx = stats.dowCounts.indexOf(Math.max(...stats.dowCounts));
  MON_TO_SUN.forEach(i => {
    const c = stats.dowCounts[i]!;
    const u = stats.dowCountsUnof[i]!;
    const cell = document.createElement('div');
    cell.className = 'dow-cell' + (i === peakIdx && c > 0 ? ' peak' : '');
    cell.innerHTML = `
      <div class="dh-label">${DOW_NAMES[i]}</div>
      <div class="dh-count">${c}${u ? `<span class="dh-unof"> +${u}</span>` : ''}</div>
      <div class="dh-pct">${c > 0 ? Math.round((c / maxC) * 100) : 0}% do pico</div>
    `;
    grid.appendChild(cell);
  });
}
