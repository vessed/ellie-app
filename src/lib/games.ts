export interface GameInfo {
  key: string
  title: string
  emoji: string
  blurb: string
  higherIsBetter: boolean
  scoreLabel: string
  /* score needed to complete the daily challenge: at least this when
     higherIsBetter, at most this when fewer is better */
  dailyTarget?: number
  /* care-style mini-games: no high score, not eligible for the daily challenge */
  care?: boolean
}

export const GAMES: GameInfo[] = [
  {
    key: 'memory',
    title: 'Memory Match',
    emoji: '🃏',
    blurb: 'Flip the cards and find every matching pair.',
    higherIsBetter: false,
    scoreLabel: 'moves',
    dailyTarget: 24,
  },
  {
    key: 'whack',
    title: 'Whack-a-Pup',
    emoji: '🐹',
    blurb: 'Tap the puppy before it hides — three misses ends it!',
    higherIsBetter: true,
    scoreLabel: 'pups',
    dailyTarget: 12,
  },
  {
    key: 'catch',
    title: 'Catch the Hearts',
    emoji: '💗',
    blurb: 'Slide the basket to catch the falling hearts and stars.',
    higherIsBetter: true,
    scoreLabel: 'points',
    dailyTarget: 15,
  },
  {
    key: 'simon',
    title: 'Simon Says',
    emoji: '🎵',
    blurb: 'Repeat the growing colour and sound pattern.',
    higherIsBetter: true,
    scoreLabel: 'rounds',
    dailyTarget: 5,
  },
  {
    key: 'hangman',
    title: 'Hangman',
    emoji: '🎀',
    blurb: 'Guess the hidden romantic word, letter by letter.',
    higherIsBetter: false,
    scoreLabel: 'misses',
    dailyTarget: 6,
  },
  {
    key: 'snake',
    title: 'Snake',
    emoji: '🐍',
    blurb: 'Guide the hungry snake to every blossom — don’t bite yourself!',
    higherIsBetter: true,
    scoreLabel: 'blossoms',
    dailyTarget: 8,
  },
  {
    key: 'blocks',
    title: 'Block Drop',
    emoji: '🧱',
    blurb: 'Stack the falling blocks and clear complete rows.',
    higherIsBetter: true,
    scoreLabel: 'points',
    dailyTarget: 100,
  },
  {
    key: 'pup',
    title: 'Virtual Pup',
    emoji: '🐶',
    blurb: 'Feed, brush and walk your pup to keep her happy.',
    higherIsBetter: true,
    scoreLabel: 'care',
    care: true,
  },
  {
    key: 'garden',
    title: 'Little Garden',
    emoji: '🌷',
    blurb: 'Water your seed every day and watch it bloom.',
    higherIsBetter: true,
    scoreLabel: 'streak',
    care: true,
  },
]

const CHALLENGE_POOL = GAMES.filter((g) => !g.care)

export function gameByKey(key: string): GameInfo | undefined {
  return GAMES.find((g) => g.key === key)
}

export function challengeGameForDay(day: string): GameInfo {
  let h = 2166136261
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return CHALLENGE_POOL[Math.abs(h) % CHALLENGE_POOL.length]
}

export function rewardText(g: GameInfo): string {
  if (g.care) return 'Care mini-game'
  return g.higherIsBetter
    ? `More ${g.scoreLabel} = higher score`
    : `Fewer ${g.scoreLabel} = higher score`
}

/* Score needed to count the daily challenge as done. */
export function meetsTarget(g: GameInfo, score: number): boolean {
  if (g.dailyTarget === undefined) return true
  return g.higherIsBetter ? score >= g.dailyTarget : score <= g.dailyTarget
}

export function targetText(g: GameInfo): string {
  if (g.dailyTarget === undefined) return ''
  return g.higherIsBetter
    ? `${g.dailyTarget}+ ${g.scoreLabel}`
    : `${g.dailyTarget} or fewer ${g.scoreLabel}`
}
