import { describe, expect, it } from 'vitest';
import { daysAgo, isoWeekKey, toDateStr, weekStartOf } from './dates';

describe('weekStartOf', () => {
  it('weeks run Monday to Sunday', () => {
    expect(toDateStr(weekStartOf(new Date('2025-10-13T10:00')))).toBe('2025-10-13'); // Monday
    expect(toDateStr(weekStartOf(new Date('2025-10-15T23:00')))).toBe('2025-10-13'); // Wednesday
    expect(toDateStr(weekStartOf(new Date('2025-10-19T12:00')))).toBe('2025-10-13'); // Sunday
    expect(weekStartOf(new Date('2025-10-15T23:00')).getHours()).toBe(0);
  });
});

describe('isoWeekKey', () => {
  it('follows ISO week numbering across year boundaries', () => {
    expect(isoWeekKey(new Date('2025-10-15T00:00'))).toBe('2025-W42');
    expect(isoWeekKey(new Date('2024-12-30T00:00'))).toBe('2025-W01');
    expect(isoWeekKey(new Date('2027-01-01T00:00'))).toBe('2026-W53');
  });
});

describe('daysAgo', () => {
  it('counts whole days from today, ignoring the time of day', () => {
    const now = new Date('2025-10-15T21:00');
    expect(daysAgo('2025-10-15', now)).toBe(0);
    expect(daysAgo('2025-10-14', now)).toBe(1);
    expect(daysAgo(new Date('2025-10-01T00:00'), now)).toBe(14);
  });
});
