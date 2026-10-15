import { useEffect, useRef, useState } from 'react'
import { playLose, playTone, playWin } from '../../lib/sound'

type Difficulty = 'easy' | 'medium' | 'hard'

const WORDS: Record<Difficulty, string[]> = {
  easy: [
    'CAT',
    'DOG',
    'SUN',
    'HAT',
    'CUP',
    'BEE',
    'OWL',
    'FOX',
    'SEA',
    'SKY',
    'MOON',
    'STAR',
    'FISH',
    'TREE',
    'BOOK',
    'CAKE',
    'RAIN',
    'SNOW',
    'MILK',
    'BIRD',
    'FROG',
    'BEAR',
    'LION',
    'HAPPY',
    'SMILE',
    'WATER',
    'HOUSE',
    'GREEN',
    'LIGHT',
    'DREAM',
    'MUSIC',
    'SUGAR',
    'CLOUD',
    'BEACH',
    'CANDY',
    'PUPPY',
  ],
  medium: [
    'FLOWER',
    'GARDEN',
    'PUZZLE',
    'YELLOW',
    'MONKEY',
    'PLANET',
    'COOKIE',
    'ORANGE',
    'BANANA',
    'PENCIL',
    'ROCKET',
    'ROBOT',
    'DRAGON',
    'CASTLE',
    'WIZARD',
    'TURTLE',
    'RABBIT',
    'SUMMER',
    'WINTER',
    'AUTUMN',
    'SPRING',
    'KITTEN',
    'DOLPHIN',
    'PENGUIN',
    'RAINBOW',
    'BALLOON',
    'KITCHEN',
    'HARVEST',
    'SPARKLE',
    'WONDER',
  ],
  hard: [
    'BUTTERFLY',
    'CHOCOLATE',
    'ADVENTURE',
    'DANGEROUS',
    'MARSHMALLOW',
    'WATERMELON',
    'ELEPHANT',
    'HARMONICA',
    'BLIZZARD',
    'TELESCOPE',
    'MICROSCOPE',
    'KALEIDOSCOPE',
    'HIPPOPOTAMUS',
    'RASPBERRY',
    'STRAWBERRY',
    'PINEAPPLE',
    'DINOSAUR',
    'ASTRONAUT',
    'BUMBLEBEE',
    'LIGHTHOUSE',
    'SKATEBOARD',
    'FIREWORKS',
    'TREASURE',
    'GYMNASTICS',
    'PHOTOGRAPH',
  ],
}

const DIFFS: { key: Difficulty; label: string; emoji: string }[] = [
  { key: 'easy', label: 'Easy', emoji: '🌱' },
  { key: 'medium', label: 'Medium', emoji: '🌿' },
  { key: 'hard', label: 'Hard', emoji: '🌳' },
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG = 6

export function Hangman({ onFinish }: { onFinish: (score: number) => void }) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [word, setWord] = useState('')
  const [guessed, setGuessed] = useState<string[]>([])
  const [won, setWon] = useState(false)
  const [diff, setDiff] = useState<Difficulty>('easy')

  const doneRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const wrongCount = word
    ? guessed.filter((g) => !word.includes(g)).length
    : 0

  const start = (d: Difficulty) => {
    const pool = WORDS[d]
    const next = pool[Math.floor(Math.random() * pool.length)]
    setDiff(d)
    setWord(next)
    setGuessed([])
    setWon(false)
    doneRef.current = false
    setPhase('playing')
  }

  const guess = (letter: string) => {
    if (phase !== 'playing' || guessed.includes(letter) || doneRef.current)
      return
    const next = [...guessed, letter]
    setGuessed(next)
    const wrong = next.filter((g) => !word.includes(g)).length
    const solved = word.split('').every((c) => next.includes(c))

    if (solved) {
      doneRef.current = true
      setWon(true)
      setPhase('over')
      playWin()
      onFinishRef.current(wrong)
      return
    }
    if (wrong >= MAX_WRONG) {
      doneRef.current = true
      setPhase('over')
      playLose()
      onFinishRef.current(MAX_WRONG)
      return
    }
    if (word.includes(letter)) playTone(660, 0.12, 0.06)
    else playTone(200, 0.16, 0.06, 'square')
  }

  const display = (letter: string) => word.includes(letter)
  const activeDiff = DIFFS.find((d) => d.key === diff) ?? DIFFS[0]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">
          {word ? `${activeDiff.emoji} ${activeDiff.label}` : '🎯 Pick a level'}
        </span>
        <span className="pill">
          {'💗'.repeat(MAX_WRONG - wrongCount)}
          {'🖤'.repeat(wrongCount)}
        </span>
      </div>

      <div className="relative">
        <div className="rounded-3xl border-4 border-blush-400/80 bg-white/45 p-4 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)]">
          <svg viewBox="0 0 220 170" className="mx-auto h-44 w-full max-w-xs">
            <g
              stroke="currentColor"
              className="text-blush-800"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            >
              <line x1="20" y1="160" x2="90" y2="160" />
              <line x1="45" y1="160" x2="45" y2="20" />
              <line x1="45" y1="20" x2="130" y2="20" />
              <line x1="130" y1="20" x2="130" y2="38" />
            </g>
            <g
              stroke="currentColor"
              className="text-blush-600"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            >
              {wrongCount >= 1 && <circle cx="130" cy="52" r="14" />}
              {wrongCount >= 2 && <line x1="130" y1="66" x2="130" y2="112" />}
              {wrongCount >= 3 && <line x1="130" y1="80" x2="108" y2="98" />}
              {wrongCount >= 4 && <line x1="130" y1="80" x2="152" y2="98" />}
              {wrongCount >= 5 && <line x1="130" y1="112" x2="112" y2="140" />}
              {wrongCount >= 6 && <line x1="130" y1="112" x2="148" y2="140" />}
            </g>
          </svg>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {(word || '____').split('').map((c, i) => (
              <span
                key={i}
                className="grid h-9 w-7 place-items-center border-b-2 border-blush-400 font-display text-xl font-extrabold text-blush-800"
              >
                {guessed.includes(c) ? (
                  <span className="animate-pop-in inline-block">{c}</span>
                ) : (
                  ''
                )}
              </span>
            ))}
          </div>
        </div>

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/70 p-4 text-center backdrop-blur-sm">
            <div className="flex flex-col items-center">
              {phase === 'over' && (
                <p className="font-display text-xl font-extrabold text-blush-900">
                  {won
                    ? `You got it! (${wrongCount} misses)`
                    : `The word was ${word}`}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-blush-700/80">
                {phase === 'idle'
                  ? 'Guess the hidden word, letter by letter — pick a level to begin. 💕'
                  : 'Play again — pick a level:'}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {DIFFS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => start(d.key)}
                    className="btn-candy !px-4 !py-2 !text-sm"
                  >
                    {d.emoji} {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
        {LETTERS.map((l) => {
          const used = guessed.includes(l)
          const good = used && display(l)
          return (
            <button
              key={l}
              onClick={() => guess(l)}
              disabled={phase !== 'playing' || used}
              className={`aspect-square rounded-xl text-sm font-extrabold shadow-sm transition ${
                good
                  ? 'animate-pop-in bg-mint-200 text-blush-800'
                  : used
                    ? 'animate-shake bg-blush-200 text-blush-700/50'
                    : 'bg-white/70 text-blush-800 hover:-translate-y-0.5'
              }`}
            >
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}
