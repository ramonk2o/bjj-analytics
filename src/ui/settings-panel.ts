import { BELT_RULES_DEFAULTS } from '../core/belts';
import { AVG_PERIODS, type AvgPeriod, type GrauOverride, type Settings } from '../core/settings';
import { saveSettings } from '../data/settings-store';
import { state } from '../state';
import { $, showToast } from './dom';

const input = (id: string) => $<HTMLInputElement | HTMLSelectElement>(id);

export function setupSettingsPanel(onChange: () => void): void {
  const overlay = $('settingsOverlay');

  function open() {
    const s = state.settings;
    input('cfgBranca').value = String(s.beltRules.branca);
    input('cfgAzul').value = String(s.beltRules.azul);
    input('cfgRoxa').value = String(s.beltRules.roxa);
    input('cfgMarrom').value = String(s.beltRules.marrom);
    input('cfgStreakMin').value = String(s.streakMin);
    input('cfgGrauOverride').value = s.grauOverride;
    input('cfgAvgPeriod').value = s.weeklyAvgPeriod;
    overlay.classList.add('open');
  }

  function close() {
    overlay.classList.remove('open');
  }

  function save() {
    const aulas = (id: string, fallback: number) => parseInt(input(id).value) || fallback;
    const period = input('cfgAvgPeriod').value as AvgPeriod;
    const next: Settings = {
      beltRules: {
        ...state.settings.beltRules,
        branca: aulas('cfgBranca', BELT_RULES_DEFAULTS.branca),
        azul: aulas('cfgAzul', BELT_RULES_DEFAULTS.azul),
        roxa: aulas('cfgRoxa', BELT_RULES_DEFAULTS.roxa),
        marrom: aulas('cfgMarrom', BELT_RULES_DEFAULTS.marrom),
      },
      streakMin: Math.max(1, Math.min(7, parseInt(input('cfgStreakMin').value) || 2)),
      grauOverride: input('cfgGrauOverride').value as GrauOverride,
      weeklyAvgPeriod: AVG_PERIODS.includes(period) ? period : '3m',
    };
    state.settings = next;
    saveSettings(next);
    close();
    onChange();
    showToast('Configurações salvas');
  }

  $('settingsBtn').addEventListener('click', open);
  $('settingsCancel').addEventListener('click', close);
  $('settingsSave').addEventListener('click', save);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
}
