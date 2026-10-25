import { parseDateStr } from './dates';
import type { Belt, Training } from './types';

// Ex: 2025-06-27.jpg, 2025-06-27-a.jpg, 2025-11-23_.jpg, 2025-11-23-a_.jpg
// -a, -b… = mais de um treino no mesmo dia; _ no fim = treino não oficial.
export const FILE_RE = /^(\d{4})-(\d{2})-(\d{2})(-[a-z])?(_)?\.(jpe?g|png)$/i;

export function parseTrainingFile(
  filename: string,
  belt: Belt,
  fileHandle: FileSystemFileHandle | null = null,
): Training | null {
  const m = filename.match(FILE_RE);
  if (!m) return null;
  const dateStr = `${m[1]}-${m[2]}-${m[3]}`;
  return {
    date: parseDateStr(dateStr),
    dateStr,
    belt,
    suffix: m[4] ? m[4].slice(1) : '',
    official: !m[5],
    filename,
    fileHandle,
  };
}

// Ordena por data e sufixo e remove duplicados: cada treino é único por
// (faixa, data, sufixo, oficial).
export function dedupeTrainings(found: Training[]): Training[] {
  const seen = new Set<string>();
  return found
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.suffix.localeCompare(b.suffix))
    .filter(t => {
      const k = `${t.belt.id}|${t.dateStr}|${t.suffix}|${t.official}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
