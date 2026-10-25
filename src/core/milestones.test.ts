import { describe, expect, it } from 'vitest';
import { chooseCols, computeMilestones, fullWeekStarts } from './milestones';
import { addDays } from './dates';
import { fmtMonthYear } from './format';
import { computeStats } from './stats';
import { daily, options, trainings } from './test-helpers';

const NOW = '2025-10-15T12:00';

describe('full weeks', () => {
  // Seg–Sex completas em 15/09 e 22/09; a de 06/10 falta a sexta.
  const list = trainings(...daily('2025-09-15', 5), ...daily('2025-09-22', 5), ...daily('2025-10-06', 4), '00-branca/2025-09-27.jpg');

  it('only weeks with every weekday trained count', () => {
    expect(fullWeekStarts(list)).toEqual([new Date('2025-09-15T00:00').getTime(), new Date('2025-09-22T00:00').getTime()]);
  });

  it('feed the "Teste de limites" badges', () => {
    const stats = computeStats(list, list, options(NOW))!;
    const limits = computeMilestones(stats, list, options(NOW)).find(g => g.title === 'Teste de limites')!.badges;
    const byName = Object.fromEntries(limits.map(b => [b.name, b]));
    expect(byName['Semana cheia']).toMatchObject({ unlocked: true, desc: '1 vez · todos os dias úteis de uma semana' });
    expect(byName['Quinzena cheia']).toMatchObject({ unlocked: true });
    expect(byName['Tríade cheia']).toMatchObject({ unlocked: false, isNext: true, desc: '2/3 · 3 semanas seguidas, dias úteis 100%' });
    expect(byName['2 no mesmo dia']).toMatchObject({ unlocked: false, desc: 'ainda não' });
  });
});

describe('training ladder', () => {
  it('marks the next target with what is missing', () => {
    const list = trainings(...daily('2025-08-01', 23));
    const stats = computeStats(list, list, options(NOW))!;
    const badges = computeMilestones(stats, list, options(NOW))[0]!.badges;
    expect(badges[0]).toMatchObject({ name: '10 treinos', unlocked: true, desc: 'desbloqueado' });
    expect(badges[1]).toMatchObject({ name: '25 treinos', isNext: true, desc: '2 para chegar' });
    expect(badges[1]!.eta).toMatch(/^~/);
    expect(badges[2]).toMatchObject({ desc: '23/50', isNext: false, eta: null });
  });
});

describe('unofficial ladder', () => {
  it('estimates by the unofficial weekly average of the period', () => {
    // 8 não oficiais nas últimas 4 semanas (2/sem); um oficial antigo não dilui o ritmo
    const list = trainings('00-branca/2025-01-06.jpg',
      ...['09-15', '09-17', '09-22', '09-24', '09-29', '10-01', '10-06', '10-08'].map(d => `00-branca/2025-${d}_.jpg`));
    const stats = computeStats(list.filter(t => t.official), list, options(NOW))!;
    const badges = computeMilestones(stats, list, options(NOW))[1]!.badges;
    // faltam 2 para 10, a 2/sem: 1 semana
    expect(badges[0]).toMatchObject({ name: '10 não oficiais', isNext: true, eta: `~${fmtMonthYear(addDays(new Date(NOW), 7))}` });
  });
});

describe('chooseCols', () => {
  it('avoids a lone badge in the last row', () => {
    expect([15, 10, 6, 5, 7].map(chooseCols)).toEqual([5, 5, 3, 5, 7]);
  });
});
