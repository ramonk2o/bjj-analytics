import type { Training } from '../core/types';

// Object URLs das fotos, por "faixa|arquivo". Limpo a cada re-scan para liberar memória.
const urlCache = new Map<string, string>();

export async function photoUrl(t: Training): Promise<string> {
  const key = `${t.belt.id}|${t.filename}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  if (!t.fileHandle) throw new Error(`no file for ${t.filename}`);
  const url = URL.createObjectURL(await t.fileHandle.getFile());
  urlCache.set(key, url);
  return url;
}

export function clearPhotoUrls(): void {
  urlCache.forEach(url => URL.revokeObjectURL(url));
  urlCache.clear();
}
