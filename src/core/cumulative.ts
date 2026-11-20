import { DAY_MS } from './dates';
import { nextMilestoneAfter, type CumulativePoint } from './stats';

const AVG_MONTH_DAYS = 30.4375;

// Espaçamento dos marcadores do gráfico de treinos acumulados: a cada 100 treinos
// a partir de 200, a cada 50 a partir de 100, a cada 25 abaixo disso.
export function cumulativeMarkerStep(total: number): number {
  return total >= 200 ? 100 : total >= 100 ? 50 : 25;
}

// Um marcador por múltiplo do espaçamento já alcançado, no treino que o alcançou.
export function cumulativeMarkers(cum: CumulativePoint[]): { milestone: number; point: CumulativePoint }[] {
  const last = cum[cum.length - 1];
  if (!last) return [];
  const step = cumulativeMarkerStep(last.total);
  const markers: { milestone: number; point: CumulativePoint }[] = [];
  const seen = new Set<number>();
  cum.forEach(point => {
    const milestone = Math.floor(point.total / step) * step;
    if (milestone > 0 && !seen.has(milestone) && milestone <= last.total) {
      seen.add(milestone);
      markers.push({ milestone, point });
    }
  });
  return markers;
}

export interface CumulativeProjection {
  milestone: number; // próximo múltiplo de 50, sempre acima do total
  remaining: number;
  etaMs: number | null; // null sem média mensal
}

// Projeção até o próximo múltiplo de 50, pela média mensal.
export function cumulativeProjection(total: number, monthlyAvg: number, now: Date): CumulativeProjection {
  const milestone = nextMilestoneAfter(total);
  const remaining = milestone - total;
  const etaMs = monthlyAvg > 0 ? now.getTime() + (remaining / monthlyAvg) * AVG_MONTH_DAYS * DAY_MS : null;
  return { milestone, remaining, etaMs };
}
