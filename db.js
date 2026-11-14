// ============================================================
// db.js — tiny wrapper around IndexedDB (the browser's built-in
// database). Every entry is stored on THIS device only.
//
// Entry shape:
// { date: "2026-11-14", text: "...", photo: Blob, thumb: Blob,
//   createdAt: 1731600000000, updatedAt: 1731600000000 }
// ============================================================

const DB_NAME = 'days365';
const DB_VERSION = 1;
const STORE = 'entries';

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'date' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export const getAll = () => run('readonly', s => s.getAll());
export const get = date => run('readonly', s => s.get(date));
export const put = entry => run('readwrite', s => s.put(entry));
export const del = date => run('readwrite', s => s.delete(date));
export const clear = () => run('readwrite', s => s.clear());
