import { fmtDate, fmtDateShort } from '../core/format';
import type { Stats } from '../core/stats';
import type { RenderContext } from '../state';
import { $ } from './dom';

// Treinos acumulados (oficiais por cima, todos por baixo) com projeção até o próximo marco.
export function renderCumulativeChart(stats: Stats, ctx: RenderContext): void {
  const svg = $<SVGSVGElement>('cumulativeChart');
  svg.innerHTML = '';
  const cum = stats.cumulative;
  const cumAll = stats.cumulativeAll.length ? stats.cumulativeAll : cum;
  const lastCum = cum[cum.length - 1];
  const lastAll = cumAll[cumAll.length - 1];
  if (!lastCum || !lastAll) return;
  const nowMs = ctx.now.getTime();

  const W = 600, H = 240;
  const pad = { top: 16, right: 16, bottom: 36, left: 40 };
  const minDate = Math.min(cum[0]!.date.getTime(), cumAll[0]!.date.getTime());
  const maxTotal = Math.max(lastCum.total, lastAll.total);
  // Inclui o próximo marco na escala Y pra projeção caber
  const milestone50 = (Math.floor(lastCum.total / 50) + 1) * 50;
  const niceMax = Math.ceil(Math.max(maxTotal, milestone50) / 50) * 50 || 50;
  // ETA projetado do próximo marco, pra estender o eixo X
  const projMonthly = parseFloat(stats.monthlyAvg) || 0;
  const projRemaining = milestone50 - lastCum.total;
  const projEtaMs = projMonthly > 0 && projRemaining > 0
    ? nowMs + (projRemaining / projMonthly) * 30.4375 * 86400000
    : nowMs;
  const maxDate = Math.max(lastCum.date.getTime(), lastAll.date.getTime(), nowMs, projEtaMs);

  const xFor = (t: number) => pad.left + ((t - minDate) / (maxDate - minDate)) * (W - pad.left - pad.right);
  const yFor = (v: number) => pad.top + (1 - v / niceMax) * (H - pad.top - pad.bottom);

  svg.insertAdjacentHTML('beforeend',
    `<defs><linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0%" stop-color="#ff5722" stop-opacity="0.45" />
       <stop offset="100%" stop-color="#ff5722" stop-opacity="0" />
     </linearGradient></defs>`);

  // Grid horizontal
  for (let i = 0; i <= 4; i++) {
    const v = Math.round(niceMax * i / 4);
    const y = yFor(v);
    svg.insertAdjacentHTML('beforeend',
      `<line class="cum-grid" x1="${pad.left}" x2="${W - pad.right}" y1="${y}" y2="${y}" />
       <text class="cum-axis" x="${pad.left - 6}" y="${y + 3}" text-anchor="end">${v}</text>`);
  }

  // Linha "todos" (oficial + não oficial), desenhada por baixo
  if (lastAll.total > lastCum.total) {
    let allD = `M ${xFor(cumAll[0]!.date.getTime())} ${yFor(cumAll[0]!.total)}`;
    cumAll.slice(1).forEach(p => { allD += ` L ${xFor(p.date.getTime())} ${yFor(p.total)}`; });
    allD += ` L ${xFor(Math.max(lastAll.date.getTime(), nowMs))} ${yFor(lastAll.total)}`;
    svg.insertAdjacentHTML('beforeend', `<path class="cum-line-all" d="${allD}" />`);
  }

  // Área e linha dos oficiais, estendida até hoje na altura do último ponto
  let pathD = `M ${xFor(cum[0]!.date.getTime())} ${yFor(cum[0]!.total)}`;
  cum.slice(1).forEach(p => { pathD += ` L ${xFor(p.date.getTime())} ${yFor(p.total)}`; });
  const todayX = xFor(Math.max(lastCum.date.getTime(), nowMs));
  pathD += ` L ${todayX} ${yFor(lastCum.total)}`;
  const areaD = pathD + ` L ${todayX} ${yFor(0)} L ${xFor(cum[0]!.date.getTime())} ${yFor(0)} Z`;
  svg.insertAdjacentHTML('beforeend', `<path class="cum-area" d="${areaD}" />`);
  svg.insertAdjacentHTML('beforeend', `<path class="cum-line" d="${pathD}" />`);

  // Marcadores nos múltiplos de 100/50/25, conforme o total
  const milestoneStep = maxTotal >= 200 ? 100 : (maxTotal >= 100 ? 50 : 25);
  const reached: { m: number; x: number; y: number; dateStr: string }[] = [];
  const seen = new Set<number>();
  cum.forEach(p => {
    const m = Math.floor(p.total / milestoneStep) * milestoneStep;
    if (m > 0 && !seen.has(m) && m <= maxTotal) {
      seen.add(m);
      reached.push({ m, x: xFor(p.date.getTime()), y: yFor(p.total), dateStr: p.dateStr });
    }
  });
  reached.forEach(r => {
    svg.insertAdjacentHTML('beforeend',
      `<circle class="cum-marker" cx="${r.x}" cy="${r.y}" r="4" data-tip="${r.m}º treino · ${fmtDate(r.dateStr)}" />`);
  });

  // Projeção até o próximo marco
  const nextMilestone = stats.nextMilestoneTotal;
  const hasProjection = nextMilestone > lastCum.total && projMonthly > 0;
  const projLabel = fmtDateShort(new Date(projEtaMs));
  if (hasProjection) {
    const toX = xFor(projEtaMs);
    const milestoneY = yFor(nextMilestone);
    svg.insertAdjacentHTML('beforeend',
      `<line class="cum-projection" x1="${xFor(nowMs)}" y1="${yFor(lastCum.total)}" x2="${toX}" y2="${milestoneY}"
        stroke-dasharray="5 4" />`);
    svg.insertAdjacentHTML('beforeend',
      `<line class="cum-milestone-line" x1="${pad.left}" x2="${W - pad.right}" y1="${milestoneY}" y2="${milestoneY}"
        stroke-dasharray="3 3" />`);
    svg.insertAdjacentHTML('beforeend',
      `<text class="cum-milestone-label" x="${W - pad.right + 2}" y="${milestoneY + 3}" text-anchor="start">${nextMilestone}</text>`);
    svg.insertAdjacentHTML('beforeend',
      `<circle class="cum-proj-dot" cx="${toX}" cy="${milestoneY}" r="3.5"
        data-tip="Meta: treino #${nextMilestone} · ~${projLabel}" />`);
  }

  // Eixo X: início, marcos alcançados, hoje e projeção, sem sobrepor (> 50px de distância)
  const xLabels: { x: number; text: string; anchor: string }[] = [
    { x: pad.left, text: fmtDateShort(cum[0]!.dateStr), anchor: 'start' },
    ...reached.map(r => ({ x: r.x, text: fmtDateShort(r.dateStr), anchor: 'middle' })),
    { x: xFor(nowMs), text: 'hoje', anchor: 'middle' },
  ];
  if (hasProjection) xLabels.push({ x: xFor(projEtaMs), text: '~' + projLabel, anchor: 'end' });
  xLabels.sort((a, b) => a.x - b.x);
  const finalLabels: typeof xLabels = [];
  xLabels.forEach(lbl => {
    const prev = finalLabels[finalLabels.length - 1];
    if (!prev || Math.abs(lbl.x - prev.x) > 50) finalLabels.push(lbl);
  });
  finalLabels.forEach(lbl => {
    svg.insertAdjacentHTML('beforeend',
      `<text class="cum-axis" x="${lbl.x}" y="${H - 12}" text-anchor="${lbl.anchor}">${lbl.text}</text>`);
  });
}
