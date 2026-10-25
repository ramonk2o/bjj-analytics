import './styles/index.css';
import { ensurePermission, loadHandle, saveHandle } from './data/handle-store';
import { scanFolder } from './data/scan';
import { saveIncludeCurrentWeek } from './data/settings-store';
import { state, type TreinosFilter } from './state';
import { setupCollapsibles } from './ui/collapsible';
import { $, showToast } from './ui/dom';
import { exportSnapshot } from './ui/export-snapshot';
import { clearPhotoUrls } from './ui/photos';
import { render, renderTreinos } from './ui/render';
import { setupSettingsPanel } from './ui/settings-panel';
import { setupTooltipAndLightbox } from './ui/tooltip';

async function scan(): Promise<void> {
  if (!state.dirHandle) return;
  clearPhotoUrls();
  state.trainings = await scanFolder(state.dirHandle);
  render();
  $('lastUpdate').textContent = `Atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

async function activate(): Promise<void> {
  if (!state.dirHandle || !await ensurePermission(state.dirHandle)) {
    showToast('Permissão necessária para ler a pasta');
    return;
  }
  $('setup').style.display = 'none';
  $('main').style.display = 'block';
  $('controls').style.display = 'flex';
  $('exportBtn').style.display = '';
  await scan();
}

async function pickFolder(): Promise<void> {
  if (!window.showDirectoryPicker) {
    alert('Seu navegador não suporta acesso a pastas. Use o Chrome, Edge ou Brave.');
    return;
  }
  try {
    const h = await window.showDirectoryPicker({ id: 'jiu-jitsu', mode: 'read' });
    state.dirHandle = h;
    await saveHandle(h);
    await activate();
  } catch (e) {
    if ((e as Error).name !== 'AbortError') console.error(e);
  }
}

$('setupBtn').addEventListener('click', async () => {
  if (state.dirHandle && await ensurePermission(state.dirHandle)) {
    await activate();
    return;
  }
  await pickFolder();
});

$('refreshBtn').addEventListener('click', () => {
  scan();
  showToast('Atualizado');
});

$('exportBtn').addEventListener('click', exportSnapshot);

const cwToggle = $<HTMLInputElement>('includeCurrentWeekToggle');
cwToggle.checked = state.includeCurrentWeek;
cwToggle.addEventListener('change', () => {
  state.includeCurrentWeek = cwToggle.checked;
  saveIncludeCurrentWeek(state.includeCurrentWeek);
  if (state.trainings.length) render();
});

// Filtro da seção Treinos
document.addEventListener('click', ev => {
  const pill = (ev.target as Element).closest<HTMLElement>('.hf-pill[data-tfilter]');
  if (!pill) return;
  ev.stopPropagation();
  const mode = pill.dataset.tfilter as TreinosFilter;
  if (mode === state.treinosFilter) return;
  state.treinosFilter = mode;
  document.querySelectorAll<HTMLElement>('.hf-pill[data-tfilter]').forEach(p => p.classList.toggle('active', p.dataset.tfilter === mode));
  if (state.trainings.length) renderTreinos();
});

setupSettingsPanel(() => { if (state.trainings.length) render(); });
setupCollapsibles();
setupTooltipAndLightbox();

// Reabre a pasta salva. Pedir permissão exige um gesto do usuário, então primeiro tenta em silêncio.
(async () => {
  const saved = await loadHandle();
  if (!saved) return;
  state.dirHandle = saved;
  if ((await saved.queryPermission({ mode: 'read' })) === 'granted') {
    await activate();
  } else {
    $('setupBtn').textContent = 'Continuar com a pasta anterior';
  }
})();
