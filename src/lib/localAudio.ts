/* Local music files are stored as Blobs in IndexedDB (keyed by song id) so they
   survive reloads on the device that imported them, without bloating
   localStorage or being synced (blob URLs are meaningless on other devices). */
const DB_NAME = 'ellie-audio'
const STORE = 'files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveAudio(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function loadAudio(id: string): Promise<Blob | null> {
  const db = await openDB()
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

/* Object URLs are cached per song for the session (reused on replay). A stale
   blob: URL persisted from a previous session is ignored in favour of IDB. */
const urlCache = new Map<string, string>()

export async function resolveAudioUrl(id: string, storedSrc?: string): Promise<string> {
  /* Any non-empty src that isn't a stale blob: URL is usable directly
     (built-in relative paths like "audio/x.mp3", or a real https URL). */
  if (storedSrc && !storedSrc.startsWith('blob:')) return storedSrc
  const cached = urlCache.get(id)
  if (cached) return cached
  const blob = await loadAudio(id)
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urlCache.set(id, url)
  return url
}
