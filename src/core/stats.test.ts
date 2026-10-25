import { describe, expect, it } from 'vitest';
import { toDateStr } from './dates';
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
