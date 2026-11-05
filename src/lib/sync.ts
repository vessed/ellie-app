import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizeCare } from './types'
import type {
  CareState,
  DayStreak,
  GardenState,
  PlayState,
  Pot,
  Presence,
  Profiles,
  PushSub,
  PupState,
  Who,
} from './types'

export interface SyncCfg {
  url: string
  key: string
  room: string
}

export const emptyCfg: SyncCfg = { url: '', key: '', room: '' }

export type SyncStatus = 'off' | 'connecting' | 'synced' | 'offline'

export const SHARED_KEYS = [
  'dates',
  'memories',
  'treats',
  'notes',
  'songs',
  'playlists',
  'hearts',
  'heartEvents',
  'wishes',
  'customEmojis',
  'points',
  'anniversary',
  'moods',
  'todoRoutine',
  'todoDay',
  'todoLog',
  'artworks',
  'customPages',
  'journal',
  'rules',
  'reminders',
  'dailyReminders',
  'dailyPhoto',
  'treatRequests',
  'alerts',
  'play',
  'care',
  'presence',
  'profiles',
  'pushSubs',
] as const

export type SharedKey = (typeof SHARED_KEYS)[number]

export const ARRAY_KEYS: readonly SharedKey[] = [
  'dates',
  'memories',
  'treats',
  'notes',
  'songs',
  'playlists',
  'heartEvents',
  'wishes',
  'customEmojis',
  'moods',
  'todoRoutine',
  'todoLog',
  'artworks',
  'customPages',
  'journal',
  'rules',
  'reminders',
  'dailyReminders',
  'treatRequests',
  'alerts',
]

export interface SyncBundle {
  t: number
  v: unknown
  del?: string[]
  /* deletion timestamps per id, so a tombstone can't beat a newer write */
  delT?: Record<string, number>
}

export function makeClient(cfg: SyncCfg): SupabaseClient | null {
  if (!cfg.url.trim().startsWith('https://') || cfg.key.trim().length < 20)
    return null
  return createClient(cfg.url.trim(), cfg.key.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export function roomKeyOK(room: string) {
  return /^[A-Za-z0-9._-]{3,64}$/.test(room.trim())
}

export function idsOf(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) =>
      x && typeof x === 'object' ? ((x as { id?: unknown }).id as string) : '',
    )
    .filter(Boolean)
}

/* Custom merges for keys where "newer bundle wins" would lose the other
   device's progress (scores, streaks, garden). They receive (newer, older). */
function mergePlay(newer: unknown, older: unknown): PlayState {
  const n = (newer && typeof newer === 'object' ? newer : {}) as Partial<PlayState>
  const o = (older && typeof older === 'object' ? older : {}) as Partial<PlayState>
  const games = new Set([
    ...Object.keys(n.highScores ?? {}),
    ...Object.keys(o.highScores ?? {}),
  ])
  const highScores: PlayState['highScores'] = {}
  for (const g of games) {
    const nw = (n.highScores?.[g] ?? {}) as Partial<Record<Who, number>>
    const ow = (o.highScores?.[g] ?? {}) as Partial<Record<Who, number>>
    const merged: Partial<Record<Who, number>> = {}
    for (const w of new Set([...Object.keys(nw), ...Object.keys(ow)])) {
      const a = nw[w as Who]
      const b = ow[w as Who]
      if (a !== undefined || b !== undefined) merged[w as Who] = Math.max(a ?? 0, b ?? 0)
    }
    highScores[g] = merged
  }
  const nd = n.lastChallengeDay ?? ''
  const od = o.lastChallengeDay ?? ''
  /* per-person streaks: keep each person's best count and latest completion day */
  const streaks: Partial<Record<Who, DayStreak>> = {}
  for (const w of new Set([
    ...Object.keys(n.streaks ?? {}),
    ...Object.keys(o.streaks ?? {}),
  ]) as Set<Who>) {
    const a = n.streaks?.[w]
    const b = o.streaks?.[w]
    if (!a && !b) continue
    if (!a) {
      streaks[w] = b
      continue
    }
    if (!b) {
      streaks[w] = a
      continue
    }
    const aNewer = (a.lastDay ?? '') >= (b.lastDay ?? '')
    const latest = aNewer ? a : b
    streaks[w] = {
      count: Math.max(a.count ?? 0, b.count ?? 0),
      lastDay: latest.lastDay ?? '',
      best: latest.best ?? Math.max(a.best ?? 0, b.best ?? 0),
    }
  }
  /* per-person "done today" markers: keep the later date */
  const dailyDone: Partial<Record<Who, string>> = {}
  for (const w of new Set([
    ...Object.keys(n.dailyDone ?? {}),
    ...Object.keys(o.dailyDone ?? {}),
  ]) as Set<Who>) {
    const a = n.dailyDone?.[w] ?? ''
    const b = o.dailyDone?.[w] ?? ''
    if (a || b) dailyDone[w] = a > b ? a : b
  }
  return {
    streak: Math.max(n.streak ?? 0, o.streak ?? 0),
    lastChallengeDay: nd > od ? nd : od,
    highScores,
    streaks,
    dailyDone,
  }
}

/* Presence: keep the most recent last-seen time per person. */
function mergePresence(newer: unknown, older: unknown): Presence {
  const n = (newer && typeof newer === 'object' ? newer : {}) as Presence
  const o = (older && typeof older === 'object' ? older : {}) as Presence
  const out: Presence = {}
  for (const w of new Set([...Object.keys(n), ...Object.keys(o)]) as Set<Who>) {
    const a = n[w]
    const b = o[w]
    out[w] = Math.max(typeof a === 'number' ? a : 0, typeof b === 'number' ? b : 0)
  }
  return out
}

/* Push subscriptions: one per person. Keep each person's from whichever side
   has it, so neither device's subscription is ever dropped by the other. */
function mergePushSubs(
  newer: unknown,
  older: unknown,
): Partial<Record<Who, PushSub>> {
  const n = (newer && typeof newer === 'object' ? newer : {}) as Partial<
    Record<Who, PushSub>
  >
  const o = (older && typeof older === 'object' ? older : {}) as Partial<
    Record<Who, PushSub>
  >
  const out: Partial<Record<Who, PushSub>> = {}
  if (n.ellie) out.ellie = n.ellie
  else if (o.ellie) out.ellie = o.ellie
  if (n.you) out.you = n.you
  else if (o.you) out.you = o.you
  return out
}

/* Profiles: per-person, whichever was set most recently wins. */
function mergeProfiles(newer: unknown, older: unknown): Profiles {
  const n = (newer && typeof newer === 'object' ? newer : {}) as Profiles
  const o = (older && typeof older === 'object' ? older : {}) as Profiles
  const out: Profiles = {}
  for (const w of new Set([...Object.keys(n), ...Object.keys(o)]) as Set<Who>) {
    const a = n[w]
    const b = o[w]
    if (!a) {
      if (b) out[w] = b
      continue
    }
    if (!b) {
      out[w] = a
      continue
    }
    out[w] = (a.ts ?? 0) >= (b.ts ?? 0) ? a : b
  }
  return out
}

function mergeCare(newer: unknown, older: unknown): CareState {
  const n = (newer && typeof newer === 'object' ? newer : {}) as Partial<CareState>
  const o = (older && typeof older === 'object' ? older : {}) as Partial<CareState>
  const nPup = (n.pup && typeof n.pup === 'object' ? n.pup : {}) as Partial<PupState>
  const oPup = (o.pup && typeof o.pup === 'object' ? o.pup : {}) as Partial<PupState>
  const nG = (n.garden && typeof n.garden === 'object' ? n.garden : {}) as Partial<GardenState>
  const oG = (o.garden && typeof o.garden === 'object' ? o.garden : {}) as Partial<GardenState>

  const nPots = Array.isArray(nG.pots) ? nG.pots : []
  const oPots = Array.isArray(oG.pots) ? oG.pots : []
  const oById = new Map<string, Pot>(oPots.map((p) => [p.id, p]))
  /* Newer owns pot membership (so removals stick); pots kept in both get the
     combined result of concurrent watering/fertilizing. */
  const pots: Pot[] = nPots.map((np) => {
    const op = oById.get(np.id)
    if (!op) return np
    return {
      ...np,
      growth: Math.max(np.growth, op.growth),
      waterDays: Array.from(new Set([...op.waterDays, ...np.waterDays])).sort(),
      lastWatered: np.lastWatered > op.lastWatered ? np.lastWatered : op.lastWatered,
      lastFertilized:
        np.lastFertilized > op.lastFertilized ? np.lastFertilized : op.lastFertilized,
      bestStreak: Math.max(np.bestStreak, op.bestStreak),
    }
  })

  const blooms: Record<string, number> = { ...(oG.blooms ?? {}) }
  for (const [k, v] of Object.entries(nG.blooms ?? {})) {
    blooms[k] = Math.max(blooms[k] ?? 0, typeof v === 'number' ? v : 0)
  }

  const adoptedAt =
    nPup.adoptedAt && oPup.adoptedAt
      ? Math.min(nPup.adoptedAt, oPup.adoptedAt)
      : nPup.adoptedAt || oPup.adoptedAt || 0

  return normalizeCare({
    pup: { ...nPup, bond: Math.max(nPup.bond ?? 0, oPup.bond ?? 0), adoptedAt },
    garden: { pots, blooms },
  })
}

const MERGERS: Record<string, (newer: unknown, older: unknown) => unknown> = {
  play: mergePlay,
  care: mergeCare,
  presence: mergePresence,
  profiles: mergeProfiles,
  pushSubs: mergePushSubs,
  hearts: (n, o) =>
    Math.max(typeof n === 'number' ? n : 0, typeof o === 'number' ? o : 0),
}

function unionMerge(key: string, a: SyncBundle, b: SyncBundle): SyncBundle {
  if ((ARRAY_KEYS as readonly string[]).includes(key)) {
    const aArr = Array.isArray(a.v) ? (a.v as unknown[]) : []
    const bArr = Array.isArray(b.v) ? (b.v as unknown[]) : []
    const aDel = a.del ?? []
    const bDel = b.del ?? []
    const del = Array.from(new Set([...aDel, ...bDel]))
    /* newest deletion time per id; fall back to the bundle that carried it */
    const delT: Record<string, number> = {}
    for (const id of del) {
      const at = aDel.includes(id) ? (a.delT?.[id] ?? a.t) : 0
      const bt = bDel.includes(id) ? (b.delT?.[id] ?? b.t) : 0
      delT[id] = Math.max(at, bt)
    }
    const newer = b.t >= a.t ? b : a
    const first = newer === b ? bArr : aArr
    const second = newer === b ? aArr : bArr
    const out: unknown[] = []
    const seen = new Set<string>()
    const take = (arr: unknown[], srcT: number) => {
      for (const it of arr) {
        if (!it || typeof it !== 'object') continue
        const id = (it as { id?: unknown }).id as string
        if (!id || seen.has(id)) continue
        const delTime = delT[id]
        /* only a deletion recorded at/after this copy's write can kill it */
        if (delTime && delTime >= srcT) continue
        seen.add(id)
        out.push(it)
      }
    }
    take(first, newer.t)
    take(second, newer === b ? a.t : b.t)
    return { t: Math.max(a.t, b.t), v: out, del, delT }
  }
  const merge = MERGERS[key]
  if (merge) {
    const newer = b.t >= a.t ? b : a
    const older = newer === b ? a : b
    return { t: Math.max(a.t, b.t), v: merge(newer.v, older.v), del: [], delT: {} }
  }
  const newer = b.t >= a.t ? b : a
  return { t: Math.max(a.t, b.t), v: newer.v, del: [], delT: {} }
}

export function mergeBundles(
  local: Record<string, SyncBundle>,
  remote: Record<string, SyncBundle>,
): Record<string, SyncBundle> {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)])
  const out: Record<string, SyncBundle> = {}
  for (const k of keys) {
    out[k] =
      k in local && k in remote ? unionMerge(k, local[k], remote[k]) : (local[k] ?? remote[k])
  }
  return out
}

export async function fetchRoom(
  client: SupabaseClient,
  room: string,
): Promise<Record<string, SyncBundle> | null> {
  const { data, error } = await client
    .from('rooms')
    .select('data')
    .eq('id', room)
    .maybeSingle()
  if (error) return null
  return data && data.data ? ((data.data as unknown) as Record<string, SyncBundle>) : null
}

export async function pushRoom(
  client: SupabaseClient,
  room: string,
  data: Record<string, SyncBundle>,
): Promise<boolean> {
  const { error } = await client
    .from('rooms')
    .upsert({ id: room, data, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  return !error
}

export function suggestRoom() {
  const xs = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += xs[Math.floor(Math.random() * xs.length)]
  return `ellie-${s}`
}