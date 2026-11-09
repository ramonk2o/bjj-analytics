import { describe, expect, it } from 'vitest';
import { streakExtra } from './format';

describe('streakExtra', () => {
  const labels: [string, string] = ['ativo (semana passada)', 'ativo (há 2 semanas)'];

  it('without an active streak, says for how many weeks the minimum was not reached', () => {
    expect(streakExtra(3, 0, 2, labels)).toBe('3 sem sem 2+ treinos');
  });

  it('with an active streak, tells whether it ended in the reference week or the one before', () => {
    expect(streakExtra(0, 4, 2, labels)).toBe('ativo (semana passada)');
    expect(streakExtra(1, 4, 2, labels)).toBe('ativo (há 2 semanas)');
  });
});
