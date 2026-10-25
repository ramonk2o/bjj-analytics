import { daysAgo } from '../core/dates';
import { fmtBeltTime, fmtDate, fmtDateShort } from '../core/format';
import { periodLabel } from '../core/settings';
import type { Stats } from '../core/stats';
import type { Training } from '../core/types';
import type { RenderContext } from '../state';
import { $, animateNumber, streakExtra } from './dom';

export function renderEmpty(): void {
  $('totalTrainings').textContent = '0';
  $('graduationContainer').innerHTML = '<div class="empty-state">Nenhum treino encontrado nas pastas das faixas.</div>';
  $('heatmap').innerHTML = '';
  $('dowGrid').innerHTML = '';
  $('dateRange').textContent = 'Sem treinos ainda';
}

export function renderHeader(stats: Stats): void {
  $('dateRange').textContent = `${fmtDate(stats.first.date)} → ${fmtDate(stats.last.date)}`;
}

// `list` = treinos oficiais efetivos, em ordem.
export function renderStats(stats: Stats, list: Training[], ctx: RenderContext): void {
  const { effective, now, includeCurrentWeek, settings } = ctx;

  // Faixa atual, numa pill no header
  const lastBelt = list[list.length - 1]!.belt;
  const beltStart = effective.find(t => t.belt.id === lastBelt.id && t.official);
  $('beltPill').style.display = 'inline-flex';
  $('beltPillSwatch').className = 'bp-swatch ' + lastBelt.class;
  $('beltPillName').textContent = lastBelt.name;
  $('beltPillTime').textContent = fmtBeltTime(beltStart ? daysAgo(beltStart.date, now) : 0);

  // Total
  animateNumber('totalTrainings', stats.total);
  const unof = effective.filter(t => !t.official).length;
  $('totalUnofficialInline').textContent = unof ? `+${unof}` : '';
  $('totalUnofficial').innerHTML = unof
    ? `<span class="unof-extra">+${unof} não oficial${unof === 1 ? '' : 's'}</span>`
    : '';

  // Próximo marco (múltiplo de 50)
  $('nextMilestoneRemaining').innerHTML = `${stats.nextMilestoneRemaining}<span class="unit">treino${stats.nextMilestoneRemaining === 1 ? '' : 's'}</span>`;
  let etaTxt = `para o treino #${stats.nextMilestoneTotal}`;
  if (stats.nextMilestoneEta) etaTxt += ` · ETA ${fmtDate(stats.nextMilestoneEta)}`;
  $('nextMilestoneExtra').textContent = etaTxt;

  // Streaks, em SEMANAS
  $('longestStreak').innerHTML = `${stats.longest}<span class="unit">sem</span>`;
  if (stats.longest > 1 && stats.longestStart && stats.longestEnd) {
    $('longestStreakDates').textContent = `${fmtDateShort(stats.longestStart)} → ${fmtDateShort(stats.longestEnd)}`;
  } else if (stats.longest === 1 && stats.longestStart) {
    $('longestStreakDates').textContent = `semana de ${fmtDateShort(stats.longestStart)}`;
  } else {
    $('longestStreakDates').textContent = '';
  }

  $('currentStreak').innerHTML = `${stats.currentStreak}<span class="unit">sem</span>`;
  $('currentStreakExtra').textContent = streakExtra(stats.weeksSinceLastTraining, stats.currentStreak, settings.streakMin,
    includeCurrentWeek ? ['ativo (esta semana)', 'ativo (semana passada)'] : ['ativo (semana passada)', 'ativo (há 2 semanas)']);

  // Média semanal
  $('weeklyAvg').textContent = stats.weeklyAvg;
  $('weeklyAvgExtra').textContent = `treinos/sem · ${periodLabel(settings.weeklyAvgPeriod)}`;

  // Último treino
  const last = list[list.length - 1]!;
  $('lastTraining').textContent = fmtDateShort(last.date);
  const ago = daysAgo(last.date, now);
  $('lastTrainingAgo').textContent = ago === 0 ? 'hoje' : ago === 1 ? 'ontem' : `há ${ago} dias`;
}
