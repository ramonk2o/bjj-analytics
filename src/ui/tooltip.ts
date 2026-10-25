import { parseDateStr } from '../core/dates';
import { DOW_NAMES, fmtDate } from '../core/format';
import { state } from '../state';
import { $ } from './dom';
import { photoUrl } from './photos';

export function positionTooltip(el: Element): void {
  const tip = $('tooltip');
  const r = el.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  let left = r.left + r.width / 2 + window.scrollX;
  let top = r.top + window.scrollY - tipRect.height - 10;
  if (top < window.scrollY + 8) top = r.bottom + window.scrollY + 10;
  const halfW = tipRect.width / 2;
  const minLeft = window.scrollX + halfW + 8;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - halfW - 8;
  left = Math.max(minLeft, Math.min(maxLeft, left));
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

export function dayLabel(ds: string, day: { official: boolean }[]): string {
  const dow = DOW_NAMES[parseDateStr(ds).getDay()];
  if (!day.length) return `${dow}, ${fmtDate(ds)} — sem treino`;
  const n = day.length;
  const off = day.filter(t => t.official).length;
  const unof = n - off;
  let label = `${dow}, ${fmtDate(ds)} — ${n} ${n === 1 ? 'treino' : 'treinos'}`;
  if (unof && !off) label += ' (não oficial)';
  else if (unof) label += ` (${unof} não oficial)`;
  return label;
}

// Tooltip de [data-tip] e das células do heatmap (com prévia das fotos) e o lightbox do dia.
export function setupTooltipAndLightbox(): void {
  const tip = $('tooltip');
  const tipText = tip.querySelector<HTMLElement>('.tip-text')!;
  const tipImgs = tip.querySelector<HTMLElement>('.tip-imgs')!;
  const tipHint = tip.querySelector<HTMLElement>('.tip-hint')!;
  let activeHoverEl: Element | null = null;
  let imagesTimer: ReturnType<typeof setTimeout> | undefined; // debounce do carregamento das prévias

  function showHeatmapTooltipText(cell: HTMLElement) {
    const ds = cell.dataset.dateStr!;
    const day = state.trainingsByDay.get(ds) || [];
    tipImgs.innerHTML = '';
    tipText.textContent = dayLabel(ds, day);
    tipHint.textContent = !day.length ? ''
      : day.length > 1 ? `Clique pra escolher uma foto · ${day.length} no total` : 'Clique pra abrir a foto';
    tip.classList.add('show');
    positionTooltip(cell);
  }

  function loadHeatmapTooltipImages(cell: HTMLElement) {
    const day = state.trainingsByDay.get(cell.dataset.dateStr!) || [];
    if (!day.length) return;
    tipImgs.innerHTML = '';
    for (const t of day.slice(0, 3)) {
      const img = document.createElement('img');
      img.className = 'tip-img loading';
      tipImgs.appendChild(img);
      photoUrl(t).then(url => {
        if (activeHoverEl !== cell) return;
        img.src = url;
        img.onload = () => {
          img.classList.remove('loading');
          positionTooltip(cell);
        };
      }).catch(err => console.error('Erro ao carregar preview:', err));
    }
    positionTooltip(cell);
  }

  document.addEventListener('mouseover', e => {
    const target = e.target as Element;
    const cell = target.closest<HTMLElement>('.heatmap-cell');
    if (cell && cell.dataset.dateStr) {
      activeHoverEl = cell;
      // Texto na hora; fotos depois de 150ms
      showHeatmapTooltipText(cell);
      clearTimeout(imagesTimer);
      imagesTimer = setTimeout(() => {
        if (activeHoverEl === cell) loadHeatmapTooltipImages(cell);
      }, 150);
      return;
    }
    const el = target.closest<HTMLElement | SVGElement>('[data-tip]');
    if (el) {
      activeHoverEl = el;
      tipText.textContent = el.dataset.tip ?? '';
      tipImgs.innerHTML = '';
      tipHint.textContent = '';
      tip.classList.add('show');
      positionTooltip(el);
    }
  });

  document.addEventListener('mouseout', e => {
    const target = e.target as Element;
    if (target.closest('.heatmap-cell') || target.closest('[data-tip]')) {
      tip.classList.remove('show');
      clearTimeout(imagesTimer);
      activeHoverEl = null;
    }
  });

  // Lightbox com todas as fotos do dia
  const lb = $('lightbox');
  document.addEventListener('click', async e => {
    const cell = (e.target as Element).closest<HTMLElement>('.heatmap-cell');
    if (!cell || !cell.dataset.dateStr) return;
    const ds = cell.dataset.dateStr;
    const day = state.trainingsByDay.get(ds);
    if (!day || !day.length) return;
    const gallery = $('lightboxGallery');
    const dow = DOW_NAMES[parseDateStr(ds).getDay()];
    $('lightboxHeader').textContent = `${dow}, ${fmtDate(ds)} — ${day.length} ${day.length === 1 ? 'foto' : 'fotos'}`;
    gallery.innerHTML = '';
    lb.classList.add('open');
    const soloClass = day.length === 1 ? ' solo' : '';
    for (const t of day) {
      const img = document.createElement('img');
      img.className = 'loading' + soloClass;
      img.title = t.filename;
      img.addEventListener('click', () => window.open(img.src, '_blank'));
      gallery.appendChild(img);
      try {
        img.src = await photoUrl(t);
      } catch {
        img.alt = 'Erro ao carregar';
      }
      img.classList.remove('loading');
    }
  });

  $('lightboxClose').addEventListener('click', () => lb.classList.remove('open'));
  lb.addEventListener('click', e => {
    if (e.target === lb) lb.classList.remove('open');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lb.classList.contains('open')) lb.classList.remove('open');
  });
}
