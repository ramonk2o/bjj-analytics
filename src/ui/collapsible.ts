import { loadCollapsed, saveCollapsed } from '../data/settings-store';

export function setupCollapsibles(): void {
  document.addEventListener('click', ev => {
    const target = ev.target as Element;
    if (target.closest('.hf-pill')) return;
    const section = target.closest('.collapsible-header')?.closest('.collapsible');
    if (!section) return;
    section.classList.toggle('collapsed');
    if (section.id) saveCollapsed(section.id, section.classList.contains('collapsed'));
  });

  document.querySelectorAll('.collapsible').forEach(sec => {
    if (!sec.id) return;
    // Marcos sempre inicia colapsado
    if (sec.id === 'badgesSection' || loadCollapsed(sec.id)) sec.classList.add('collapsed');
  });
}
