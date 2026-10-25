// Keeps the chosen folder handle in IndexedDB so the app can reopen it next time.
const DB_NAME = 'jiu-jitsu-report';
const STORE = 'handles';
const KEY = 'dir';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function saveHandle(h: FileSystemDirectoryHandle): Promise<void> {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(h, KEY);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => res((req.result as FileSystemDirectoryHandle | undefined) || null);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return null;
  }
}

export async function ensurePermission(h: FileSystemHandle): Promise<boolean> {
  const opts = { mode: 'read' } as const;
  if ((await h.queryPermission(opts)) === 'granted') return true;
  return (await h.requestPermission(opts)) === 'granted';
}
