import { describe, expect, it } from 'vitest';
import { addDays, toDateStr } from './dates';
import { fmtMonthYear } from './format';
import { computeBeltTrajectory, computeGraduation } from './graduation';
import { defaultSettings } from './settings';
import { daily, trainings } from './test-helpers';

const NOW = new Date('2025-10-15T12:00');
const settings = defaultSettings(); // branca: 30 aulas por grau

describe('computeGraduation', () => {
  it('derives the grau from the classes at the current belt', () => {
    const g = computeGraduation(trainings(...daily('2025-01-01', 65)), 5, settings, NOW)!;
    expect(g.belt.class).toBe('branca');
    expect(g.aulasNaFaixa).toBe(65);
    expect(g.progress).toMatchObject({
      currentGrau: 2, isPromotion: false, nextThreshold: 90, aulasParaProximo: 25, segSpan: 30, segDone: 5,
    });
    expect(g.progress!.nextBelt!.name).toBe('Azul');
  });

  it('estimates by the weekly average and by the pace at the belt', () => {
    const p = computeGraduation(trainings(...daily('2025-01-01', 65)), 5, settings, NOW)!.progress!;
    expect(p.etaWeeks).toBe(5);
    expect(toDateStr(p.etaDate!)).toBe('2025-11-19');
    // 65 aulas em 288 dias ≈ 1,58/sem → 25 aulas em 16 semanas
    expect(p.beltAulasPerWeek).toBeCloseTo(65 / (288 / 7));
    expect(p.etaBeltWeeks).toBe(16);
  });

  it('the grau override replaces the computed grau', () => {
    const g = computeGraduation(trainings(...daily('2025-01-01', 65)), 5, { ...settings, grauOverride: '3' }, NOW)!;
    expect(g.progress).toMatchObject({ currentGrau: 3, nextThreshold: 120, aulasParaProximo: 55 });
  });

  it('after 4 graus the next step is the belt, at 5× the classes per grau', () => {
    const p = computeGraduation(trainings(...daily('2025-01-01', 150)), 5, settings, NOW)!.progress!;
    expect(p).toMatchObject({ currentGrau: 4, isPromotion: true, nextThreshold: 150, aulasParaProximo: 0 });
    expect(p.etaDate).toBeNull();
  });

  it('the current belt is the one of the latest official training', () => {
    const g = computeGraduation(trainings(...daily('2025-01-01', 10), '01-azul/2025-02-01.jpg', '00-branca/2025-03-01_.jpg'), 5, settings, NOW)!;
    expect(g.belt.class).toBe('azul');
    expect(g.aulasNaFaixa).toBe(1);
  });

  it('black belt has no grau progress', () => {
    const g = computeGraduation(trainings('04-preta/2025-10-01.jpg'), 5, settings, NOW)!;
    expect(g.progress).toBeNull();
  });

  it('nothing to show without official trainings', () => {
    expect(computeGraduation(trainings('00-branca/2025-10-01_.jpg'), 5, settings, NOW)).toBeNull();
  });
});

describe('computeBeltTrajectory', () => {
  const list = trainings(...daily('2024-01-01', 150), ...daily('2024-06-01', 10, '01-azul'));
  // ritmo = média semanal do período (oficiais), a mesma das outras ETAs
  const cards = computeBeltTrajectory(list, '01-azul', 5, settings, NOW);
  const labels = (i: number) => cards[i]!.info.map(b => b.label);

  it('counts official classes per belt', () => {
    expect(cards.map(c => c.n)).toEqual([150, 10, 0, 0, 0]);
    expect(cards.map(c => c.isCurrent)).toEqual([false, true, false, false, false]);
  });

  it('shows time spent at past belts and at the current one', () => {
    expect(labels(0)).toEqual(['Na faixa', 'Chegada']); // primeira faixa não tem "jiu-jitsu total"
    expect(cards[0]!.info[0]!.value).toBe('4m');
    expect(labels(1)).toEqual(['Na faixa', 'Chegada', 'Jiu-jitsu total']);
  });

  it('projects future belts from the weekly average of the period', () => {
    expect(labels(2)).toEqual(['Na faixa (est.)', 'Chegada estimada', 'Jiu-jitsu total (est.)']);
    // roxa pede 375 aulas: a 5/sem, 75 semanas = 525 dias
    expect(cards[2]!.info[0]!.value).toBe('~1a 5m');
    // faltam 315 aulas na azul: 63 semanas até chegar na roxa
    expect(cards[2]!.info[1]!.value).toBe(fmtMonthYear(addDays(NOW, 63 * 7)));
    expect(cards[4]!.info[0]).toEqual({ label: 'Na faixa', value: 'o caminho de uma vida' });
  });

  it('without a weekly average there is no projection', () => {
    const none = computeBeltTrajectory(list, '01-azul', 0, settings, NOW);
    expect(none[2]!.info).toEqual([{ label: '', value: '—' }]);
  });
});
