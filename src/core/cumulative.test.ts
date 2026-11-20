import { describe, expect, it } from 'vitest';
import { DAY_MS } from './dates';
import { cumulativeMarkers, cumulativeMarkerStep, cumulativeProjection } from './cumulative';
import type { CumulativePoint } from './stats';
import { daily, trainings } from './test-helpers';

const NOW = new Date('2025-10-15T12:00');

function series(count: number): CumulativePoint[] {
  return trainings(...daily('2024-01-01', count)).map((t, i) => ({ dateStr: t.dateStr, date: t.date, total: i + 1 }));
}

describe('cumulativeMarkerStep', () => {
  it('marks every 25 trainings below 100', () => {
    expect(cumulativeMarkerStep(1)).toBe(25);
    expect(cumulativeMarkerStep(99)).toBe(25);
  });

  it('marks every 50 from 100 up to 199', () => {
    expect(cumulativeMarkerStep(100)).toBe(50);
    expect(cumulativeMarkerStep(199)).toBe(50);
  });

  it('marks every 100 from 200', () => {
    expect(cumulativeMarkerStep(200)).toBe(100);
    expect(cumulativeMarkerStep(350)).toBe(100);
  });
});

describe('cumulativeMarkers', () => {
  const totals = (cum: CumulativePoint[]) => cumulativeMarkers(cum).map(m => m.milestone);

  it('places a marker at each multiple of the step reached, on the training that reached it', () => {
    const cum = series(80);
    expect(totals(cum)).toEqual([25, 50, 75]);
    expect(cumulativeMarkers(cum)[1]!.point).toBe(cum[49]);
  });

  it('uses the step of the final total', () => {
    expect(totals(series(100))).toEqual([50, 100]);
    expect(totals(series(210))).toEqual([100, 200]);
  });

  it('has no markers before the first step', () => {
    expect(totals(series(24))).toEqual([]);
    expect(totals([])).toEqual([]);
  });
});

describe('cumulativeProjection', () => {
  it('projects to the next multiple of 50 at the monthly average', () => {
    // 120 → faltam 30 para 150; a 10/mês são 3 meses de 30,4375 dias
    expect(cumulativeProjection(120, 10, NOW)).toEqual({
      milestone: 150,
      remaining: 30,
      etaMs: NOW.getTime() + 3 * 30.4375 * DAY_MS,
    });
  });

  it('the next multiple is strictly above the total, even exactly on one', () => {
    expect(cumulativeProjection(50, 5, NOW)).toMatchObject({ milestone: 100, remaining: 50 });
    expect(cumulativeProjection(99, 5, NOW)).toMatchObject({ milestone: 100, remaining: 1 });
    expect(cumulativeProjection(199, 5, NOW)).toMatchObject({ milestone: 200, remaining: 1 });
    expect(cumulativeProjection(200, 5, NOW)).toMatchObject({ milestone: 250, remaining: 50 });
  });

  it('has no ETA without a monthly average', () => {
    expect(cumulativeProjection(120, 0, NOW)).toEqual({ milestone: 150, remaining: 30, etaMs: null });
  });
});
