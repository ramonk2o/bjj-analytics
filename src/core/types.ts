export type BeltClass = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta';

export interface Belt {
  id: string; // folder name, e.g. '00-branca'
  name: string;
  class: BeltClass;
}

export interface Training {
  date: Date; // local midnight
  dateStr: string; // YYYY-MM-DD
  belt: Belt;
  suffix: string; // 'a', 'b'… separates trainings on the same day
  official: boolean;
  filename: string;
  fileHandle: FileSystemFileHandle | null;
}
