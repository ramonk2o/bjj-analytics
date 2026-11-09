import { describe, expect, it } from 'vitest';
import { addDays, toDateStr } from './dates';
import { computeStats } from './stats';
import { daily, options, trainings } from './test-helpers';

// Quarta-feira; a semana atual começa na segunda 2025-10-13.
const NOW = '2025-10-15T12:00';

const official = (list: ReturnType<typeof trainings>) => list.filter(t => t.official);

describe('current week', () => {
  const list = trainings('00-branca/2025-10-06.jpg', '00-branca/2025-10-08.jpg', '00-branca/2025-10-14.jpg');

  it('is left out by default', () => {
    const s = computeStats(list, list, options(NOW))!;
    expect(s.total).toBe(2);
    expect(s.last.dateStr).toBe('2025-10-08');
    expect(s.recentActivity.weeks.at(-1)!.start).toEqual(new Date('2025-10-06T00:00'));
  });

  it('is counted when the toggle is on', () => {
    const s = computeStats(list, list, options(NOW, { includeCurrentWeek: true }))!;
    expect(s.total).toBe(3);
    expect(s.recentActivity.weeks.at(-1)!.start).toEqual(new Date('2025-10-13T00:00'));
  });

  it('returns null when only the current week has trainings', () => {
    const only = trainings('00-branca/2025-10-14.jpg');
    expect(computeStats(only, only, options(NOW))).toBeNull();
  });
});

describe('weekly streaks', () => {
  const fourWeeks = trainings(
    '00-branca/2025-09-15.jpg', '00-branca/2025-09-17.jpg',
    '00-branca/2025-09-22.jpg', '00-branca/2025-09-24.jpg',
    '00-branca/2025-09-29.jpg', '00-branca/2025-10-01.jpg',
    '00-branca/2025-10-06.jpg', '00-branca/2025-10-08.jpg',
  );

  it('counts consecutive weeks reaching the minimum', () => {
    const s = computeStats(fourWeeks, fourWeeks, options(NOW))!;
    expect(s.longest).toBe(4);
    expect(toDateStr(s.longestStart!)).toBe('2025-09-15');
    expect(toDateStr(s.longestEnd!)).toBe('2025-10-12');
    expect(s.currentStreak).toBe(4);
    expect(s.weeksSinceLastTraining).toBe(0);
  });

  it('weeks below the minimum do not count', () => {
    const s = computeStats(fourWeeks, fourWeeks, options(NOW, { settings: { streakMin: 3 } }))!;
    expect(s.longest).toBe(0);
    expect(s.currentStreak).toBe(0);
    expect(s.streaks).toEqual([]);
  });

  it('a week below the minimum breaks the streak and becomes a gap', () => {
    const list = trainings(
      '00-branca/2025-09-01.jpg', '00-branca/2025-09-03.jpg',
      '00-branca/2025-09-09.jpg',
      '00-branca/2025-09-15.jpg', '00-branca/2025-09-17.jpg',
    );
    const s = computeStats(list, list, options(NOW))!;
    expect(s.streaks.map(x => x.length)).toEqual([1, 1]);
    expect(s.gaps).toHaveLength(1);
    expect(s.longestGap!.length).toBe(1);
    expect(toDateStr(s.longestGap!.voidStart)).toBe('2025-09-08');
    expect(toDateStr(s.longestGap!.voidEnd)).toBe('2025-09-14');
    // última semana treinada foi a de 15/09; a de referência é a de 06/10
    expect(s.weeksSinceLastTraining).toBe(3);
    expect(s.currentStreak).toBe(0);
  });

  it('stays active when the last qualifying week is the one before the reference week', () => {
    const list = trainings(
      '00-branca/2025-09-22.jpg', '00-branca/2025-09-24.jpg',
      '00-branca/2025-09-29.jpg', '00-branca/2025-10-01.jpg',
      '00-branca/2025-10-07.jpg',
    );
    const s = computeStats(list, list, options(NOW))!;
    expect(s.weeksSinceLastTraining).toBe(1);
    expect(s.streakIsActive).toBe(true);
    expect(s.currentStreak).toBe(2);
  });

  it('unofficial trainings count towards streaks of the official list', () => {
    const all = trainings(
      '00-branca/2025-09-29.jpg', '00-branca/2025-10-01_.jpg',
      '00-branca/2025-10-06.jpg', '00-branca/2025-10-08_.jpg',
    );
    expect(computeStats(official(all), all, options(NOW))!.longest).toBe(2);
    expect(computeStats(official(all), official(all), options(NOW))!.longest).toBe(0);
  });
});

describe('averages', () => {
  const recent = ['2025-09-15', '2025-09-17', '2025-09-22', '2025-09-24', '2025-09-29', '2025-10-01', '2025-10-06', '2025-10-08']
    .map(d => `00-branca/${d}.jpg`);
  const fourWeeks = trainings(...recent);

  it('weekly and monthly averages run up to the last complete week', () => {
    const s = computeStats(fourWeeks, fourWeeks, options(NOW, { settings: { weeklyAvgPeriod: 'all' } }))!;
    expect(s.total).toBe(8);
    expect(s.weeklyAvg).toBe('2.0');
    expect(s.monthlyAvg).toBe('8.0'); // menos de um mês conta como um mês
  });

  it('the configured period leaves older trainings out', () => {
    const list = trainings(...daily('2025-03-03', 10), ...recent);
    // 3 meses antes de 15/10 = 15/07 → 90 dias até domingo 12/10; só os 8 recentes contam
    const s = computeStats(list, list, options(NOW, { settings: { weeklyAvgPeriod: '3m' } }))!;
    expect(s.weeklyAvg).toBe('0.6');
  });

  it('a period starting before the first training counts from the first training', () => {
    // 3 meses antes de 15/10 é 15/07, antes do primeiro treino (15/09): 8 treinos em 4 semanas
    const s = computeStats(fourWeeks, fourWeeks, options(NOW, { settings: { weeklyAvgPeriod: '3m' } }))!;
    expect(s.weeklyAvg).toBe('2.0');
  });
});

describe('top cards', () => {
  const fourWeeks = trainings(...['09-15', '09-17', '09-22', '09-24', '09-29', '10-01', '10-06', '10-08'].map(d => `00-branca/2025-${d}.jpg`));

  it('estimates the next milestone by the weekly average of the period', () => {
    // 60 treinos antigos + 8 recentes: no período de 3 meses, 0,6/sem (no histórico todo seria 2,1/sem).
    // Faltam 32 para 100: 32 / 0,6 × 7 ≈ 373 dias depois de 15/10
    const list = trainings(...daily('2025-03-03', 60), ...fourWeeks.map(t => `00-branca/${t.dateStr}.jpg`));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.weeklyAvg).toBe('0.6');
    expect(s.nextMilestoneRemaining).toBe(32);
    expect(toDateStr(s.nextMilestoneEta!)).toBe('2026-10-23');
  });
});

describe('next milestone', () => {
  it('is the next multiple of 50', () => {
    const list = trainings(...daily('2025-08-01', 47));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.nextMilestoneTotal).toBe(50);
    expect(s.nextMilestoneRemaining).toBe(3);
  });

  it('reaching a multiple points to the following one', () => {
    const list = trainings(...daily('2025-08-01', 50));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.nextMilestoneTotal).toBe(100);
    expect(s.nextMilestoneRemaining).toBe(50);
  });
});

describe('activity trend', () => {
  it('goes up when recent weeks have more trainings', () => {
    const list = trainings('00-branca/2025-08-18.jpg', ...daily('2025-09-29', 14));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.recentActivity.weeks.map(w => w.count)).toEqual([1, 0, 0, 0, 0, 0, 7, 7]);
    expect(s.recentActivity.trendDir).toBe('up');
  });

  it('goes down when recent weeks have fewer trainings', () => {
    const list = trainings(...daily('2025-08-18', 14), '00-branca/2025-10-08.jpg');
    const s = computeStats(list, list, options(NOW))!;
    expect(s.recentActivity.trendDir).toBe('down');
    expect(s.recentActivity.peak12).toBe(7);
  });
});

describe('activity trend stays flat', () => {
  // 12 semanas, de 21/07 até a semana de referência (06/10)
  const weekStart = (i: number) => toDateStr(addDays(new Date('2025-07-21T00:00'), i * 7));

  it('when the change is under 1 training, even above 25% of the average', () => {
    // [1, 0 × 9, 1, 1]: variação ≈ 0,35, média 0,25
    const list = trainings(...[0, 10, 11].map(i => `00-branca/${weekStart(i)}.jpg`));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.recentActivity.weeks.map(w => w.count)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
    expect(s.recentActivity.trendDir).toBe('flat');
  });

  it('when the change is under 25% of the average, even above 1 training', () => {
    // [6 × 9, 7, 7, 7]: variação ≈ 1,04, média 6,25 (25% = 1,56)
    const list = trainings(...Array.from({ length: 9 }, (_, i) => daily(weekStart(i), 6)).flat(), ...daily(weekStart(9), 21));
    const s = computeStats(list, list, options(NOW))!;
    expect(s.recentActivity.weeks.map(w => w.count)).toEqual([6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7]);
    expect(s.recentActivity.trendDir).toBe('flat');
  });
});

describe('volume and frequency', () => {
  // seg 01/09, 08/09 e 15/09; ter a sex na semana de 06/10
  const list = trainings(...['09-01', '09-08', '09-15', '10-07', '10-08', '10-09', '10-10'].map(d => `00-branca/2025-${d}.jpg`));
  const s = computeStats(list, list, options(NOW))!;

  it('finds the strongest weekday', () => {
    expect(s.peakDow).toBe(1);
    expect(s.dowCounts[1]).toBe(3);
  });

  it('finds the most active month and week', () => {
    expect(s.mostActiveMonth).toEqual({ key: '2025-10', count: 4 });
    expect(s.mostActiveWeek).toMatchObject({ count: 4, start: new Date('2025-10-06T00:00') });
  });
});

describe('weekdays in the detailed analysis', () => {
  // oficiais: seg 29/09, qua 01/10, sáb 04/10, seg 06/10; não oficial: ter 30/09
  const all = trainings('00-branca/2025-09-29.jpg', '00-branca/2025-09-30_.jpg', '00-branca/2025-10-01.jpg',
    '00-branca/2025-10-04.jpg', '00-branca/2025-10-06.jpg');
  const s = computeStats(official(all), all, options(NOW))!;

  it('counts official trainings per weekday, with unofficial ones apart', () => {
    expect(s.dowCounts).toEqual([0, 2, 0, 1, 0, 0, 1]);
    expect(s.dowCountsUnof).toEqual([0, 0, 1, 0, 0, 0, 0]);
  });
});

describe('days', () => {
  it('tracks multi-training days and days since the last training', () => {
    const list = trainings('00-branca/2025-10-01-a.jpg', '00-branca/2025-10-01-b_.jpg', '00-branca/2025-10-08.jpg');
    const s = computeStats(list, list, options(NOW))!;
    expect(s.recordDayCount).toBe(2);
    expect(s.recordDayDate).toBe('2025-10-01');
    expect(Object.fromEntries(s.dayDistribution)).toEqual({ 1: 1, 2: 1 });
    expect(s.mixedDays).toBe(1);
    expect(s.daysSinceLast).toBe(7);
  });
});
