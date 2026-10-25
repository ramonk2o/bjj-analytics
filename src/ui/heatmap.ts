import { addDays, startOfDay, toDateStr } from '../core/dates';
import { MONTH_NAMES } from '../core/format';
import type { Stats } from '../core/stats';
import type { Training } from '../core/types';
import { state, type RenderContext } from '../state';
import { $ } from './dom';

// Calendário de treinos: uma coluna por semana (domingo → sábado), do primeiro treino até hoje.
export function renderHeatmap(list: Training[], stats: Stats, ctx: RenderContext): void {
  const heatmap = $('heatmap');
  const monthsRow = $('heatmapMonths');
  heatmap.innerHTML = '';
  monthsRow.innerHTML = '';

  // dateStr -> treinos do dia (usado pelo tooltip, lightbox e snapshot)
  const byDay = new Map<string, Training[]>();
  list.forEach(t => {
    const day = byDay.get(t.dateStr);
    if (day) day.push(t); else byDay.set(t.dateStr, [t]);
  });
  state.trainingsByDay = byDay;

  const start = new Date(stats.first.date);
  start.setDate(start.getDate() - start.getDay()); // volta pro domingo
  const end = addDays(ctx.now, 6 - ctx.now.getDay()); // avança pro sábado
  const today = startOfDay(ctx.now);

  const monthMarkers: { weekIndex: number; label: string }[] = [];
  let weekIndex = 0;
  let lastMonth = -1;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 && d > start) weekIndex++;
    const ds = toDateStr(d);
    const day = byDay.get(ds);
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    if (day) {
      const official = day.some(t => t.official);
      const unofficial = day.some(t => !t.official);
      cell.classList.add('l' + Math.min(day.length, 3), 'has-data');
      if (unofficial && official) cell.classList.add('mixed');
      else if (unofficial) cell.classList.add('unofficial-only');
      cell.dataset.dateStr = ds;
    } else if (d > today) {
      cell.classList.add('empty');
    } else {
      cell.classList.add('no-data');
      cell.dataset.dateStr = ds;
    }
    cell.style.gridRow = String(dow + 1);
    cell.style.gridColumn = String(weekIndex + 1);
    heatmap.appendChild(cell);

    if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
      monthMarkers.push({ weekIndex, label: MONTH_NAMES[d.getMonth()] + (d.getMonth() === 0 ? ` ${d.getFullYear()}` : '') });
      lastMonth = d.getMonth();
    }
  }
  heatmap.style.gridTemplateColumns = `repeat(${weekIndex + 1}, 13px)`;

  monthsRow.style.width = (weekIndex + 1) * 16 + 'px';
  monthsRow.style.position = 'relative';
  monthsRow.style.height = '14px';
  monthMarkers.forEach(m => {
    const lbl = document.createElement('div');
    lbl.style.position = 'absolute';
    lbl.style.left = m.weekIndex * 16 + 'px';
    lbl.textContent = m.label;
    monthsRow.appendChild(lbl);
  });

  $('heatmapMeta').textContent = `${stats.uniqueDays} ${stats.uniqueDays === 1 ? 'dia treinado' : 'dias treinados'} · clique num dia pra abrir a foto`;
}
