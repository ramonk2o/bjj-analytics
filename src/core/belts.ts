import type { Belt, BeltClass } from './types';

export const BELTS: readonly Belt[] = [
  { id: '00-branca', name: 'Branca', class: 'branca' },
  { id: '01-azul',   name: 'Azul',   class: 'azul' },
  { id: '02-roxa',   name: 'Roxa',   class: 'roxa' },
  { id: '03-marrom', name: 'Marrom', class: 'marrom' },
  { id: '04-preta',  name: 'Preta',  class: 'preta' },
];

// Aulas por grau em cada faixa. Cada faixa tem 4 graus; depois do 4º, a próxima
// graduação é subir de faixa, em 5×N aulas no total. Preta não segue essa regra (0).
export const BELT_RULES_DEFAULTS: Readonly<Record<BeltClass, number>> = {
  branca: 30, azul: 65, roxa: 75, marrom: 85, preta: 0,
};

export function beltById(id: string): Belt | undefined {
  return BELTS.find(b => b.id === id);
}
