import { fmtDateShort } from '../core/format';
import type { Stats } from '../core/stats';
import type { RenderContext } from '../state';
import { $, miniStat, streakExtra } from './dom';

const weeks = (n: number) => (n === 1 ? 'semana' : 'semanas');

export function renderConsistency(stats: Stats, ctx: RenderContext): void {
  const min = ctx.settings.streakMin;
  $('streakSubtitle').textContent = `streaks de semanas com ${min}+ treinos`;
  $('streakLegStreak').textContent = `streak (semanas seguidas com ${min}+ treinos)`;
  $('streakLegGap').textContent = `gap (semanas com menos de ${min} treinos)`;

  const items = [
    miniStat({
      label: 'Maior streak',
      value: stats.longest,
      unit: weeks(stats.longest),
      extra: stats.longest > 0 && stats.longestStart && stats.longestEnd
        ? `${fmtDateShort(stats.longestStart)} → ${fmtDateShort(stats.longestEnd)}`
        : '',
      accent: true,
    }),
    miniStat({
      label: 'Streak atual',
      value: stats.currentStreak,
      unit: weeks(stats.currentStreak),
      extra: streakExtra(stats.weeksSinceLastTraining, stats.currentStreak, min,
        ctx.includeCurrentWeek ? ['inclui esta semana', 'até semana passada'] : ['até a semana passada', 'até há 2 semanas']),
    }),
    stats.longestGap
      ? miniStat({
          label: 'Maior gap',
          value: stats.longestGap.length,
          unit: weeks(stats.longestGap.length),
          extra: `${fmtDateShort(stats.longestGap.voidStart)} → ${fmtDateShort(stats.longestGap.voidEnd)}`,
        })
      : miniStat({ label: 'Maior gap', value: '—', extra: 'sem intervalos ainda' }),
    miniStat({
      label: 'Taxa de presença',
      value: Math.round(stats.trainedRatio * 100),
      unit: '%',
      extra: `${stats.uniqueWeekdays} de ${stats.totalWeekdays} dias úteis`,
    }),
  ];
  $('consistencyMetrics').innerHTML = items.join('');
}

// Linha do tempo de streaks e gaps, proporcional ao nº de semanas.
export function renderTimelineSG(stats: Stats): void {
  const svg = $<SVGSVGElement>('timelineSvg');
  svg.innerHTML = '';
  const firstStreak = stats.streaks[0];
  const lastStreak = stats.streaks[stats.streaks.length - 1];
  if (!firstStreak || !lastStreak) return;

  const segments: string[] = [];
  const lengths: number[] = [];
  stats.streaks.forEach((s, i) => {
    lengths.push(s.length);
    segments.push(`Streak: ${s.length} ${weeks(s.length)} · ${fmtDateShort(s.start)} → ${fmtDateShort(s.end)}`);
    const g = stats.gaps[i];
    if (g) {
      lengths.push(g.length);
      segments.push(`Gap: ${g.length} ${weeks(g.length)} sem treino · ${fmtDateShort(g.voidStart)} → ${fmtDateShort(g.voidEnd)}`);
    }
  });
  const totalSpan = lengths.reduce((s, n) => s + Math.max(1, n), 0);
  const W = 600, H = 90;
  const pad = { top: 8, bottom: 22 };
  const barH = H - pad.top - pad.bottom;

  let x = 0;
  segments.forEach((tip, i) => {
    const w = (Math.max(1, lengths[i]!) / totalSpan) * W;
    const cls = i % 2 === 0 ? 'tl-streak' : 'tl-gap';
    svg.insertAdjacentHTML('beforeend',
      `<rect class="${cls}" x="${x}" y="${pad.top}" width="${Math.max(1, w)}" height="${barH}" data-tip="${tip}" />`);
    x += w;
  });

  svg.insertAdjacentHTML('beforeend',
    `<text class="tl-axis" x="0" y="${H - 6}" text-anchor="start">${fmtDateShort(firstStreak.start)}</text>
     <text class="tl-axis" x="${W}" y="${H - 6}" text-anchor="end">${fmtDateShort(lastStreak.end)}</text>`);
}
