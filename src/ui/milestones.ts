import { chooseCols, computeMilestones } from '../core/milestones';
import type { Stats } from '../core/stats';
import type { RenderContext } from '../state';
import { $ } from './dom';

export function renderMilestones(stats: Stats, ctx: RenderContext): void {
  const grid = $('badgeGrid');
  grid.innerHTML = '';
  computeMilestones(stats, ctx.effective, ctx).forEach(group => {
    const wrap = document.createElement('div');
    wrap.className = 'badge-subsection';
    wrap.innerHTML = `<h3 class="badge-subsection-title">${group.title}</h3>`;
    const subGrid = document.createElement('div');
    subGrid.className = 'badge-subsection-grid';
    const cols = chooseCols(group.badges.length);
    subGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    subGrid.dataset.cols = String(cols);
    group.badges.forEach(m => {
      const card = document.createElement('div');
      card.className = 'milestone ' + (m.unlocked ? 'unlocked' : 'locked') + (m.isNext && !m.unlocked ? ' next' : '');
      const progressHtml = !m.unlocked && m.progress > 0
        ? `<div class="ms-progress"><div class="ms-progress-fill" style="width:${Math.min(100, Math.round(m.progress * 100))}%"></div></div>`
        : '';
      const etaHtml = m.eta
        ? `<div class="ms-eta">${m.eta}</div>`
        : (m.unlocked ? `<div class="ms-eta">✓ desbloqueado</div>` : '');
      card.innerHTML = `
        <span class="ms-icon">${m.icon}</span>
        <div class="ms-name">${m.name}</div>
        <div class="ms-desc">${m.desc || ''}</div>
        ${progressHtml}
        ${etaHtml}
      `;
      subGrid.appendChild(card);
    });
    wrap.appendChild(subGrid);
    grid.appendChild(wrap);
  });
}
