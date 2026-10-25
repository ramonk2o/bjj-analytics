import { BELTS } from './belts';
import { DAY_MS, addDays, daysAgo, startOfDay } from './dates';
import { fmtMonthYear, fmtSpan } from './format';
import type { Settings } from './settings';
import type { Belt, Training } from './types';

export interface GradeProgress {
  currentGrau: number; // 0..4 (4 = todos os graus, próximo é a faixa)
  isPromotion: boolean;
  nextThreshold: number;
  aulasParaProximo: number;
  segSpan: number;
  segDone: number;
  segPct: number;
  nextBelt: Belt | null;
  weeklyAvg: number;
  etaWeeks: number | null;
  etaDate: Date | null;
  beltAulasPerWeek: number;
  etaBeltWeeks: number | null;
  etaBeltDate: Date | null;
  totalPct: number;
}

export interface Graduation {
  belt: Belt;
  aulasPerGrau: number;
  aulasNaFaixa: number;
  daysAtBelt: number;
  totalJJDays: number;
  progress: GradeProgress | null; // null na preta (graduação por tempo, não por aulas)
}

// Faixa atual = a do treino oficial mais recente. `trainings` é a lista efetiva
// (já sem a semana atual quando o toggle está desligado), ordenada por data.
export function computeGraduation(
  trainings: Training[],
  weeklyAvg: number,
  settings: Settings,
  now: Date,
): Graduation | null {
  const official = trainings.filter(t => t.official);
  const lastOfficial = official[official.length - 1];
  if (!lastOfficial) return null;
  const belt = lastOfficial.belt;
  const aulasPerGrau = settings.beltRules[belt.class] || 0;

  const beltTrainings = official.filter(t => t.belt.id === belt.id);
  const aulasNaFaixa = beltTrainings.length;
  const beltStartDate = beltTrainings[0]?.date ?? null;
  const daysAtBelt = beltStartDate ? daysAgo(beltStartDate, now) : 0;
  const totalJJDays = daysAgo(official[0]!.date, now);

  const base = { belt, aulasPerGrau, aulasNaFaixa, daysAtBelt, totalJJDays };
  if (!aulasPerGrau) return { ...base, progress: null };

  const currentGrau = settings.grauOverride !== 'auto'
    ? Math.min(4, parseInt(settings.grauOverride) || 0)
    : Math.min(4, Math.floor(aulasNaFaixa / aulasPerGrau));
  const isPromotion = currentGrau >= 4;
  const nextThreshold = isPromotion ? 5 * aulasPerGrau : (currentGrau + 1) * aulasPerGrau;
  const aulasParaProximo = Math.max(0, nextThreshold - aulasNaFaixa);
  const previousThreshold = isPromotion ? 4 * aulasPerGrau : currentGrau * aulasPerGrau;
  // Progresso dentro do segmento atual (entre o último marco e o próximo)
  const segSpan = nextThreshold - previousThreshold;
  const segDone = aulasNaFaixa - previousThreshold;
  const segPct = Math.max(0, Math.min(100, (segDone / segSpan) * 100));

  const idx = BELTS.findIndex(b => b.id === belt.id);
  const nextBelt = idx >= 0 && idx < BELTS.length - 1 ? BELTS[idx + 1]! : null;

  const today = startOfDay(now);

  // ETA pela média semanal (oficial) do período configurado
  let etaWeeks: number | null = null, etaDate: Date | null = null;
  if (weeklyAvg > 0 && aulasParaProximo > 0) {
    etaWeeks = Math.ceil(aulasParaProximo / weeklyAvg);
    etaDate = addDays(today, etaWeeks * 7);
  }

  // ETA pelo ritmo na faixa atual (mais realista pra faixas longas)
  let beltAulasPerWeek = 0;
  if (beltStartDate) {
    const days = Math.max(1, Math.round((today.getTime() - beltStartDate.getTime()) / DAY_MS) + 1);
    beltAulasPerWeek = aulasNaFaixa / (days / 7);
  }
  let etaBeltWeeks: number | null = null, etaBeltDate: Date | null = null;
  if (beltAulasPerWeek > 0 && aulasParaProximo > 0) {
    etaBeltWeeks = Math.ceil(aulasParaProximo / beltAulasPerWeek);
    etaBeltDate = addDays(today, etaBeltWeeks * 7);
  }

  const totalPct = Math.min(100, (aulasNaFaixa / (5 * aulasPerGrau)) * 100);

  return {
    ...base,
    progress: {
      currentGrau, isPromotion, nextThreshold, aulasParaProximo,
      segSpan, segDone, segPct, nextBelt,
      weeklyAvg, etaWeeks, etaDate, beltAulasPerWeek, etaBeltWeeks, etaBeltDate,
      totalPct,
    },
  };
}

export interface BeltCard {
  belt: Belt;
  n: number; // aulas oficiais na faixa
  isCurrent: boolean;
  info: { label: string; value: string }[];
}

// Trajetória nas faixas: aulas oficiais por faixa, tempo nas passadas e projeção
// das futuras pela média semanal do período (a mesma das ETAs de graduação).
export function computeBeltTrajectory(
  trainings: Training[],
  currentBeltId: string,
  weeklyAvg: number,
  settings: Settings,
  now: Date,
): BeltCard[] {
  const allOfficialFull = trainings.filter(t => t.official);
  const currentBeltIdx = BELTS.findIndex(b => b.id === currentBeltId);
  // veryFirstDate olha todo o histórico (afeta "Jiu-jitsu total")
  const veryFirstDate = allOfficialFull[0]?.date ?? null;
  const aulasToPromote = (belt: Belt | undefined) => 5 * (belt ? settings.beltRules[belt.class] || 0 : 0);

  const beltData = BELTS.map(belt => {
    const bt = allOfficialFull.filter(t => t.belt.id === belt.id);
    return { belt, n: bt.length, first: bt[0]?.date ?? null, last: bt[bt.length - 1]?.date ?? null };
  });

  // Treinos excedentes na faixa atual (já "pagos" para a próxima) reduzem o tempo restante.
  const currentNeeded = aulasToPromote(BELTS[currentBeltIdx]);
  const currentExcess = Math.max(0, (beltData[currentBeltIdx]?.n ?? 0) - currentNeeded);
  let futureWeeksAccum = 0;
  const etaFromNow = () => addDays(now, Math.round(futureWeeksAccum * 7));
  const totalDaysToReach = () => daysAgo(veryFirstDate!, now) + Math.round(futureWeeksAccum * 7);

  return beltData.map(({ belt, n, first, last }, beltIdx) => {
    const isCurrent = belt.id === currentBeltId;
    const info: BeltCard['info'] = [];

    if (isCurrent && first) {
      info.push({ label: 'Na faixa', value: fmtSpan(Math.max(1, daysAgo(first, now))) });
      info.push({ label: 'Chegada', value: fmtMonthYear(first) });
      if (veryFirstDate) {
        info.push({ label: 'Jiu-jitsu total', value: fmtSpan(Math.max(1, daysAgo(veryFirstDate, now))) });
      }
      const remaining = Math.max(0, currentNeeded - n);
      futureWeeksAccum = weeklyAvg > 0 && remaining > 0 ? remaining / weeklyAvg : 0;
    } else if (n > 0 && first && last && beltIdx <= currentBeltIdx) {
      // Faixa passada
      const span = Math.max(1, Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1);
      info.push({ label: 'Na faixa', value: fmtSpan(span) });
      info.push({ label: 'Chegada', value: fmtMonthYear(first) });
      if (veryFirstDate && beltIdx > 0) {
        const totalToArrival = Math.max(1, Math.round((first.getTime() - veryFirstDate.getTime()) / DAY_MS) + 1);
        info.push({ label: 'Jiu-jitsu total', value: fmtSpan(totalToArrival) });
      }
    } else if (n === 0 && beltIdx > currentBeltIdx) {
      // Faixa futura
      if (belt.class === 'preta') {
        const prevEffective = Math.max(0, aulasToPromote(BELTS[beltIdx - 1]) - currentExcess);
        if (weeklyAvg > 0 && prevEffective > 0) futureWeeksAccum += prevEffective / weeklyAvg;
        info.push({ label: 'Na faixa', value: 'o caminho de uma vida' });
        if (veryFirstDate && weeklyAvg > 0) {
          info.push({ label: 'Chegada estimada', value: fmtMonthYear(etaFromNow()) });
          info.push({ label: 'Jiu-jitsu total (est.)', value: `~${fmtSpan(totalDaysToReach())}` });
        }
      } else if (weeklyAvg > 0) {
        const prevBelt = BELTS[beltIdx - 1];
        if (!(prevBelt && prevBelt.id === currentBeltId)) {
          const discount = beltIdx === currentBeltIdx + 2 ? currentExcess : 0;
          const prevEffective = Math.max(0, aulasToPromote(prevBelt) - discount);
          if (prevEffective > 0) futureWeeksAccum += prevEffective / weeklyAvg;
        }
        const aulasInBelt = aulasToPromote(belt);
        if (aulasInBelt > 0) {
          info.push({ label: 'Na faixa (est.)', value: `~${fmtSpan(Math.round((aulasInBelt / weeklyAvg) * 7))}` });
        }
        info.push({ label: 'Chegada estimada', value: fmtMonthYear(etaFromNow()) });
        if (veryFirstDate) {
          info.push({ label: 'Jiu-jitsu total (est.)', value: `~${fmtSpan(totalDaysToReach())}` });
        }
      } else {
        info.push({ label: '', value: '—' });
      }
    } else {
      info.push({ label: '', value: '—' });
    }

    return { belt, n, isCurrent, info };
  });
}
