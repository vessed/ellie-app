import { useApp, todayKey } from './store'
import { normalizeCare, uid } from './types'
import type { CareState, Pot, PupState } from './types'

function parseDay(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

function dayKeyOf(ms: number): string {
  const d = new Date(ms)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

function daysBetween(from: string, to: string): number {
  if (!from) return 0
  const ms = parseDay(to) - parseDay(from)
  return Math.max(0, Math.round(ms / 86_400_000))
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

function decayPup(pup: PupState, today: string): PupState {
  const days = daysBetween(pup.lastTick || today, today)
  if (days <= 0) return pup
  return {
    ...pup,
    fullness: clamp(pup.fullness - 20 * days),
    cleanliness: clamp(pup.cleanliness - 14 * days),
    happiness: clamp(pup.happiness - 16 * days),
    lastTick: today,
  }
}

export function pupMood(pup: PupState): { emoji: string; label: string } {
  const avg = (pup.fullness + pup.cleanliness + pup.happiness) / 3
  if (avg >= 75) return { emoji: '😄', label: 'over the moon!' }
  if (avg >= 50) return { emoji: '🙂', label: 'doing great' }
  if (avg >= 30) return { emoji: '🥺', label: 'needs some love' }
  return { emoji: '😢', label: 'really missing you' }
}

export const BOND_TIERS = [
  { at: 0, title: 'New Friends' },
  { at: 40, title: 'Buddy' },
  { at: 110, title: 'Best Friend' },
  { at: 220, title: 'Soulmate' },
  { at: 380, title: 'Family' },
  { at: 600, title: 'Forever Friends' },
]

export function bondInfo(xp: number): {
  level: number
  title: string
  next: number | null
  progress: number
} {
  let level = 0
  for (let i = 0; i < BOND_TIERS.length; i++) if (xp >= BOND_TIERS[i].at) level = i
  const cur = BOND_TIERS[level]
  const nextTier = BOND_TIERS[level + 1] ?? null
  const progress = nextTier ? (xp - cur.at) / (nextTier.at - cur.at) : 1
  return {
    level: level + 1,
    title: cur.title,
    next: nextTier ? nextTier.at : null,
    progress: Math.max(0, Math.min(1, progress)),
  }
}

export const FLOWERS = ['🌷', '🌻', '🌹', '🌸', '🪻', '🌼']
export const MAX_POTS = 4
export const BLOOM_GROWTH = 5

export function potStage(
  growth: number,
  flower: string,
): { emoji: string; label: string } {
  if (growth <= 0) return { emoji: '🌰', label: 'a sleepy little seed' }
  if (growth === 1) return { emoji: '🌱', label: 'a tiny sprout' }
  if (growth === 2) return { emoji: '🌿', label: 'growing leaves' }
  if (growth === 3) return { emoji: '🌿', label: 'getting tall' }
  if (growth === 4) return { emoji: '🌿', label: 'a little bud' }
  return { emoji: flower, label: 'in full bloom!' }
}

export function potStreak(pot: Pot, today: string): number {
  const set = new Set(pot.waterDays)
  let d = today
  if (!set.has(d)) d = shiftDay(today, -1)
  let streak = 0
  while (set.has(d)) {
    streak++
    d = shiftDay(d, -1)
  }
  return streak
}

export interface CareTask {
  id: string
  label: string
  done: boolean
}

export interface CarePot extends Pot {
  streak: number
  stage: { emoji: string; label: string }
  wateredToday: boolean
  fertilizedToday: boolean
  ready: boolean
}

const PUP_XP = { feed: 3, brush: 3, walk: 3, play: 4, cuddle: 3, treat: 2 }

export function useCare() {
  const { care: raw, setCare, pushToast } = useApp()
  const today = todayKey()

  const care = normalizeCare(raw)
  const pup = decayPup(care.pup, today)
  const bond = bondInfo(pup.bond)

  const update = (fn: (c: CareState) => CareState) =>
    setCare((c) => fn(normalizeCare(c)))

  const gainBond = (xp: number) => {
    const after = bondInfo(pup.bond + xp)
    if (after.level > bond.level) {
      pushToast(`${pup.name} grew closer to you — now ${after.title}!`, '💞')
    }
  }

  const fedToday = pup.lastFed === today
  const brushedToday = pup.lastBrushed === today
  const walkedToday = pup.lastWalked === today
  const playedToday = pup.lastPlayed === today
  const cuddledToday = pup.lastCuddled === today
  const treatedToday = pup.lastTreated === today
  const daysTogether = pup.adoptedAt ? daysBetween(dayKeyOf(pup.adoptedAt), today) : 0

  const feed = () => {
    if (fedToday) return
    const now = Date.now()
    gainBond(PUP_XP.feed)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          fullness: clamp(p.fullness + 40),
          happiness: clamp(p.happiness + 5),
          bond: p.bond + PUP_XP.feed,
          lastFed: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const brush = () => {
    if (brushedToday) return
    const now = Date.now()
    gainBond(PUP_XP.brush)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          cleanliness: clamp(p.cleanliness + 45),
          happiness: clamp(p.happiness + 5),
          bond: p.bond + PUP_XP.brush,
          lastBrushed: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const walk = () => {
    if (walkedToday) return
    const now = Date.now()
    gainBond(PUP_XP.walk)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          happiness: clamp(p.happiness + 35),
          fullness: clamp(p.fullness - 8),
          bond: p.bond + PUP_XP.walk,
          lastWalked: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const play = () => {
    if (playedToday) return
    const now = Date.now()
    gainBond(PUP_XP.play)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          happiness: clamp(p.happiness + 30),
          fullness: clamp(p.fullness - 10),
          bond: p.bond + PUP_XP.play,
          lastPlayed: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const cuddle = () => {
    if (cuddledToday) return
    const now = Date.now()
    gainBond(PUP_XP.cuddle)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          happiness: clamp(p.happiness + 18),
          bond: p.bond + PUP_XP.cuddle,
          lastCuddled: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const treat = () => {
    if (treatedToday) return
    const now = Date.now()
    gainBond(PUP_XP.treat)
    update((c) => {
      const p = decayPup(c.pup, today)
      return {
        ...c,
        pup: {
          ...p,
          fullness: clamp(p.fullness + 25),
          happiness: clamp(p.happiness + 8),
          bond: p.bond + PUP_XP.treat,
          lastTreated: today,
          adoptedAt: c.pup.adoptedAt || now,
        },
      }
    })
  }

  const rename = (name: string) => {
    const n = name.trim().slice(0, 20)
    if (!n || n === pup.name) return
    update((c) => ({ ...c, pup: { ...c.pup, name: n } }))
  }

  const pots: CarePot[] = care.garden.pots.map((pot) => ({
    ...pot,
    streak: potStreak(pot, today),
    stage: potStage(pot.growth, pot.flower),
    wateredToday: pot.lastWatered === today,
    fertilizedToday: pot.lastFertilized === today,
    ready: pot.growth >= BLOOM_GROWTH,
  }))
  const canPlant = care.garden.pots.length < MAX_POTS
  const blooms = care.garden.blooms
  const bouquet = Object.values(blooms).reduce((a, b) => a + b, 0)

  const plantPot = (flower: string) => {
    if (care.garden.pots.length >= MAX_POTS) return
    const now = Date.now()
    gainBond(4)
    update((c) => {
      if (c.garden.pots.length >= MAX_POTS) return c
      const pot: Pot = {
        id: uid(),
        flower,
        plantedAt: now,
        growth: 1,
        lastWatered: today,
        waterDays: [today],
        lastFertilized: '',
        bestStreak: 1,
      }
      return { ...c, garden: { ...c.garden, pots: [...c.garden.pots, pot] } }
    })
  }

  const waterPot = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (!pot || pot.wateredToday) return
    gainBond(3)
    update((c) => {
      const next = c.garden.pots.map((p) => {
        if (p.id !== id || p.lastWatered === today) return p
        const waterDays = Array.from(new Set([...p.waterDays, today])).sort()
        const s = potStreak({ ...p, waterDays }, today)
        return {
          ...p,
          growth: p.growth + 1,
          lastWatered: today,
          waterDays,
          bestStreak: Math.max(p.bestStreak, s),
        }
      })
      return { ...c, garden: { ...c.garden, pots: next } }
    })
  }

  const fertilizePot = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (!pot || pot.fertilizedToday) return
    gainBond(2)
    update((c) => {
      const next = c.garden.pots.map((p) =>
        p.id === id && p.lastFertilized !== today
          ? { ...p, growth: p.growth + 1, lastFertilized: today }
          : p,
      )
      return { ...c, garden: { ...c.garden, pots: next } }
    })
  }

  const harvestPot = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (!pot || !pot.ready) return
    gainBond(12)
    update((c) => {
      const target = c.garden.pots.find((p) => p.id === id)
      if (!target || target.growth < BLOOM_GROWTH) return c
      const nextBlooms = {
        ...c.garden.blooms,
        [target.flower]: (c.garden.blooms[target.flower] ?? 0) + 1,
      }
      return {
        ...c,
        garden: {
          pots: c.garden.pots.filter((p) => p.id !== id),
          blooms: nextBlooms,
        },
      }
    })
  }

  const uprootPot = (id: string) =>
    update((c) => ({
      ...c,
      garden: { ...c.garden, pots: c.garden.pots.filter((p) => p.id !== id) },
    }))

  const pupTasks: CareTask[] = [
    { id: 'feed', label: 'Feed 🍖', done: fedToday },
    { id: 'brush', label: 'Brush 🛁', done: brushedToday },
    { id: 'walk', label: 'Walk 🦮', done: walkedToday },
    { id: 'play', label: 'Play 🎾', done: playedToday },
    { id: 'cuddle', label: 'Cuddle 🫂', done: cuddledToday },
    { id: 'treat', label: 'Treat 🍬', done: treatedToday },
  ]
  const gardenTasks: CareTask[] = [
    ...pots.flatMap((p) => [
      { id: `water-${p.id}`, label: `Water ${p.stage.emoji}`, done: p.wateredToday },
      {
        id: `fert-${p.id}`,
        label: `Fertilize ${p.stage.emoji}`,
        done: p.fertilizedToday,
      },
    ]),
    ...(canPlant ? [{ id: 'plant', label: 'Plant a seed 🌰', done: false }] : []),
  ]

  return {
    pup,
    mood: pupMood(pup),
    daysTogether,
    bond,
    fedToday,
    brushedToday,
    walkedToday,
    playedToday,
    cuddledToday,
    treatedToday,
    feed,
    brush,
    walk,
    play,
    cuddle,
    treat,
    rename,
    pots,
    canPlant,
    blooms,
    bouquet,
    maxPots: MAX_POTS,
    bloomGrowth: BLOOM_GROWTH,
    flowers: FLOWERS,
    plantPot,
    waterPot,
    fertilizePot,
    harvestPot,
    uprootPot,
    pupTasks,
    gardenTasks,
  }
}
