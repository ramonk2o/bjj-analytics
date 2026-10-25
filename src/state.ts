import type { Settings, StatsOptions } from './core/settings';
import { filterCurrentWeek } from './core/stats';
import type { Training } from './core/types';
import { loadIncludeCurrentWeek, loadSettings } from './data/settings-store';

export type TreinosFilter = 'all' | 'official' | 'unofficial';

export const state = {
  dirHandle: null as FileSystemDirectoryHandle | null,
  trainings: [] as Training[], // tudo que o scan achou
  trainingsByDay: new Map<string, Training[]>(), // dateStr -> treinos do heatmap (tooltip, lightbox, snapshot)
  treinosFilter: 'all' as TreinosFilter,
  // Por padrão a semana atual fica DE FORA (ainda não terminou); ligado, entra em TODOS os dados.
  includeCurrentWeek: loadIncludeCurrentWeek(),
  settings: loadSettings() as Settings,
};

// What one render pass works with: the options for the stats and the trainings
// already filtered by the current-week toggle.
export interface RenderContext extends StatsOptions {
  effective: Training[];
}

export function renderContext(): RenderContext {
  const now = new Date();
  return {
    settings: state.settings,
    includeCurrentWeek: state.includeCurrentWeek,
    now,
    effective: filterCurrentWeek(state.trainings, state.includeCurrentWeek, now),
  };
}
