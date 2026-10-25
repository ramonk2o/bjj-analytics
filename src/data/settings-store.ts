import { defaultSettings, type Settings } from '../core/settings';

// localStorage keys are kept from the single-file version so saved preferences survive.
const SETTINGS_KEY = 'jja-settings';
const INCLUDE_CURRENT_WEEK_KEY = 'includeCurrentWeek';
const COLLAPSED_PREFIX = 'collapsed:';

export function loadSettings(): Settings {
  const s = defaultSettings();
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return s;
    const cfg = JSON.parse(saved) as Partial<Settings>;
    if (cfg.beltRules) {
      for (const k of Object.keys(cfg.beltRules) as (keyof Settings['beltRules'])[]) {
        if (k in s.beltRules) s.beltRules[k] = cfg.beltRules[k];
      }
    }
    if (cfg.streakMin) s.streakMin = cfg.streakMin;
    if (cfg.grauOverride !== undefined) s.grauOverride = cfg.grauOverride;
    if (cfg.weeklyAvgPeriod) s.weeklyAvgPeriod = cfg.weeklyAvgPeriod;
  } catch {}
  return s;
}

export function saveSettings(s: Settings): void {
  try {
    const { branca, azul, roxa, marrom } = s.beltRules;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      beltRules: { branca, azul, roxa, marrom },
      streakMin: s.streakMin,
      grauOverride: s.grauOverride,
      weeklyAvgPeriod: s.weeklyAvgPeriod,
    }));
  } catch {}
}

export function loadIncludeCurrentWeek(): boolean {
  try { return localStorage.getItem(INCLUDE_CURRENT_WEEK_KEY) === '1'; } catch { return false; }
}

export function saveIncludeCurrentWeek(on: boolean): void {
  try { localStorage.setItem(INCLUDE_CURRENT_WEEK_KEY, on ? '1' : '0'); } catch {}
}

export function loadCollapsed(sectionId: string): boolean {
  try { return localStorage.getItem(COLLAPSED_PREFIX + sectionId) === '1'; } catch { return false; }
}

export function saveCollapsed(sectionId: string, collapsed: boolean): void {
  try { localStorage.setItem(COLLAPSED_PREFIX + sectionId, collapsed ? '1' : '0'); } catch {}
}
