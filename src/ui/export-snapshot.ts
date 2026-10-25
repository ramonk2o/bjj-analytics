import { toDateStr } from '../core/dates';
import { state } from '../state';
import { showToast } from './dom';
import { dayLabel } from './tooltip';

// Script embutido no snapshot: tooltips só de texto e a seção de Marcos recolhível.
// Roda sozinho no arquivo exportado, então não pode importar nada.
const SNAPSHOT_SCRIPT = `
(function() {
  var labels = __LABELS__;
  var tip = document.getElementById('tooltip');
  if (tip) {
    var tipText = tip.querySelector('.tip-text');
    function positionTooltip(el) {
      var r = el.getBoundingClientRect();
      var tipRect = tip.getBoundingClientRect();
      var left = r.left + r.width/2 + window.scrollX;
      var top = r.top + window.scrollY - tipRect.height - 10;
      if (top < window.scrollY + 8) top = r.bottom + window.scrollY + 10;
      var halfW = tipRect.width / 2;
      var minLeft = window.scrollX + halfW + 8;
      var maxLeft = window.scrollX + document.documentElement.clientWidth - halfW - 8;
      left = Math.max(minLeft, Math.min(maxLeft, left));
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    document.addEventListener('mouseover', function(e) {
      var cell = e.target.closest('.heatmap-cell');
      var el = cell && cell.dataset.dateStr ? cell : e.target.closest('[data-tip]');
      if (!el) return;
      tipText.textContent = el === cell ? labels[cell.dataset.dateStr] : el.dataset.tip;
      tip.classList.add('show');
      positionTooltip(el);
    });
    document.addEventListener('mouseout', function(e) {
      if (e.target.closest('.heatmap-cell') || e.target.closest('[data-tip]')) tip.classList.remove('show');
    });
  }
  document.addEventListener('click', function(e) {
    var header = e.target.closest('.collapsible-header');
    if (!header) return;
    var section = header.closest('.collapsible');
    if (section) section.classList.toggle('collapsed');
  });
})();
`;

// Baixa um HTML estático do relatório como está na tela, sem fotos e sem controles.
export function exportSnapshot(): void {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const remove = (sel: string) => clone.querySelectorAll(sel).forEach(el => el.remove());

  remove('script');
  remove('.setup');
  remove('#settingsOverlay');
  remove('.controls'); // atualizar, exportar e toggle não funcionam fora do app
  remove('#toast');
  remove('#lightbox');
  remove('.tip-imgs');
  remove('.tip-hint');

  const main = clone.querySelector<HTMLElement>('#main');
  if (main) main.style.display = '';
  const lu = clone.querySelector('#lastUpdate');
  if (lu) lu.textContent = (lu.textContent || '').replace(/Atualizado/i, 'Exportado');
  // Rodapé: só o crédito do autor
  const footer = clone.querySelector('footer');
  if (footer) footer.innerHTML = footer.querySelector('div')?.outerHTML ?? '';

  // Texto do tooltip de cada dia do heatmap, já pronto
  const labels: Record<string, string> = {};
  clone.querySelectorAll<HTMLElement>('.heatmap-cell[data-date-str]').forEach(cell => {
    const ds = cell.dataset.dateStr!;
    labels[ds] = dayLabel(ds, state.trainingsByDay.get(ds) || []);
  });
  const script = document.createElement('script');
  script.textContent = SNAPSHOT_SCRIPT.replace('__LABELS__', JSON.stringify(labels));
  clone.querySelector('body')!.appendChild(script);

  const html = '<!DOCTYPE html>\n<html lang="pt-BR">\n' + clone.innerHTML + '\n</html>';
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `jiu-jitsu-report-${toDateStr(new Date())}.html`; // dia local
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Snapshot exportado!');
}
