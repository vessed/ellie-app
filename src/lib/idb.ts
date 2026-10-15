/* A tiny IndexedDB key/value mirror.

   localStorage is fast and synchronous, but iOS Safari can clear it under
   storage pressure. We keep a second copy of everything the app persists in
   IndexedDB so nothing is ever lost if localStorage goes away. */

const DB_NAME = 'ellie-app'
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

export function idbGet(key: string): Promise<string | null> {
  return openDb().then(
    (db) =>
      new Promise<string | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
          req.onsuccess = () =>
            resolve(typeof req.result === 'string' ? req.result : null)
          req.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      }),
  )
}

export function idbSet(key: string, value: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve) => {
        if (!db) return resolve()
        try {
          const tx = db.transaction(STORE, 'readwrite')
          tx.objectStore(STORE).put(value, key)
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
          tx.onabort = () => resolve()
        } catch {
          resolve()
        }
      }),
  )
}
