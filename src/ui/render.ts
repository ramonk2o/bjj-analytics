import { computeStats, type Stats } from '../core/stats';
import { renderContext, state, type RenderContext } from '../state';
import { renderRecentActivity } from './activity';
import { renderConsistency, renderTimelineSG } from './consistency';
import { renderCumulativeChart } from './cumulative';
import { renderGraduation } from './graduation';
import { renderHeatmap } from './heatmap';
import { renderMilestones } from './milestones';
import { renderMultiDays } from './multi-days';
import { renderEmpty, renderHeader, renderStats } from './overview';
import { renderVolumeMetrics } from './volume';
import { renderDow, renderDowHeatmap } from './weekdays';

export function render(): void {
  const ctx = renderContext();
  const list = ctx.effective.filter(t => t.official);
  // Stats principais: oficiais medidos, com todos os treinos pra streaks
  const stats = computeStats(list, ctx.effective, ctx);
  if (!stats) {
    renderEmpty();
    return;
  }
  renderHeader(stats);
  renderStats(stats, list, ctx);
  renderGraduation(stats, ctx);
  renderTreinos(stats, ctx);
  renderConsistency(stats, ctx);
  renderTimelineSG(stats);
  renderMultiDays(stats);
  renderDowHeatmap(stats);
  renderDow(stats);
  renderMilestones(stats, ctx);
}

// Seção "Treinos": segue o filtro Todos / Oficiais / Não oficiais.
export function renderTreinos(fallback: Stats | null = null, ctx: RenderContext = renderContext()): void {
  const filtered = state.treinosFilter === 'official' ? ctx.effective.filter(t => t.official)
    : state.treinosFilter === 'unofficial' ? ctx.effective.filter(t => !t.official)
    : ctx.effective;
  const stats = computeStats(filtered, filtered, ctx)
    ?? fallback
    ?? computeStats(ctx.effective.filter(t => t.official), ctx.effective, ctx);
  if (!stats) return;
  renderCumulativeChart(stats, ctx);
  renderRecentActivity(stats, ctx);
  renderVolumeMetrics(stats);
  renderHeatmap(filtered, stats, ctx);
}
