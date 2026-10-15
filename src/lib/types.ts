export type Route =
  | 'home'
  | 'daily'
  | 'dates'
  | 'memories'
  | 'treats'
  | 'notes'
  | 'music'
  | 'wishlist'
  | 'mood'
  | 'todo'
  | 'rules'
  | 'playroom'
  | 'library'
  | 'settings'

export type Who = 'ellie' | 'you'

export interface DateItem {
  id: string
  title: string
  detail: string
  date: string
  time: string
  emoji: string
}

export interface MemoryItem {
  id: string
  caption: string
  src: string
  date: string
  emoji: string
}

export interface TreatItem {
  id: string
  title: string
  detail: string
  cost: number
  emoji: string
  earned: number
  redeemed: boolean
}

export type TreatRequestStatus = 'pending' | 'approved' | 'denied'

export interface TreatRequest {
  id: string
  title: string
  detail: string
  link: string
  /* optional downscaled image data URL */
  src: string
  emoji: string
  /* her suggested price; null means "you pick, Daddy" */
  price: number | null
  status: TreatRequestStatus
  createdAt: number
  decidedAt?: number
  /* the final price Micah set when approving */
  decidedCost?: number
}

export interface NoteLike {
  by: Who
  ts: number
}

export interface NoteItem {
  id: string
  body: string
  from: Who
  to: Who
  createdAt: number
  read: boolean
  /* per-person save flag; only the person who saved it sees it in their list */
  savedBy?: Partial<Record<Who, boolean>>
  /* legacy single-flag (kept for old data) */
  saved?: boolean
  /* hearts placed on this note by either person */
  likes?: NoteLike[]
  /* 'system' = an app update (e.g. treat approved); hidden from Love Notes */
  kind?: 'note' | 'system'
}

export interface HeartEvent {
  id: string
  from: Who
  createdAt: number
}

/* Standalone pop-up notification (e.g. treat approved) — separate from Love Notes. */
export interface AppAlert {
  id: string
  to: Who
  body: string
  createdAt: number
}

export interface WishItem {
  id: string
  title: string
  detail: string
  link: string
  src: string
  emoji: string
  createdAt: number
}

export interface CustomEmoji {
  id: string
  src: string
  name: string
}

export interface Mood {
  id: string
  who: Who
  emoji: string
  label: string
  note: string
  updatedAt: number
}

export type SongKind = 'file' | 'youtube' | 'spotify'

export interface Song {
  id: string
  title: string
  artist: string
  kind: SongKind
  src?: string
  url?: string
}

export interface Playlist {
  id: string
  name: string
  emoji: string
  songIds: string[]
  embedUrl?: string
}

export interface Toast {
  id: string
  message: string
  emoji: string
  action?: () => void
  /* true while the toast is playing its fade-out before removal */
  leaving?: boolean
}

export type Theme = 'blush' | 'bluey' | 'lilac' | 'mint'

export type ColoringTheme = 'spongebob' | 'bluey' | 'halloween'

export interface Artwork {
  id: string
  kind: 'color' | 'draw'
  pageId?: string
  title: string
  theme?: ColoringTheme
  /* color-by-number pages: regionId -> chosen color */
  fills?: Record<string, string>
  /* free-draw pages: PNG data URL */
  src?: string
  by: Who
  createdAt: number
}

export interface RuleItem {
  id: string
  text: string
}

export interface DailyPhoto {
  date: string
  url: string
}

/* One written page of a person's journal. `id` is stable per person+page
   (e.g. "journal-you-3") so syncing keeps the most recent text. */
export interface JournalPage {
  id: string
  who: Who
  page: number
  text: string
  updatedAt: number
}

/* Total pages per person's journal (shown two at a time as a spread). */
export const JOURNAL_PAGES = 100

export interface CustomPage {
  id: string
  name: string
  /* downscaled image data URL (jpeg) */
  src: string
  width: number
  height: number
  addedBy: Who
  createdAt: number
}

export type TodoSection = 'morning' | 'midday' | 'night'

export interface TodoTask {
  id: string
  text: string
  time: string
  section: TodoSection
}

export interface TodoStatus {
  done: boolean
  doneAt?: number
}

export interface TodoDay {
  /* one entry per calendar day; date is YYYY-MM-DD */
  id: string
  date: string
  routine: Record<string, TodoStatus>
  extras: TodoExtra[]
  extraStatus: Record<string, TodoStatus>
  rating: number /* 1-10, 0 = unrated */
  mood: string
  completed: boolean
  completedAt?: number
}

export interface TodoExtra {
  id: string
  text: string
}

export interface TodoLogTask {
  id: string
  text: string
  time: string
  section: TodoSection
  done: boolean
}

export interface TodoLogExtra {
  id: string
  text: string
  done: boolean
}

export interface TodoDayLog {
  id: string
  date: string
  tasks: TodoLogTask[]
  extras: TodoLogExtra[]
  rating: number
  mood: string
  completedAt: number
  grade: number /* Micah's grade, 0 = ungraded */
  gradedAt?: number
}

export const WHO_NAME: Record<Who, string> = { ellie: 'Ellie', you: 'Micah' }

export const WHO_EMOJI: Record<Who, string> = { ellie: '🐶', you: '🐼' }

export interface DayStreak {
  count: number
  /* YYYY-MM-DD of the last day this person completed the daily challenge */
  lastDay: string
  /* best completion time (ms) for that person, for tie-breaking / display */
  best?: number
}

export interface PlayState {
  /* legacy shared streak (kept for old data) */
  streak: number
  /* the shared daily challenge date — both people play the same day's game */
  lastChallengeDay: string
  highScores: Record<string, Partial<Record<Who, number>>>
  /* per-person daily streak; each person's streak is tracked independently */
  streaks?: Partial<Record<Who, DayStreak>>
  /* per-person flag: did this person already complete today's daily challenge */
  dailyDone?: Partial<Record<Who, string>>
}

/* Last-seen timestamps per person, used for the online/offline indicator. */
export type Presence = Partial<Record<Who, number>>

/* A Web Push subscription for one phone, so the other phone can buzz it even
   when the app is closed. Synced per-person through the shared room. */
export interface PushSub {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface ProfilePic {
  /* downscaled image data URL */
  src: string
  ts: number
}

export type Profiles = Partial<Record<Who, ProfilePic>>

export interface PupState {
  name: string
  adoptedAt: number
  fullness: number
  cleanliness: number
  happiness: number
  bond: number
  lastTick: string
  lastFed: string
  lastBrushed: string
  lastWalked: string
  lastPlayed: string
  lastCuddled: string
  lastTreated: string
}

export interface Pot {
  id: string
  flower: string
  plantedAt: number
  growth: number
  lastWatered: string
  waterDays: string[]
  lastFertilized: string
  bestStreak: number
}

export interface GardenState {
  pots: Pot[]
  blooms: Record<string, number>
}

export interface CareState {
  pup: PupState
  garden: GardenState
}

export const DEFAULT_PUP: PupState = {
  name: 'Bubbles',
  adoptedAt: 0,
  fullness: 80,
  cleanliness: 80,
  happiness: 80,
  bond: 0,
  lastTick: '',
  lastFed: '',
  lastBrushed: '',
  lastWalked: '',
  lastPlayed: '',
  lastCuddled: '',
  lastTreated: '',
}

export const DEFAULT_CARE: CareState = {
  pup: DEFAULT_PUP,
  garden: { pots: [], blooms: {} },
}

function num(v: unknown, d: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d
}

function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export function normalizeCare(raw: unknown): CareState {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const p = (c.pup && typeof c.pup === 'object' ? c.pup : {}) as Record<string, unknown>
  const pup: PupState = {
    name: str(p.name, DEFAULT_PUP.name) || DEFAULT_PUP.name,
    adoptedAt: num(p.adoptedAt, 0),
    fullness: num(p.fullness, 80),
    cleanliness: num(p.cleanliness, 80),
    happiness: num(p.happiness, 80),
    bond: num(p.bond, 0),
    lastTick: str(p.lastTick),
    lastFed: str(p.lastFed),
    lastBrushed: str(p.lastBrushed),
    lastWalked: str(p.lastWalked),
    lastPlayed: str(p.lastPlayed),
    lastCuddled: str(p.lastCuddled),
    lastTreated: str(p.lastTreated),
  }

  const g = (c.garden && typeof c.garden === 'object' ? c.garden : {}) as Record<
    string,
    unknown
  >
  let pots: Pot[]
  if (Array.isArray(g.pots)) {
    pots = g.pots
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        const o = x as Record<string, unknown>
        return {
          id: str(o.id) || uid(),
          flower: str(o.flower, '🌷') || '🌷',
          plantedAt: num(o.plantedAt, 0),
          growth: num(o.growth, 0),
          lastWatered: str(o.lastWatered),
          waterDays: strArr(o.waterDays),
          lastFertilized: str(o.lastFertilized),
          bestStreak: num(o.bestStreak, 0),
        }
      })
  } else if (g.planted) {
    const waterDays = strArr(g.waterDays)
    pots = [
      {
        id: 'pot-legacy',
        flower: '🌷',
        plantedAt: num(g.plantedAt, 0),
        growth: Math.max(1, waterDays.length),
        lastWatered: str(g.lastWatered),
        waterDays,
        lastFertilized: '',
        bestStreak: num(g.bestStreak, waterDays.length),
      },
    ]
  } else {
    pots = []
  }

  const blooms: Record<string, number> = {}
  if (g.blooms && typeof g.blooms === 'object' && !Array.isArray(g.blooms)) {
    for (const [k, v] of Object.entries(g.blooms as Record<string, unknown>)) {
      const n = num(v, 0)
      if (n > 0) blooms[k] = n
    }
  }

  return { pup, garden: { pots, blooms } }
}

export const uid = () => Math.random().toString(36).slice(2, 10)