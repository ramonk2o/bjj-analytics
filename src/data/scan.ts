import { BELTS } from '../core/belts';
import { dedupeTrainings, parseTrainingFile } from '../core/filename';
import type { Training } from '../core/types';

// Reads every belt folder that exists and turns matching photo names into trainings.
export async function scanFolder(dir: FileSystemDirectoryHandle): Promise<Training[]> {
  const found: Training[] = [];
  for (const belt of BELTS) {
    let folder: FileSystemDirectoryHandle;
    try { folder = await dir.getDirectoryHandle(belt.id); }
    catch { continue; }
    for await (const entry of folder.values()) {
      if (entry.kind !== 'file') continue;
      const t = parseTrainingFile(entry.name, belt, entry as FileSystemFileHandle);
      if (t) found.push(t);
    }
  }
  return dedupeTrainings(found);
}
