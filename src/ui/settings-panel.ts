import { settingsFromForm } from '../core/settings';
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
    const next = settingsFromForm({
      branca: input('cfgBranca').value,
      azul: input('cfgAzul').value,
      roxa: input('cfgRoxa').value,
      marrom: input('cfgMarrom').value,
      streakMin: input('cfgStreakMin').value,
      grauOverride: input('cfgGrauOverride').value,
      weeklyAvgPeriod: input('cfgAvgPeriod').value,
    }, state.settings);
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
