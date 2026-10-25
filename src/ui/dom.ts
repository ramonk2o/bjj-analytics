export function $<T extends Element = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as unknown as T;
}

export function showToast(msg: string): void {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

export function animateNumber(id: string, target: number): void {
  const el = $(id);
  const cur = parseInt(el.textContent || '') || 0;
  if (cur === target) return;
  const dur = 600;
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(cur + (target - cur) * e));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function miniStat({ label, value, unit, extra, accent }: {
  label: string; value: string | number; unit?: string; extra?: string; accent?: boolean;
}): string {
  return `
    <div class="mini-stat${accent ? ' accent' : ''}">
      <div class="ms-label">${label}</div>
      <div class="ms-value">${value}${unit ? `<span class="ms-unit">${unit}</span>` : ''}</div>
      ${extra ? `<div class="ms-extra">${extra}</div>` : ''}
    </div>
  `;
}

// Uma linha por "semana passada/atual", dependendo do toggle.
export function streakExtra(weeksSince: number | null, currentStreak: number, streakMin: number, labels: [string, string]): string {
  if (currentStreak === 0) return weeksSince ? `${weeksSince} sem sem ${streakMin}+ treinos` : '—';
  return weeksSince === 0 ? labels[0] : labels[1];
}
