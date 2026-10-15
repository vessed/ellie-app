import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ensureBuiltinMusic } from './builtin'
import {
  DEFAULT_CARE,
  normalizeCare,
  uid,
  WHO_NAME,
  type AppAlert,
  type Artwork,
  type CareState,
  type CustomEmoji,
  type CustomPage,
  type DateItem,
  type DailyPhoto,
  type HeartEvent,
  type JournalPage,
  type MemoryItem,
  type Mood,
  type NoteItem,
  type Playlist,
  type PlayState,
  type Presence,
  type Profiles,
  type Route,
  type RuleItem,
  type Song,
  type Theme,
  type TreatItem,
  type TreatRequest,
  type TodoDay,
  type TodoDayLog,
  type TodoTask,
  type Who,
  type WishItem,
} from './types'
import { playHeart, playMood, playPing } from './sound'
import { idbGet, idbSet } from './idb'
import { useToasts } from './toast'
import {
  SHARED_KEYS,
  type SharedKey,
  type SyncBundle,
  type SyncCfg,
  type SyncStatus,
  emptyCfg,
  fetchRoom,
  idsOf,
  makeClient,
  mergeBundles,
  pushRoom,
  roomKeyOK,
} from './sync'
import type { SupabaseClient } from '@supabase/supabase-js'

/* localStorage writes are coalesced: typing or dragging shouldn't hit the disk
   on every keystroke/frame. We debounce briefly, then flush the latest value if
   the app is hidden or closed so nothing is ever lost. */
const PERSIST_DEBOUNCE_MS = 220
const pendingWrites = new Map<string, () => void>()
let flushBound = false

function flushPendingWrites() {
  for (const flush of pendingWrites.values()) flush()
}

function bindFlushOnce() {
  if (flushBound || typeof window === 'undefined') return
  flushBound = true
  window.addEventListener('pagehide', flushPendingWrites)
  window.addEventListener('beforeunload', flushPendingWrites)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPendingWrites()
  })
}

/* Every value is written to localStorage for fast sync reads and mirrored to
   IndexedDB, which survives the eviction that can wipe localStorage on iOS. */
function writeThrough(key: string, json: string) {
  try {
    localStorage.setItem(key, json)
  } catch {
    /* ignore */
  }
  idbSet(key, json)
}

function readStored<T>(key: string, migrate?: (v: T) => T): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) return migrate ? migrate(JSON.parse(raw) as T) : (JSON.parse(raw) as T)
  } catch {
    /* ignore */
  }
  return undefined
}

function usePersist<T>(key: string, initial: T, migrate?: (v: T) => T) {
  const [val, setVal] = useState<T>(() => readStored(key, migrate) ?? initial)
  const hadStored = useRef<boolean>(
    (() => {
      try {
        return localStorage.getItem(key) !== null
      } catch {
        return true
      }
    })(),
  )
  const [hydrated, setHydrated] = useState(hadStored.current)
  const valRef = useRef(val)

  /* If localStorage was empty (fresh device, or iOS evicted it), restore the
     last good value from the IndexedDB mirror before we start writing. */
  useEffect(() => {
    if (hadStored.current) return
    let alive = true
    idbGet(key)
      .then((raw) => {
        if (!alive || raw == null) return
        try {
          setVal(migrate ? migrate(JSON.parse(raw) as T) : (JSON.parse(raw) as T))
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setHydrated(true)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  /* Debounced write — resets on each change, so a burst of edits = one write. */
  useEffect(() => {
    valRef.current = val
    if (!hydrated) return
    const json = JSON.stringify(val)
    const timer = window.setTimeout(() => writeThrough(key, json), PERSIST_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [key, val, hydrated])

  /* Flush synchronously when the app is hidden or closed. */
  useEffect(() => {
    if (!hydrated) return
    bindFlushOnce()
    const flush = () => writeThrough(key, JSON.stringify(valRef.current))
    pendingWrites.set(key, flush)
    return () => {
      flush()
      pendingWrites.delete(key)
    }
  }, [key, hydrated])

  return [val, setVal] as const
}

const seedSongs: Song[] = [
  {
    id: 'sg1',
    title: 'Cozy Little Loop',
    artist: 'Ellie & You',
    kind: 'youtube',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
  },
  {
    id: 'sg2',
    title: 'Sunny Morning Drive',
    artist: 'Ellie & You',
    kind: 'youtube',
    url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y',
  },
]

const seedPlaylists: Playlist[] = [
  { id: 'pl1', name: 'Our Vibes', emoji: '🎧', songIds: ['sg1', 'sg2'] },
  { id: 'pl2', name: 'Sleepy Soft', emoji: '🌙', songIds: [] },
]

const seedDates: DateItem[] = []

const seedMemories: MemoryItem[] = []

const seedTreats: TreatItem[] = []

const seedNotes: NoteItem[] = [
  {
    id: 'seed-note-1',
    body: 'Good morning cutie — thinking about you already 💗',
    from: 'ellie',
    to: 'you',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    read: false,
    saved: false,
  },
]

const seedRules: RuleItem[] = [
  '"Bingo" is our communication word and you may use it when you wanna talk about something important',
  "Always talk to me about your feelings and if something happens you don't like",
  'You must eat at least 2 meals a day (your body needs nutrition) and drink lots of water',
  'Do something productive everyday, examples: cleaning up your room, baking something, going for a walk',
  "Don't lie to me about anything, even if it's silly or you think its embarrassing, I can always tell when you aren't being truthful",
  'NO talking bad about yourself, I want you taking in positive thoughts about yourself',
  'If you need reassurance about anything, talk to daddy',
  "Always say I love you back to daddy if he says he loves you, even if you're mad or upset",
  "If you're upset and want a break, tell me before you leave",
  'Communication means very much to daddy, so always talk about your feelings',
  "Even when you feel like the world is against you, I'm always for you",
  'You must get at least 8 hours of sleep everyday',
  'Ellie is always allowed to do anything she wants, just make sure you check in with me first',
  "If I'm correcting a behavior of yours, I'm not mad. Sometimes daddy knows more than you do and he wants to help you",
  'Silent treatment is never the option, you talk about what you want and need before you act on it',
  'If you need something, come to me as your first option',
  'Crying is always okay and puppy will never be shamed or put down for having emotions',
  'Keep up on taking care of yourself, examples: cleaning your body once a day, brush your teeth at least once a day, if you do something dirty in clothes; change them, keep your room cleaned',
  'Bedtimes for my baby — Weekdays: 2 AM, Weekends: 4 AM',
].map((text, i) => ({ id: `rule-${i + 1}`, text }))

const seedReminders: RuleItem[] = [
  'Rules can always be talked about and changed if puppy feels like something is unfair',
  'No is always an answer, no matter the situation',
  "I love you very much and I'll always be here for you",
  'You will always be my beautiful little girl',
  'Daddy loves when puppy takes baths and plays with her toys',
].map((text, i) => ({ id: `reminder-${i + 1}`, text }))

const seedDailyReminders: RuleItem[] = [
  'You are so loved today, puppy 💗',
  'Drink some water and stretch your cute little body!',
  'Take a deep breath — you are doing amazing.',
  'You are daddy’s favorite girl, every single day 🎀',
  'Eat something yummy today — your body deserves it! 🍓',
  'Tiny steps still count. You are doing better than you think ✨',
  'Put on something comfy and give yourself a little break 🧸',
  'You are allowed to rest, puppy. Being tired is not a failure 💤',
  'Give yourself a big hug from daddy today 🤗',
  'Drink some more water, sweet girl — daddy is checking! 💧',
  'You make the world softer just by being in it 🌸',
  'Smile at yourself in the mirror — daddy thinks you are adorable 🪞',
  'It is okay to have a slow day. I am proud of you either way 🌷',
  'You are safe, you are loved, and you are never a burden 💖',
  'Take five minutes to do something that makes you happy today 🎈',
  'You do not have to be perfect to be daddy’s whole world 🌟',
  'Stretch, breathe, and remember you are doing so well 🫧',
  'Your feelings always matter, even the messy ones 🫂',
  'Be extra gentle with yourself today, puppy 🌼',
  'I am so proud of you for getting through today 💐',
  'Little one, you are exactly where you are meant to be 🌈',
  'Have a snack and a cuddle — you have earned both 🍪',
  'You are stronger than you know and softer than you think 🎀',
  'Remember: daddy is always only a message away 💌',
  'Put your phone down for a moment and just breathe 🌿',
  'You are not too much, and you are never too little 🧸',
  'Wear your favorite outfit just because today 🎀',
  'Your best today is more than enough, my love 💗',
  'Take a warm shower and let the day wash away 🛁',
  'You deserve good things, puppy — let yourself have them ✨',
  'One kind thing to yourself today, that is all I ask 🌷',
  'Rest your head, close your eyes, and know you are loved 🌙',
  'Dance to one song today — it is good for the soul 🎵',
  'Look how far you have come, sweet girl 🌟',
  'Good morning, little one — daddy is so happy you are here ☀️',
  'Little one, you are the sweetest part of my every day 🍯',
  'Hey little girl, did you drink your water today? 💧',
  'My little girl, you are allowed to just be small and cozy today 🧸',
  'Little one, whatever today holds, daddy loves you the same 💗',
  'Come here, little girl — imagine a big warm hug from daddy 🤗',
  'You are daddy’s little one, and nothing will ever change that 🎀',
  'Little girl, you are so brave even on the days you don’t feel it 🌈',
  'Little one, take a break and let yourself be taken care of 🫖',
  'Sweet little girl, you deserve all the softest things in the world 🌸',
  'Little one, you are growing so well and daddy is so proud 🌱',
  'Even on a grumpy day, you are still daddy’s perfect little girl 💖',
  'Little one, it’s okay to ask for help — that is what daddy is for 💌',
  'You are a good little girl, and you are doing a wonderful job 🥰',
  'Little one, find one tiny thing to smile about today 🎈',
  'My little girl, rest your head and let the world wait for a bit 🌙',
  'Good morning, sweetie — I hope today is gentle with you ☀️',
  'Sweetie, you are the first thing I think about in the morning 💗',
  'Hey sweetie, have you eaten something nice today? 🍓',
  'Sweetie, you make everything better just by being you 🌷',
  'Take a little break, sweetie — you have earned it 🫖',
  'Sweetie, you are so much stronger than you give yourself credit for 🌟',
  'Have a glass of water for me, sweetie 💧',
  'Sweetie, I am so proud of the person you are 🥰',
  'Come here, sweetheart — imagine the warmest hug from daddy 🤗',
  'Sweetheart, you are loved more than words can say 💞',
  'Goodnight, sweetheart — sleep cozy and know you are safe 🌙',
  'Sweetheart, you are allowed to take up space and ask for what you need 🎀',
  'My sweetheart, rest your eyes for a while — the world can wait 🌸',
  'Sweetheart, whatever today looked like, I am still so glad you are mine 💖',
  'Sweetheart, do one kind thing for yourself today, just one 🍪',
  'Remember, sweetheart: you are never a burden and never too much 🧸',
  'Good morning, bunny — hop into today gently and at your own pace 🐰',
  'Bunny, don’t forget to eat something nice and drink your water 🥕',
  'You are so soft and sweet, bunny — daddy adores you 🐇',
  'Little bunny, it is okay to take today slow and cozy 🧺',
  'Baby, you are the most precious thing in daddy’s whole world 👶',
  'Come here, baby — imagine the biggest, warmest cuddle 🤍',
  'Baby, take good care of yourself for me today — eat, drink, rest 🌷',
  'Daddy’s baby, you are so loved it is impossible to measure 💗',
  'Good morning, gorgeous — you look lovely even when you just woke up ☀️',
  'Gorgeous, take a second to admire how pretty you are today 💄',
  'You are absolutely gorgeous, inside and out — never forget it ✨',
  'Hey gorgeous, do one little thing that makes you feel pretty today 🎀',
  'Little one, you are growing so well and daddy could not be prouder 🌱',
  'My little one, you are allowed to be small and held today 🧸',
  'Little girl, you are so brave even on the days you do not feel brave 🌈',
  'My little girl, come rest your head — daddy has you 🤍',
].map((text, i) => ({ id: `daily-reminder-${i + 1}`, text }))

/* Per-key sync timestamps from the last session, so relaunching the app doesn't
   rebaseline every value as "newest" and clobber the other device's changes. */
interface PersistedSync {
  room: string
  keys: Record<string, { t: number; del?: string[]; delT?: Record<string, number> }>
}
const SYNC_META_KEY = 'ellie-sync-meta'

/* Known routes so a persisted view survives app updates that remove a page. */
const VALID_ROUTES: Route[] = [
  'home',
  'daily',
  'dates',
  'memories',
  'treats',
  'notes',
  'music',
  'wishlist',
  'mood',
  'todo',
  'rules',
  'playroom',
  'library',
  'settings',
]

export function todayKey(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

interface AppContextValue {
  route: Route
  setRoute: (r: Route) => void
  as: Who
  setAs: (w: Who) => void
  theme: Theme
  setTheme: (t: Theme) => void

  anniversary: string
  setAnniversary: (a: string) => void

  dates: DateItem[]
  setDates: (d: DateItem[] | ((prev: DateItem[]) => DateItem[])) => void
  memories: MemoryItem[]
  setMemories: (m: MemoryItem[] | ((prev: MemoryItem[]) => MemoryItem[])) => void
  treats: TreatItem[]
  setTreats: (t: TreatItem[] | ((prev: TreatItem[]) => TreatItem[])) => void
  treatRequests: TreatRequest[]
  setTreatRequests: (
    r: TreatRequest[] | ((prev: TreatRequest[]) => TreatRequest[]),
  ) => void
  notes: NoteItem[]
  setNotes: (n: NoteItem[] | ((prev: NoteItem[]) => NoteItem[])) => void
  alerts: AppAlert[]
  setAlerts: (a: AppAlert[] | ((prev: AppAlert[]) => AppAlert[])) => void
  sendAlert: (to: Who, body: string) => void
  songs: Song[]
  setSongs: (s: Song[] | ((prev: Song[]) => Song[])) => void
  playlists: Playlist[]
  setPlaylists: (p: Playlist[] | ((prev: Playlist[]) => Playlist[])) => void

  hearts: number
  addHeart: () => void

  heartEvents: HeartEvent[]
  setHeartEvents: (h: HeartEvent[] | ((prev: HeartEvent[]) => HeartEvent[])) => void

  profiles: Profiles
  setProfile: (who: Who, src: string) => void

  presence: Presence

  wishes: WishItem[]
  setWishes: (w: WishItem[] | ((prev: WishItem[]) => WishItem[])) => void

  customEmojis: CustomEmoji[]
  setCustomEmojis: (e: CustomEmoji[] | ((prev: CustomEmoji[]) => CustomEmoji[])) => void

  moods: Mood[]
  updateMood: (emoji: string, label: string, note: string) => void

  todoRoutine: TodoTask[]
  setTodoRoutine: (t: TodoTask[] | ((prev: TodoTask[]) => TodoTask[])) => void
  todoDay: TodoDay
  setTodoDay: (d: TodoDay | ((prev: TodoDay) => TodoDay)) => void
  todoLog: TodoDayLog[]
  setTodoLog: (l: TodoDayLog[] | ((prev: TodoDayLog[]) => TodoDayLog[])) => void

  artworks: Artwork[]
  setArtworks: (a: Artwork[] | ((prev: Artwork[]) => Artwork[])) => void

  customPages: CustomPage[]
  setCustomPages: (c: CustomPage[] | ((prev: CustomPage[]) => CustomPage[])) => void

  journal: JournalPage[]
  setJournal: (j: JournalPage[] | ((prev: JournalPage[]) => JournalPage[])) => void
  setJournalPage: (who: Who, page: number, text: string) => void

  rules: RuleItem[]
  setRules: (r: RuleItem[] | ((prev: RuleItem[]) => RuleItem[])) => void
  reminders: RuleItem[]
  setReminders: (r: RuleItem[] | ((prev: RuleItem[]) => RuleItem[])) => void
  dailyReminders: RuleItem[]
  setDailyReminders: (r: RuleItem[] | ((prev: RuleItem[]) => RuleItem[])) => void
  dailyPhoto: DailyPhoto
  setDailyPhoto: (p: DailyPhoto) => void

  points: number
  setPoints: (v: number | ((prev: number) => number)) => void

  play: PlayState
  setPlay: (p: PlayState | ((prev: PlayState) => PlayState)) => void

  care: CareState
  setCare: (c: CareState | ((prev: CareState) => CareState)) => void

  syncCfg: SyncCfg
  setSyncCfg: (c: SyncCfg) => void
  syncStatus: SyncStatus
  syncNow: () => void
  unsync: () => void

  pushToast: (message: string, emoji?: string, action?: () => void) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { pushToast } = useToasts()
  const [route, setRoute] = usePersist<Route>('ellie-route', 'home', (v) =>
    VALID_ROUTES.includes(v) ? v : 'home',
  )
  const [as, setAs] = usePersist<Who>('ellie-as', 'you', (v) =>
    v === 'ellie' || v === 'you' ? v : 'you',
  )
  const [theme, setTheme] = usePersist<Theme>('ellie-theme', 'blush')
  const [anniversary, setAnniversary] = usePersist<string>(
    'ellie-anniversary',
    '',
  )

  const [dates, setDates] = usePersist<DateItem[]>(
    'ellie-dates',
    seedDates,
    (v) => v.filter((d) => !d.id.startsWith('seed-')),
  )
  const [memories, setMemories] = usePersist<MemoryItem[]>(
    'ellie-memories',
    seedMemories,
    (v) => v.filter((m) => !m.id.startsWith('seed-')),
  )
  const [treats, setTreats] = usePersist<TreatItem[]>(
    'ellie-treats',
    seedTreats,
    (v) => v.filter((t) => !t.id.startsWith('seed-')),
  )
  const [treatRequests, setTreatRequests] = usePersist<TreatRequest[]>(
    'ellie-treat-requests',
    [],
  )
  const [notes, setNotes] = usePersist<NoteItem[]>('ellie-notes', seedNotes)
  const [alerts, setAlerts] = usePersist<AppAlert[]>('ellie-alerts', [])
  const sendAlert = (to: Who, body: string) => {
    setAlerts((prev) =>
      [{ id: uid(), to, body, createdAt: Date.now() }, ...prev].slice(0, 40),
    )
  }
  const [songs, setSongs] = usePersist<Song[]>('ellie-songs', seedSongs)
  const [playlists, setPlaylists] = usePersist<Playlist[]>(
    'ellie-playlists',
    seedPlaylists,
  )

  useEffect(() => {
    ensureBuiltinMusic(songs, playlists, setSongs, setPlaylists)
  }, [songs, playlists])

  const [hearts, setHearts] = usePersist<number>('ellie-hearts', 0)
  const [heartEvents, setHeartEvents] = usePersist<HeartEvent[]>(
    'ellie-hearts-log',
    [],
  )
  const addHeart = () => {
    setHearts((h) => h + 1)
    setHeartEvents((prev) =>
      [
        { id: uid(), from: as, createdAt: Date.now() },
        ...prev,
      ].slice(0, 80),
    )
    playHeart()
  }

  const [profiles, setProfiles] = usePersist<Profiles>('ellie-profiles', {})
  const setProfile = (who: Who, src: string) =>
    setProfiles((prev) => ({ ...prev, [who]: { src, ts: Date.now() } }))

  /* Presence: this device stamps its own last-seen time on a short heartbeat so
     the other device can show an online / "last seen" indicator. */
  const [presence, setPresence] = usePersist<Presence>('ellie-presence', {})
  useEffect(() => {
    const beat = () => setPresence((p) => ({ ...p, [as]: Date.now() }))
    beat()
    const iv = window.setInterval(beat, 20_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') beat()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', beat)
    return () => {
      window.clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', beat)
    }
  }, [as, setPresence])

  const [wishes, setWishes] = usePersist<WishItem[]>('ellie-wishes', [])
  const [customEmojis, setCustomEmojis] = usePersist<CustomEmoji[]>(
    'ellie-custom-emojis',
    [],
  )

  const [moods, setMoods] = usePersist<Mood[]>('ellie-moods', [])
  const updateMood = (emoji: string, label: string, note: string) => {
    setMoods((prev) => [
      ...prev.filter((m) => m.who !== as),
      { id: uid(), who: as, emoji, label, note: note.trim(), updatedAt: Date.now() },
    ])
  }

  const [todoRoutine, setTodoRoutine] = usePersist<TodoTask[]>(
    'ellie-todo-routine',
    [],
  )

  const [todoDay, setTodoDay] = usePersist<TodoDay>('ellie-todo-day', {
    id: uid(),
    date: todayKey(),
    routine: {},
    extras: [],
    extraStatus: {},
    rating: 0,
    mood: '',
    completed: false,
  })

  const [todoLog, setTodoLog] = usePersist<TodoDayLog[]>(
    'ellie-todo-log',
    [],
  )

  const [artworks, setArtworks] = usePersist<Artwork[]>('ellie-artworks', [])

  const [customPages, setCustomPages] = usePersist<CustomPage[]>(
    'ellie-custom-pages',
    [],
  )

  const [journal, setJournal] = usePersist<JournalPage[]>('ellie-journal', [])
  const setJournalPage = (who: Who, page: number, text: string) => {
    const id = `journal-${who}-${page}`
    setJournal((prev) => {
      const existing = prev.find((p) => p.id === id)
      if (existing && existing.text === text) return prev
      const entry: JournalPage = { id, who, page, text, updatedAt: Date.now() }
      return existing
        ? prev.map((p) => (p.id === id ? entry : p))
        : [...prev, entry]
    })
  }

  const [rules, setRules] = usePersist<RuleItem[]>('ellie-rules', seedRules)

  const [reminders, setReminders] = usePersist<RuleItem[]>(
    'ellie-reminders',
    seedReminders,
  )

  const [dailyReminders, setDailyReminders] = usePersist<RuleItem[]>(
    'ellie-daily-reminders',
    seedDailyReminders,
    /* One-time: fold the extra default reminders into lists saved before they
       existed, without resurrecting ones the user has since deleted. */
    (v) => {
      try {
        if (localStorage.getItem('ellie-daily-reminders-seed') === '6') return v
        localStorage.setItem('ellie-daily-reminders-seed', '6')
        const have = new Set(v.map((it) => it.text))
        const extra = seedDailyReminders.filter((it) => !have.has(it.text))
        return extra.length ? [...v, ...extra] : v
      } catch {
        return v
      }
    },
  )

  const [dailyPhoto, setDailyPhoto] = usePersist<DailyPhoto>(
    'ellie-daily-photo-v2',
    { date: '', url: '' },
  )

  /* Rolls the daily checklist forward when the clock crosses midnight. */
  useEffect(() => {
    const check = () => {
      const today = todayKey()
      setTodoDay((d) =>
        d.date === today
          ? d
          : {
              id: uid(),
              date: today,
              routine: {},
              extras: [],
              extraStatus: {},
              rating: 0,
              mood: '',
              completed: false,
            },
      )
    }
    check()
    const iv = window.setInterval(check, 60_000)
    return () => window.clearInterval(iv)
  }, [setTodoDay])

  const [points, setPoints] = usePersist<number>('ellie-points', 0, (v) =>
    v === 15 ? 0 : v,
  )

  const [play, setPlay] = usePersist<PlayState>('ellie-play', {
    streak: 0,
    lastChallengeDay: '',
    highScores: {},
  })

  const [careRaw, setCareRaw] = usePersist<CareState>(
    'ellie-care',
    DEFAULT_CARE,
    (v) => normalizeCare(v),
  )
  const care = useMemo(() => normalizeCare(careRaw), [careRaw])
  const setCare = (v: CareState | ((prev: CareState) => CareState)) =>
    setCareRaw((prev) =>
      normalizeCare(typeof v === 'function' ? v(normalizeCare(prev)) : v),
    )

  const [syncCfg, setSyncCfg] = usePersist<SyncCfg>('ellie-sync', emptyCfg)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off')
  const clientRef = useRef<SupabaseClient | null>(null)
  const roomRef = useRef('')
  const sharedRef = useRef<Record<string, SyncBundle>>({})
  const shadowRef = useRef<Record<string, Set<string>>>({})
  const lastPushedRef = useRef('')
  const pushTimerRef = useRef<number | null>(null)
  const pollRef = useRef<(() => void) | null>(null)
  const refreshLocalRef = useRef<() => void>(() => {})
  const schedulePushRef = useRef<() => void>(() => {})
  const prevCfgRef = useRef('')

  const cfgJson = JSON.stringify(syncCfg)
  const cfgChanged = prevCfgRef.current !== cfgJson
  prevCfgRef.current = cfgJson

  /* Latest shared values, readable from the sync interval without re-running it. */
  const sharedValues = useMemo<Record<SharedKey, unknown>>(
    () => ({
      dates,
      memories,
      treats,
      notes,
      songs,
      playlists,
      hearts,
      heartEvents,
      wishes,
      customEmojis,
      points,
      play,
      care,
      anniversary,
      moods,
      todoRoutine,
      todoDay,
      todoLog,
      artworks,
      customPages,
      journal,
      rules,
      reminders,
      dailyReminders,
      dailyPhoto,
      treatRequests,
      alerts,
      presence,
      profiles,
    }),
    [
      dates,
      memories,
      treats,
      notes,
      songs,
      playlists,
      hearts,
      heartEvents,
      wishes,
      customEmojis,
      points,
      play,
      care,
      anniversary,
      moods,
      todoRoutine,
      todoDay,
      todoLog,
      artworks,
      customPages,
      journal,
      rules,
      reminders,
      dailyReminders,
      dailyPhoto,
      treatRequests,
      alerts,
      presence,
      profiles,
    ],
  )
  const valuesRef = useRef(sharedValues)

  useEffect(() => {
    refreshLocalRef.current = () => {}
    schedulePushRef.current = () => {}
    const client = makeClient(syncCfg)
    const room = syncCfg.room.trim()
    if (!client || !room || !roomKeyOK(room)) {
      clientRef.current = null
      roomRef.current = ''
      pollRef.current = null
      setSyncStatus('off')
      return
    }
    clientRef.current = client
    roomRef.current = room
    pollRef.current = () => {}

    /* Restore last session's per-key timestamps (only if the room is unchanged)
       so relaunching keeps this device's own edits newer than remote without
       treating every untouched value as a fresh write that clobbers remote. */
    let restored = false
    try {
      const rawMeta = localStorage.getItem(SYNC_META_KEY)
      if (rawMeta) {
        const meta = JSON.parse(rawMeta) as PersistedSync
        if (meta && meta.room === room && meta.keys) {
          const seeded: Record<string, SyncBundle> = {}
          for (const k of SHARED_KEYS) {
            const m = meta.keys[k]
            if (m && typeof m.t === 'number') {
              seeded[k] = {
                t: m.t,
                v: valuesRef.current[k],
                del: m.del ?? [],
                delT: m.delT ?? {},
              }
            }
          }
          sharedRef.current = seeded
          restored = true
        }
      }
    } catch {
      /* ignore */
    }
    if (!restored) sharedRef.current = {}
    lastPushedRef.current = ''
    /* A value with no stored timestamp is treated as oldest, so on first join the
       existing room wins; genuinely new local edits get Date.now() in refreshLocal. */
    const bootT = 0

    const setters: Record<SharedKey, (v: never) => void> = {
      dates: (v) => setDates(v as never),
      memories: (v) => setMemories(v as never),
      treats: (v) => setTreats(v as never),
      notes: (v) => setNotes(v as never),
      songs: (v) => setSongs(v as never),
      playlists: (v) => setPlaylists(v as never),
      hearts: (v) => setHearts(v as never),
      heartEvents: (v) => setHeartEvents(v as never),
      wishes: (v) => setWishes(v as never),
      customEmojis: (v) => setCustomEmojis(v as never),
      points: (v) => setPoints(v as never),
      play: (v) => setPlay(v as never),
      care: (v) => setCare(v as never),
      anniversary: (v) => setAnniversary(v as never),
      moods: (v) => setMoods(v as never),
      todoRoutine: (v) => setTodoRoutine(v as never),
      todoDay: (v) => setTodoDay(v as never),
      todoLog: (v) => setTodoLog(v as never),
      artworks: (v) => setArtworks(v as never),
      customPages: (v) => setCustomPages(v as never),
      journal: (v) => setJournal(v as never),
      rules: (v) => setRules(v as never),
      reminders: (v) => setReminders(v as never),
      dailyReminders: (v) => setDailyReminders(v as never),
      dailyPhoto: (v) => setDailyPhoto(v as never),
      treatRequests: (v) => setTreatRequests(v as never),
      alerts: (v) => setAlerts(v as never),
      presence: (v) => setPresence(v as never),
      profiles: (v) => setProfiles(v as never),
    }

    const refreshLocal = () => {
      for (const k of SHARED_KEYS) {
        const cur = valuesRef.current[k]
        const prev = sharedRef.current[k]
        /* Fast path: if this key still points at the exact same object we last
           recorded, nothing changed — skip the (potentially large) stringify.
           This keeps the 5s poll and every edit from re-comparing every key. */
        if (prev && prev.v === cur) continue
        if (!prev || JSON.stringify(prev.v) !== JSON.stringify(cur)) {
          const now = Date.now()
          const ids = idsOf(cur)
          const shadow = shadowRef.current[k]
          const removed: string[] = []
          if (shadow) for (const id of shadow) if (!ids.includes(id)) removed.push(id)
          const prevDel = prev?.del ?? []
          const prevDelT = prev?.delT ?? {}
          /* Keep tombstones for ids still gone; drop a tombstone if that id came back. */
          const del = Array.from(
            new Set([...prevDel.filter((id) => !ids.includes(id)), ...removed]),
          )
          const delT: Record<string, number> = {}
          for (const id of del) {
            delT[id] = removed.includes(id) ? now : (prevDelT[id] ?? prev?.t ?? now)
          }
          sharedRef.current = {
            ...sharedRef.current,
            [k]: { t: prev ? now : bootT, v: cur, del, delT },
          }
        }
      }
    }

    const applyToState = (merged: Record<string, SyncBundle>) => {
      for (const k of SHARED_KEYS) {
        const m = merged[k]
        if (!m) continue
        if (JSON.stringify(m.v) !== JSON.stringify(valuesRef.current[k])) {
          setters[k](m.v as never)
        }
      }
    }

    const persistMeta = () => {
      try {
        const keys: PersistedSync['keys'] = {}
        for (const k of SHARED_KEYS) {
          const b = sharedRef.current[k]
          if (b) keys[k] = { t: b.t, del: b.del, delT: b.delT }
        }
        localStorage.setItem(SYNC_META_KEY, JSON.stringify({ room, keys }))
      } catch {
        /* ignore */
      }
    }

    let pushing = false
    const doPush = async () => {
      const c = clientRef.current
      const r = roomRef.current
      if (!c || !r || pushing) return
      pushing = true
      try {
        /* Read-modify-write: fold in remote changes first so a push can never
           silently overwrite the other device's newer data. */
        const remote = await fetchRoom(c, r)
        if (remote) {
          const merged = mergeBundles(sharedRef.current, remote)
          sharedRef.current = merged
          applyToState(merged)
        }
        const payload = sharedRef.current
        const json = JSON.stringify(payload)
        if (json === lastPushedRef.current) {
          setSyncStatus((s) => (s === 'off' ? s : 'synced'))
          return
        }
        const ok = await pushRoom(c, r, payload)
        if (ok) {
          lastPushedRef.current = json
          for (const k of SHARED_KEYS)
            shadowRef.current[k] = new Set(idsOf(payload[k]?.v))
          persistMeta()
          setSyncStatus((s) => (s === 'off' ? s : 'synced'))
        } else {
          setSyncStatus('offline')
        }
      } finally {
        pushing = false
      }
    }

    const schedulePush = () => {
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
      pushTimerRef.current = window.setTimeout(() => void doPush(), 800)
    }

    const poll = async () => {
      const c = clientRef.current
      const r = roomRef.current
      if (!c || !r) return
      refreshLocal()
      const remote = await fetchRoom(c, r)
      if (!remote) {
        void doPush()
        return
      }
      const merged = mergeBundles(sharedRef.current, remote)
      if (JSON.stringify(merged) !== JSON.stringify(sharedRef.current)) {
        sharedRef.current = merged
        applyToState(merged)
      }
      for (const k of SHARED_KEYS)
        shadowRef.current[k] = new Set(idsOf(merged[k]?.v))
      persistMeta()
      if (JSON.stringify(merged) !== lastPushedRef.current) void doPush()
      setSyncStatus('synced')
    }
    refreshLocalRef.current = refreshLocal
    schedulePushRef.current = schedulePush
    pollRef.current = poll

    refreshLocal()
    schedulePush()
    if (cfgChanged) {
      setSyncStatus('connecting')
      void poll()
    }
    const iv = window.setInterval(() => void poll(), 5000)
    return () => {
      window.clearInterval(iv)
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
    }
  }, [syncCfg])

  /* Mirror local changes into the sync shadow + queue a push. Kept separate so
     editing data never rebuilds the Supabase client or the poll interval. */
  useEffect(() => {
    valuesRef.current = sharedValues
    refreshLocalRef.current()
    schedulePushRef.current()
  }, [sharedValues])

  const moodSeenRef = useRef<Record<Who, number>>({ ellie: -1, you: -1 })

  useEffect(() => {
    const other: Who = as === 'you' ? 'ellie' : 'you'
    const entry = moods.find((m) => m.who === other)
    const prev = moodSeenRef.current[other]
    if (prev === -1) {
      moodSeenRef.current = {
        ...moodSeenRef.current,
        [other]: entry ? entry.updatedAt : 0,
      }
      return
    }
    if (entry && entry.updatedAt > prev) {
      moodSeenRef.current = {
        ...moodSeenRef.current,
        [other]: entry.updatedAt,
      }
      playMood()
      pushToast(
        `${WHO_NAME[entry.who]} is feeling ${entry.label} now — let ${
          as === 'ellie' ? 'Daddy' : 'Ellie'
        } know! 💗`,
        '💗',
        () => setRoute('mood'),
      )
    } else if (!entry && prev !== 0) {
      moodSeenRef.current = { ...moodSeenRef.current, [other]: 0 }
    }
  }, [moods, as, setRoute])

  /* Moods fade away after 24 hours so the board never shows stale feelings. */
  useEffect(() => {
    const prune = () => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      setMoods((prev) => {
        const kept = prev.filter((m) => m.updatedAt >= cutoff)
        return kept.length === prev.length ? prev : kept
      })
    }
    prune()
    const iv = window.setInterval(prune, 60_000)
    return () => window.clearInterval(iv)
  }, [setMoods])

  /* Hearts: only the person who *receives* a heart is notified (never the
     sender), so you can't see your own heart as a notification. */
  const heartSeenRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    const ids = new Set(heartEvents.map((h) => h.id))
    const prevSeen = heartSeenRef.current
    heartSeenRef.current = ids
    if (prevSeen === null) return
    const other: Who = as === 'you' ? 'ellie' : 'you'
    const fresh = heartEvents.filter((h) => h.from === other && !prevSeen.has(h.id))
    if (fresh.length === 0) return
    playHeart()
    pushToast(`${WHO_NAME[other]} sent you a heart! 💗`, '💗')
  }, [as, heartEvents])

  /* Note likes: when the other person hearts a note *you* wrote, tell you. */
  const likeSeenRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    const all = new Set<string>()
    for (const n of notes)
      for (const l of n.likes ?? []) all.add(`${n.id}:${l.by}:${l.ts}`)
    const prevSeen = likeSeenRef.current
    likeSeenRef.current = all
    if (prevSeen === null) return
    const other: Who = as === 'you' ? 'ellie' : 'you'
    for (const n of notes) {
      if (n.from !== as) continue
      for (const l of n.likes ?? []) {
        if (l.by === other && !prevSeen.has(`${n.id}:${l.by}:${l.ts}`)) {
          playPing()
          pushToast(`${WHO_NAME[other]} liked your love note! 💗`, '💗', () =>
            setRoute('notes'),
          )
          return
        }
      }
    }
  }, [as, notes, setRoute])

  const syncNow = () => {
    void pollRef.current?.()
  }

  /* Fully detach from the current cloud room: stop polling/pushing and drop the
     credentials. Local data (and its per-key timestamps) is kept, so
     re-connecting to the same room later still treats local edits as newer. */
  const unsync = () => {
    clientRef.current = null
    roomRef.current = ''
    sharedRef.current = {}
    shadowRef.current = {}
    lastPushedRef.current = ''
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
    pushTimerRef.current = null
    pollRef.current = null
    refreshLocalRef.current = () => {}
    schedulePushRef.current = () => {}
    setSyncStatus('off')
    setSyncCfg(emptyCfg)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const seenRef = useRef<Record<Who, Set<string> | null>>({
    ellie: null,
    you: null,
  })

  useEffect(() => {
    const mineNotes = notes.filter((n) => n.to === as)
    const mine = new Set(mineNotes.map((n) => n.id))
    const prevSeen = seenRef.current[as]
    seenRef.current = { ...seenRef.current, [as]: mine }
    if (prevSeen === null) {
      const unread = mineNotes.filter(
        (n) => !n.read && n.kind !== 'system',
      ).length
      if (unread > 0) {
        playPing()
        pushToast(
          `You have ${unread} unread love note${unread > 1 ? 's' : ''}! 💌`,
          '💌',
        )
      }
      return
    }
    const newOnes = mineNotes.filter((n) => !prevSeen.has(n.id))
    const newSystem = newOnes.filter((n) => n.kind === 'system')
    if (newSystem.length > 0) {
      playPing()
      pushToast(newSystem[0].body, '🔔')
    }
    if (newOnes.some((n) => n.kind !== 'system')) {
      playPing()
      pushToast('A new love note just landed for you! 💌', '💌')
    }
  }, [as, notes])

  /* Standalone notifications (not love notes) — drop a pop-up when one lands. */
  const alertSeenRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    const ids = new Set(alerts.map((a) => a.id))
    const prevSeen = alertSeenRef.current
    alertSeenRef.current = ids
    if (prevSeen === null) return
    const fresh = alerts.filter((a) => a.to === as && !prevSeen.has(a.id))
    if (fresh.length === 0) return
    const newest = [...fresh].sort((a, b) => b.createdAt - a.createdAt)[0]
    playPing()
    pushToast(newest.body, '🔔')
  }, [as, alerts])

  useEffect(() => {
    const prune = () => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      setNotes((prev) => {
        const kept = prev.filter(
          (n) =>
            n.saved ||
            n.savedBy?.ellie ||
            n.savedBy?.you ||
            n.createdAt >= cutoff,
        )
        return kept.length === prev.length ? prev : kept
      })
      setAlerts((prev) => {
        const kept = prev.filter((a) => a.createdAt >= cutoff)
        return kept.length === prev.length ? prev : kept
      })
    }
    prune()
    const iv = window.setInterval(prune, 60_000)
    return () => window.clearInterval(iv)
  }, [setNotes, setAlerts])

  const value: AppContextValue = {
    route,
    setRoute,
    as,
    setAs,
    theme,
    setTheme,
    anniversary,
    setAnniversary,
    dates,
    setDates,
    memories,
    setMemories,
    treats,
    setTreats,
    treatRequests,
    setTreatRequests,
    notes,
    setNotes,
    alerts,
    setAlerts,
    sendAlert,
    songs,
    setSongs,
    playlists,
    setPlaylists,
    hearts,
    addHeart,
    heartEvents,
    setHeartEvents,
    profiles,
    setProfile,
    presence,
    wishes,
    setWishes,
    customEmojis,
    setCustomEmojis,
    moods,
    updateMood,
    todoRoutine,
    setTodoRoutine,
    todoDay,
    setTodoDay,
    todoLog,
    setTodoLog,
    artworks,
    setArtworks,
    customPages,
    setCustomPages,
    journal,
    setJournal,
    setJournalPage,
    rules,
    setRules,
    reminders,
    setReminders,
    dailyReminders,
    setDailyReminders,
    dailyPhoto,
    setDailyPhoto,
    points,
    setPoints,
    play,
    setPlay,
    care,
    setCare,
    syncCfg,
    setSyncCfg,
    syncStatus,
    syncNow,
    unsync,
    pushToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}