import { fmtDate, fmtSpan } from '../core/format';
import { computeBeltTrajectory, computeGraduation } from '../core/graduation';
import { periodShort } from '../core/settings';
import type { Stats } from '../core/stats';
import type { RenderContext } from '../state';
import { $ } from './dom';

function fmtEta(d: Date | null): string {
  return d ? fmtDate(d) : '—';
}

function fmtDur(weeks: number | null): string {
  if (!weeks) return '—';
  if (weeks < 8) return `~${weeks} sem`;
  const months = weeks / 4.345;
  if (months < 12) return `~${months.toFixed(1)} meses`;
  return `~${(months / 12).toFixed(1)} anos`;
}

function beltTrajectoryHtml(currentBeltId: string, ctx: RenderContext): string {
  const cards = computeBeltTrajectory(ctx.effective, currentBeltId, ctx.settings, ctx.now).map(({ belt, n, isCurrent, info }) => {
    const cls = `gbc${n === 0 ? ' empty' : ''}${isCurrent ? ' current' : ''}`;
    const infoHtml = info.map(b => {
      const labelHtml = b.label ? `<div class="gbc-info-label">${b.label}</div>` : '';
      return `${labelHtml}<div class="gbc-extra">${b.value}</div>`;
    }).join('');
    return `
      <div class="${cls}">
        <div class="gbc-row">
          <span class="gbc-swatch ${belt.class}"></span>
          <span class="gbc-name">${belt.name}</span>
        </div>
        <div class="gbc-count">${n}</div>
        ${infoHtml}
      </div>
    `;
  }).join('');
  return `<div class="grad-belts">${cards}</div>`;
}

export function renderGraduation(stats: Stats, ctx: RenderContext): void {
  const container = $('graduationContainer');
  $('graduationTitle').textContent = 'Evolução';
  const g = computeGraduation(ctx.effective, parseFloat(stats.weeklyAvg) || 0, ctx.settings, ctx.now);
  if (!g) { container.innerHTML = ''; return; }
  const { belt, aulasPerGrau, aulasNaFaixa, progress: p } = g;

  const timeInfoHtml = `<span class="gs-sep">·</span>
        <span class="gs-label">na faixa</span> <strong>${fmtSpan(g.daysAtBelt)}</strong>
        <span class="gs-sep">·</span>
        <span class="gs-label">jiu-jitsu total</span> <strong>${fmtSpan(g.totalJJDays)}</strong>`;

  // Faixa preta: graduação por tempo de faixa, não por aulas
  if (!p) {
    container.innerHTML = `
      <div class="grad-header">
        <div class="grad-belt">
          <span class="gb-swatch ${belt.class}"></span>
          <span>${belt.name}</span>
        </div>
        <div class="grad-status">${aulasNaFaixa} aula${aulasNaFaixa === 1 ? '' : 's'} na faixa ${timeInfoHtml}</div>
      </div>
      <div style="font-size:0.78rem;color:var(--text-dim)">
        Graduação na preta segue lógica diferente (tempo de faixa, não aulas). Aproveita 🥋
      </div>
      ${beltTrajectoryHtml(belt.id, ctx)}
    `;
    return;
  }

  const { currentGrau, isPromotion, nextBelt, aulasParaProximo } = p;
  const tipo = isPromotion ? `subir pra ${nextBelt ? nextBelt.name : 'próxima faixa'}` : `${currentGrau + 1}º grau`;
  const targetLabel = isPromotion ? (nextBelt ? `Faixa ${nextBelt.name}` : 'Próxima faixa') : `${currentGrau + 1}º grau`;

  // Rótulos da barra: 4 graus + faixa
  const labelsHtml = [0, 1, 2, 3, 4].map(i => {
    const label = i === 4 ? (nextBelt ? nextBelt.name : 'faixa') : `${i + 1}º`;
    const cls = i === currentGrau ? 'current' : (i === 4 && isPromotion ? 'next-promo' : '');
    return `<div class="gbl ${cls}">${label}</div>`;
  }).join('');

  // Pips dos graus já obtidos
  const pipsHtml = [0, 1, 2, 3].map(i => `<span class="gb-grau-pip${i < currentGrau ? ' on' : ''}"></span>`).join('');

  const ready = aulasParaProximo === 0;
  container.innerHTML = `
    <div class="grad-header">
      <div class="grad-belt">
        <span class="gb-swatch ${belt.class}"></span>
        <span>${belt.name}</span>
        <span class="gb-graus">${pipsHtml}</span>
        <span style="font-size:0.78rem;color:var(--text-dim);font-weight:500">
          ${currentGrau === 0 ? 'sem graus ainda' : `${currentGrau} grau${currentGrau === 1 ? '' : 's'}`}
        </span>
      </div>
      <div class="grad-status">
        <span class="gs-label">aulas na faixa</span> <strong>${aulasNaFaixa}</strong>
        / <strong>${5 * aulasPerGrau}</strong>
        ${timeInfoHtml}
      </div>
    </div>

    <div class="grad-bar-wrap">
      <div class="grad-bar">
        <div class="grad-bar-fill" style="width:${p.totalPct}%"></div>
        <div class="grad-bar-ticks">
          <div class="grad-bar-tick"></div>
          <div class="grad-bar-tick"></div>
          <div class="grad-bar-tick"></div>
          <div class="grad-bar-tick"></div>
          <div class="grad-bar-tick"></div>
        </div>
      </div>
      <div class="grad-bar-labels">${labelsHtml}</div>
    </div>

    <div class="grad-foot">
      <div class="gf-item">
        <span class="gf-label">Próxima graduação</span>
        <span class="gf-value accent">${targetLabel}</span>
        <span class="gf-extra">${ready ? '✓ pronto, esperando promoção' : `faltam ${aulasParaProximo} aula${aulasParaProximo === 1 ? '' : 's'}`}</span>
      </div>
      <div class="gf-item">
        <span class="gf-label">ETA · média (${periodShort(ctx.settings.weeklyAvgPeriod)})</span>
        <span class="gf-value">${ready ? 'Ultrapassado' : fmtEta(p.etaDate)}</span>
        <span class="gf-extra">${ready ? `superou em ${aulasNaFaixa - p.nextThreshold} aulas` : `${fmtDur(p.etaWeeks)} a ${p.weeklyAvg.toFixed(1)} aulas/sem`}</span>
      </div>
      <div class="gf-item">
        <span class="gf-label">ETA · ritmo na faixa</span>
        <span class="gf-value">${ready ? 'Ultrapassado' : fmtEta(p.etaBeltDate)}</span>
        <span class="gf-extra">${ready ? `${p.beltAulasPerWeek.toFixed(1)} aulas/sem` : `${fmtDur(p.etaBeltWeeks)} a ${p.beltAulasPerWeek.toFixed(1)} aulas/sem`}</span>
      </div>
      <div class="gf-item">
        <span class="gf-label">Progresso ${tipo}</span>
        <span class="gf-value">${Math.min(p.segDone, p.segSpan)}/${p.segSpan}</span>
        <span class="gf-extra">${Math.min(100, p.segPct).toFixed(0)}% do segmento</span>
      </div>
    </div>

    ${beltTrajectoryHtml(belt.id, ctx)}
  `;
}
