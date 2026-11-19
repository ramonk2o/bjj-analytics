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

describe('streak ladder', () => {
  it('uses the longest streak and has no estimated date', () => {
    // streak de 4 semanas (25/08 a 15/09), uma semana abaixo do mínimo, e o atual de 2 (29/09 e 06/10)
    const list = trainings(...['08-25', '08-27', '09-01', '09-03', '09-08', '09-10', '09-15', '09-17', '09-22', '09-29', '10-01', '10-06', '10-08']
      .map(d => `00-branca/2025-${d}.jpg`));
    const stats = computeStats(list, list, options(NOW))!;
    expect([stats.longest, stats.currentStreak]).toEqual([4, 2]);
    const badges = computeMilestones(stats, list, options(NOW)).find(g => g.title.startsWith('Streaks'))!.badges;
    expect(badges.slice(0, 3).map(b => [b.name, b.unlocked])).toEqual([['2 sem', true], ['4 sem', true], ['8 sem', false]]);
    expect(badges[2]).toMatchObject({ isNext: true, desc: '4 para chegar', eta: null });
  });
});

describe('same-day badges', () => {
  it('count official and unofficial trainings', () => {
    const list = trainings('00-branca/2025-10-01-a.jpg', '00-branca/2025-10-01-b.jpg', '00-branca/2025-10-01-c_.jpg');
    const stats = computeStats(list.filter(t => t.official), list, options(NOW))!;
    const limits = computeMilestones(stats, list, options(NOW)).find(g => g.title === 'Teste de limites')!.badges;
    const byName = Object.fromEntries(limits.map(b => [b.name, b]));
    expect(byName['2 no mesmo dia']).toMatchObject({ unlocked: true, desc: '1 vez' });
    expect(byName['3 no mesmo dia']).toMatchObject({ unlocked: true, desc: '1 vez' });
  });
});

describe('badge ladders', () => {
  // Uma lista pequena basta: os degraus não dependem dos treinos.
  const list = trainings('00-branca/2025-10-01.jpg', '00-branca/2025-10-02_.jpg');
  const stats = computeStats(list.filter(t => t.official), list, options(NOW))!;
  const groups = computeMilestones(stats, list, options(NOW));
  const badgeNames = (title: string) => groups.find(g => g.title === title)!.badges.map(b => b.name);

  it('official trainings: 10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000', () => {
    expect(badgeNames('Treinos')).toEqual([
      '10 treinos', '25 treinos', '50 treinos', '100 treinos', '200 treinos', '300 treinos', '500 treinos', '750 treinos',
      '1000 treinos', '1500 treinos', '2000 treinos', '3000 treinos', '5000 treinos', '7500 treinos', '10000 treinos',
    ]);
  });

  it('unofficial trainings: 10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500', () => {
    expect(badgeNames('Treinos não oficiais')).toEqual([
      '10 não oficiais', '25 não oficiais', '50 não oficiais', '100 não oficiais', '200 não oficiais',
      '300 não oficiais', '500 não oficiais', '750 não oficiais', '1000 não oficiais', '1500 não oficiais',
    ]);
  });

  it('longest streak: 2, 4, 8, 12, 16, 26, 52, 78, 104, 156 weeks', () => {
    expect(badgeNames('Streaks (semanas consecutivas)')).toEqual([
      '2 sem', '4 sem', '8 sem', '12 sem', '16 sem', '26 sem', '52 sem', '78 sem', '104 sem', '156 sem',
    ]);
  });
});

describe('chooseCols', () => {
  it('avoids a lone badge in the last row', () => {
    expect([15, 10, 6, 5, 7].map(chooseCols)).toEqual([5, 5, 3, 5, 7]);
  });
});
