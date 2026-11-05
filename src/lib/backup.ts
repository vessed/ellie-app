/* Everything the app saves lives in localStorage under `ellie-*` keys. This
   gives you a simple safety net: download a snapshot of *all* of it, and later
   merge a backup back in — without ever overwriting or deleting what you
   already have. */

const PREFIX = 'ellie-'

/* Ephemeral UI state that isn't worth backing up. */
const SKIP = new Set([
  'ellie-bell-seen',
  'ellie-bell-cleared',
  'ellie-sidebar-order-v2',
])

export interface BackupFile {
  app: 'ellie'
  version: 1
  exportedAt: number
  data: Record<string, unknown>
}

function idOf(item: unknown): string | undefined {
  if (item && typeof item === 'object' && 'id' in item) {
    const id = (item as { id?: unknown }).id
    if (typeof id === 'string') return id
  }
  return undefined
}

export function makeBackup(): BackupFile {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(PREFIX) || SKIP.has(key)) continue
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return { app: 'ellie', version: 1, exportedAt: Date.now(), data }
}

export function downloadBackup() {
  const backup = makeBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `ellie-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return Object.keys(backup.data).length
}

export interface RestoreResult {
  ok: boolean
  added: number
  message: string
}

/* Merge a backup into local storage. Existing items always win; we only add
   things that are missing (new ids, or keys that don't exist yet). Nothing is
   ever removed or overwritten. */
export function restoreBackup(text: string): RestoreResult {
  let parsed: BackupFile
  try {
    parsed = JSON.parse(text) as BackupFile
  } catch {
    return { ok: false, added: 0, message: 'That file is not a valid backup. 🙈' }
  }
  const data = parsed?.data
  if (!data || typeof data !== 'object') {
    return { ok: false, added: 0, message: 'That backup looks empty. 🙈' }
  }

  let added = 0
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(PREFIX) || SKIP.has(key)) continue
    const raw = localStorage.getItem(key)
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(value))
      added += Array.isArray(value) ? value.length : 1
      continue
    }
    let current: unknown
    try {
      current = JSON.parse(raw)
    } catch {
      continue
    }
    if (Array.isArray(current) && Array.isArray(value)) {
      const seen = new Set(current.map(idOf).filter(Boolean) as string[])
      const merged = [...current]
      for (const item of value) {
        const id = idOf(item)
        if (id === undefined || seen.has(id)) continue
        seen.add(id)
        merged.push(item)
        added++
      }
      if (merged.length !== current.length) {
        localStorage.setItem(key, JSON.stringify(merged))
      }
    }
    /* Objects & plain values: keep whatever is already here. */
  }

  return {
    ok: true,
    added,
    message:
      added > 0
        ? `Backup merged — added ${added} item${added === 1 ? '' : 's'} back. 💞`
        : 'Backup merged — everything in it is already here. 💞',
  }
}
