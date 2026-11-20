import { describe, expect, it } from 'vitest';
import { fmtLastTrainingAgo, snapshotFilename, streakExtra, unofficialTotal } from './format';
import { daily, trainings } from './test-helpers';

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

describe('fmtLastTrainingAgo', () => {
  const now = new Date('2025-10-15T21:00');

  it('says hoje, ontem or há N dias, counting whole days regardless of the time of day', () => {
    expect(fmtLastTrainingAgo(new Date('2025-10-15T00:00'), now)).toBe('hoje');
    expect(fmtLastTrainingAgo(new Date('2025-10-14T00:00'), now)).toBe('ontem');
    expect(fmtLastTrainingAgo(new Date('2025-10-10T00:00'), now)).toBe('há 5 dias');
  });

  it('still says hoje late at night and ontem right after midnight', () => {
    expect(fmtLastTrainingAgo(new Date('2025-10-15T00:00'), new Date('2025-10-15T23:59'))).toBe('hoje');
    expect(fmtLastTrainingAgo(new Date('2025-10-14T00:00'), new Date('2025-10-15T00:01'))).toBe('ontem');
  });
});

describe('snapshotFilename', () => {
  it('names the file after the local day', () => {
    expect(snapshotFilename(new Date('2025-10-15T10:00'))).toBe('jiu-jitsu-report-2025-10-15.html');
  });

  it('uses the local day at night, when UTC is already the next day', () => {
    const night = new Date('2025-10-15T22:30-03:00'); // 2025-10-16T01:30Z
    expect(night.toISOString().slice(0, 10)).toBe('2025-10-16');
    expect(snapshotFilename(night)).toBe('jiu-jitsu-report-2025-10-15.html');
  });
});

describe('unofficialTotal', () => {
  it('shows nothing when every training is official', () => {
    expect(unofficialTotal(trainings(...daily('2025-01-01', 3)))).toEqual({ count: 0, inline: '', label: '' });
  });

  it('shows the unofficial trainings apart, as +N', () => {
    const list = trainings(...daily('2025-01-01', 4), ...daily('2025-02-01', 1, '00-branca', true));
    expect(unofficialTotal(list)).toEqual({ count: 1, inline: '+1', label: '+1 não oficial' });
  });

  // The plural "oficials" is a typo the UI already had; kept because issue #5 doesn't change visible text.
  it('pluralizes the label from two on', () => {
    const list = trainings(...daily('2025-01-01', 4), ...daily('2025-02-01', 3, '00-branca', true));
    expect(unofficialTotal(list)).toEqual({ count: 3, inline: '+3', label: '+3 não oficials' });
  });
});
