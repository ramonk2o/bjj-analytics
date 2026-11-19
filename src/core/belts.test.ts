import { describe, expect, it } from 'vitest';
import { BELT_RULES_DEFAULTS } from './belts';
import { defaultSettings } from './settings';

describe('BELT_RULES_DEFAULTS', () => {
  it('has the default classes per grau of each belt', () => {
    expect(BELT_RULES_DEFAULTS).toEqual({ branca: 30, azul: 65, roxa: 75, marrom: 85, preta: 0 });
  });

  it('feeds the default settings', () => {
    expect(defaultSettings().beltRules).toEqual(BELT_RULES_DEFAULTS);
  });
});
