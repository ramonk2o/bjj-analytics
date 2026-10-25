import { MONTH_NAMES, fmtDateShort } from '../core/format';
import type { Stats } from '../core/stats';
import type { RenderContext } from '../state';
import { $ } from './dom';

// Barras de treinos por semana, do início até a semana de referência, com rolagem horizontal.
export function renderRecentActivity(stats: Stats, ctx: RenderContext): void {
  const r = stats.recentActivity;
  const svg = $<SVGSVGElement>('activitySvg');
  const scroll = $('activityScroll');
  svg.innerHTML = '';
  if (!r.weeks.length) return;

  // Cada semana ocupa ~22px (70% barra); mínimo de largura pra preencher o container.
  const PX_PER_WEEK = 22;
  const containerW = Math.max(400, scroll.clientWidth || 600);
  const W = Math.max(containerW, r.weeks.length * PX_PER_WEEK);
  const H = 200;
  const pad = { top: 14, right: 12, bottom: 28, left: 12 };
  const usableW = W - pad.left - pad.right;
  const usableH = H - pad.top - pad.bottom;
  const maxC = Math.max(...r.weeks.map(w => w.count), 1);
  const baselineAvg = parseFloat(stats.weeklyAvg) || 0;
  const barSlot = usableW / r.weeks.length;
  const barW = Math.max(2, barSlot * 0.7);

  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Linha da média
  if (baselineAvg > 0 && baselineAvg <= maxC) {
    const yBase = pad.top + (1 - baselineAvg / maxC) * usableH;
    svg.insertAdjacentHTML('beforeend',
      `<line class="activity-baseline" x1="${pad.left}" x2="${W - pad.right}" y1="${yBase}" y2="${yBase}" />
       <text class="activity-axis" x="${W - pad.right - 2}" y="${yBase - 3}" text-anchor="end">média ${baselineAvg.toFixed(1)}/sem</text>`);
  }

  // Marcadores de mês no eixo X, só onde o mês muda
  let prevMonth = -1;
  r.weeks.forEach((w, i) => {
    const m = w.start.getMonth();
    if (m !== prevMonth) {
      const x = pad.left + i * barSlot + barSlot / 2;
      const lbl = MONTH_NAMES[m]!.slice(0, 3) + (m === 0 || prevMonth === -1 ? `/${String(w.start.getFullYear()).slice(2)}` : '');
      svg.insertAdjacentHTML('beforeend',
        `<text class="activity-axis" x="${x}" y="${H - 8}" text-anchor="middle">${lbl}</text>`);
      prevMonth = m;
    }
  });

  // Barras (oficial embaixo, não oficial em cima)
  r.weeks.forEach((w, i) => {
    const totalH = (w.count / maxC) * usableH;
    const ofH = (w.official / maxC) * usableH;
    const unofH = (w.unofficial / maxC) * usableH;
    const x = pad.left + i * barSlot + (barSlot - barW) / 2;
    const yTop = pad.top + usableH - totalH;
    const yOf = pad.top + usableH - ofH;
    const tipParts = [`${w.official} oficial`];
    if (w.unofficial) tipParts.push(`+${w.unofficial} não oficial${w.unofficial === 1 ? '' : 's'}`);
    const curTag = w.isCurrent ? (ctx.includeCurrentWeek ? ' (atual, parcial)' : ' (última)') : '';
    const tip = `${fmtDateShort(w.start)} → ${fmtDateShort(w.end)} · ${tipParts.join(' ')}${curTag}`;
    const cur = w.isCurrent ? ' current' : '';
    if (unofH > 0) {
      svg.insertAdjacentHTML('beforeend',
        `<rect class="activity-bar-unof${cur}" x="${x}" y="${Math.min(yTop, pad.top + usableH - 1)}" width="${barW}" height="${Math.max(1, unofH)}" rx="2" data-tip="${tip}" />`);
    }
    if (ofH > 0) {
      svg.insertAdjacentHTML('beforeend',
        `<rect class="activity-bar${cur}" x="${x}" y="${Math.min(yOf, pad.top + usableH - 1)}" width="${barW}" height="${Math.max(1, ofH)}" rx="2" data-tip="${tip}" />`);
    } else if (unofH === 0) {
      svg.insertAdjacentHTML('beforeend',
        `<rect class="activity-bar${cur}" x="${x}" y="${pad.top + usableH - 1}" width="${barW}" height="1" rx="2" data-tip="${tip}" opacity="0.25" />`);
    }
  });

  // Sombra indicando conteúdo à esquerda quando há scroll
  const parent = scroll.parentElement!;
  let shadow = parent.querySelector<HTMLElement>('.activity-scroll-shadow');
  if (!shadow) {
    shadow = document.createElement('div');
    shadow.className = 'activity-scroll-shadow';
    parent.appendChild(shadow);
    const s = shadow;
    scroll.addEventListener('scroll', () => s.classList.toggle('visible', scroll.scrollLeft > 8));
  }
  // Rola pro fim (semanas mais recentes)
  scroll.scrollLeft = scroll.scrollWidth;
  shadow.classList.toggle('visible', scroll.scrollLeft > 8);

  // Pill de tendência
  const pill = $('activityTrend');
  pill.className = 'trend-pill ' + r.trendDir;
  const arrow = r.trendDir === 'up' ? '▲' : r.trendDir === 'down' ? '▼' : '≈';
  pill.textContent = `${arrow} ${r.trendLabel}`;

  $('activityMeta').textContent =
    `${r.weeks.length} semanas · ${fmtDateShort(r.weeks[0]!.start)} → ${fmtDateShort(r.weeks[r.weeks.length - 1]!.end)}`;

  // Stats laterais (o bloco fica escondido, mas segue atualizado)
  const cur = r.weeks[r.weeks.length - 1] || { official: r.currentCount, unofficial: 0, count: r.currentCount };
  const peakUnof = r.peak12Week ? r.peak12Week.unofficial : 0;
  $('activityStats').innerHTML = `
    <div class="activity-stat current">
      <div class="as-label">${ctx.includeCurrentWeek ? 'Esta semana' : 'Última semana'}</div>
      <div class="as-value">${cur.official}<span class="as-unof">${cur.unofficial ? ' +' + cur.unofficial : ''}</span></div>
      <div class="as-extra">treino${cur.count === 1 ? '' : 's'}${cur.unofficial ? ' (com não oficial)' : ''}</div>
    </div>
    <div class="activity-stat">
      <div class="as-label">Média 4 semanas</div>
      <div class="as-value">${r.last4Avg.toFixed(1)}</div>
      <div class="as-extra">treinos / sem</div>
    </div>
    <div class="activity-stat">
      <div class="as-label">Pico (12 sem)</div>
      <div class="as-value">${r.peak12}<span class="as-unof">${peakUnof ? ' +' + peakUnof : ''}</span></div>
      <div class="as-extra">${r.peak12Week ? fmtDateShort(r.peak12Week.start) : ''}</div>
    </div>
  `;
}
