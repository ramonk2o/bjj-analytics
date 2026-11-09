import { describe, expect, it } from 'vitest';
import { defaultSettings, settingsFromForm, type SettingsForm } from './settings';

const form = (over: Partial<SettingsForm> = {}): SettingsForm => ({
  branca: '40', azul: '70', roxa: '80', marrom: '90',
  streakMin: '3', grauOverride: '2', weeklyAvgPeriod: '6m',
  ...over,
});

describe('settingsFromForm', () => {
  it('keeps the values typed', () => {
    expect(settingsFromForm(form(), defaultSettings())).toEqual({
      beltRules: { branca: 40, azul: 70, roxa: 80, marrom: 90, preta: 0 },
      streakMin: 3, grauOverride: '2', weeklyAvgPeriod: '6m',
    });
  });

  it('keeps the belt rules the form does not show', () => {
    const previous = defaultSettings();
    previous.beltRules.preta = 12;
    expect(settingsFromForm(form(), previous).beltRules.preta).toBe(12);
  });

  it('classes per grau empty or 0 go back to the default', () => {
    const s = settingsFromForm(form({ branca: '', azul: '0', roxa: '', marrom: '0' }), defaultSettings());
    expect(s.beltRules).toMatchObject({ branca: 30, azul: 65, roxa: 75, marrom: 85 });
  });

  it('the weekly minimum stays between 1 and 7', () => {
    const min = (v: string) => settingsFromForm(form({ streakMin: v }), defaultSettings()).streakMin;
    expect(min('-3')).toBe(1);
    expect(min('12')).toBe(7);
    expect(min('')).toBe(2);
  });

  it('an unknown period goes back to 3 months', () => {
    expect(settingsFromForm(form({ weeklyAvgPeriod: '24m' }), defaultSettings()).weeklyAvgPeriod).toBe('3m');
  });
});
