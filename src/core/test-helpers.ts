import { beltById } from './belts';
import { addDays, parseDateStr, toDateStr } from './dates';
import { dedupeTrainings, parseTrainingFile } from './filename';
import { defaultSettings, type Settings, type StatsOptions } from './settings';
import type { Training } from './types';

// Builds a Training from a path as it appears in the folder: '00-branca/2025-06-27-a_.jpg'.
export function training(path: string): Training {
  const [folder, filename] = path.split('/') as [string, string];
  const belt = beltById(folder);
  if (!belt) throw new Error(`unknown belt folder: ${folder}`);
  const t = parseTrainingFile(filename, belt);
  if (!t) throw new Error(`not a training file: ${filename}`);
  return t;
}

// Sorted and deduped, like a real scan.
export function trainings(...paths: string[]): Training[] {
  return dedupeTrainings(paths.map(training));
}

// `count` trainings on consecutive days starting at `start` (YYYY-MM-DD).
export function daily(start: string, count: number, folder = '00-branca', unofficial = false): string[] {
  const first = parseDateStr(start);
  return Array.from({ length: count }, (_, i) =>
    `${folder}/${toDateStr(addDays(first, i))}${unofficial ? '_' : ''}.jpg`);
}

export function options(now: string, overrides: { includeCurrentWeek?: boolean; settings?: Partial<Settings> } = {}): StatsOptions {
  return {
    includeCurrentWeek: overrides.includeCurrentWeek ?? false,
    now: new Date(now),
    settings: { ...defaultSettings(), ...overrides.settings },
  };
}
