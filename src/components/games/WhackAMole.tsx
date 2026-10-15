import { useCallback, useEffect, useRef, useState } from 'react'
import { playLose, playPop, playWhack, playWin } from '../../lib/sound'

interface Mole {
  id: number
  hole: number
  born: number
  ttl: number
}

const HOLES = 9
const GAME_MS = 30_000
const MAX_MISSES = 3
const BASE_TTL = 950
/* Extra time after a pup's life ends before it counts as a miss. This gives a
   fair window so a tap that lands right as the pup leaves still counts as a
   hit instead of an unfair miss. */
const GRACE = 160

export function WhackAMole({
  onFinish,
}: {
  onFinish: (score: number) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [moles, setMoles] = useState<Mole[]>([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_MS)
  const [hits, setHits] = useState<{ id: number; hole: number }[]>([])

  const idRef = useRef(0)
  const hitIdRef = useRef(0)
  const molesRef = useRef<Mole[]>([])
  const scoreRef = useRef(0)
  const missesRef = useRef(0)
  const doneRef = useRef(false)
  /* Holes whose pup escaped very recently (hole -> timestamp). Lets us forgive
     a tap that lands a split second after the pup vanished. */
  const escapeRef = useRef<Record<number, number>>({})
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const finish = useCallback((final: number) => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('over')
    if (final <= 0) playLose()
    else playWin()
    onFinishRef.current(final)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const started = Date.now()
    const iv = window.setInterval(() => {
      if (doneRef.current) return
      const now = Date.now()
      const left = GAME_MS - (now - started)
      setTimeLeft(Math.max(0, left))

      let escaped = 0
      const alive: Mole[] = []
      for (const m of molesRef.current) {
        if (now >= m.born + m.ttl + GRACE) {
          escaped++
          escapeRef.current[m.hole] = now
        } else alive.push(m)
      }
      /* A pup running away costs just one heart per tick — never several at
         once — so one miss can't wipe out the whole row of hearts. */
      if (escaped) {
        missesRef.current = Math.min(MAX_MISSES, missesRef.current + 1)
        setMisses(missesRef.current)
        playPop()
      }

      if (alive.length < 2 && Math.random() < 0.5) {
        const occupied = new Set(alive.map((m) => m.hole))
        const free: number[] = []
        for (let i = 0; i < HOLES; i++) if (!occupied.has(i)) free.push(i)
        const hole = free[Math.floor(Math.random() * free.length)]
        const ttl = Math.max(560, BASE_TTL - scoreRef.current * 22)
        alive.push({ id: ++idRef.current, hole, born: now, ttl })
      }
      molesRef.current = alive
      setMoles(alive)

      if (missesRef.current >= MAX_MISSES || left <= 0) {
        finish(scoreRef.current)
      }
    }, 90)
    return () => window.clearInterval(iv)
  }, [phase, finish])

  const start = () => {
    idRef.current = 0
    molesRef.current = []
    scoreRef.current = 0
    missesRef.current = 0
    doneRef.current = false
    escapeRef.current = {}
    setMoles([])
    setScore(0)
    setMisses(0)
    setTimeLeft(GAME_MS)
    setHits([])
    setPhase('playing')
  }

  const whack = (hole: number) => {
    if (phase !== 'playing') return
    const hit = molesRef.current.some((m) => m.hole === hole)
    if (hit) {
      molesRef.current = molesRef.current.filter((m) => m.hole !== hole)
      setMoles(molesRef.current)
      scoreRef.current += 1
      setScore(scoreRef.current)
      hitIdRef.current += 1
      const hid = hitIdRef.current
      setHits((h) => [...h, { id: hid, hole }])
      window.setTimeout(
        () => setHits((h) => h.filter((x) => x.id !== hid)),
        380,
      )
      playWhack()
    } else {
      /* If a pup just left this hole, ignore the tap instead of punishing it. */
      const gone = escapeRef.current[hole]
      if (gone && Date.now() - gone < 260) return
      missesRef.current = Math.min(MAX_MISSES, missesRef.current + 1)
      setMisses(missesRef.current)
      playPop()
      if (missesRef.current >= MAX_MISSES) finish(scoreRef.current)
    }
  }

  const pct = Math.max(0, (timeLeft / GAME_MS) * 100)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">🐾 {score} pups</span>
        <span className="pill">
          {'💗'.repeat(Math.max(0, MAX_MISSES - misses))}
          {'🖤'.repeat(Math.min(MAX_MISSES, Math.max(0, misses)))}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-mint-300 to-sky-300 transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="relative">
        <div className="grid grid-cols-3 gap-4 rounded-3xl border-4 border-blush-400/80 bg-gradient-to-b from-mint-200/70 to-sky-200/60 p-5 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)]">
          {Array.from({ length: HOLES }).map((_, i) => {
            const mole = moles.find((m) => m.hole === i)
            return (
              <button
                key={i}
                onClick={() => whack(i)}
                disabled={phase !== 'playing'}
                aria-label="Hole"
                className={`relative grid aspect-[4/3] place-items-end justify-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-mint-200/70 via-mint-200/40 to-blush-200/60 ring-1 ring-blush-300/60 shadow-[inset_0_3px_7px_rgba(120,40,80,0.14)] transition ${
                  phase === 'playing'
                    ? 'cursor-pointer hover:from-mint-200 hover:to-blush-200 active:scale-[0.97]'
                    : ''
                }`}
              >
                <span className="pointer-events-none absolute bottom-1.5 h-1/2 w-3/4 rounded-[50%] bg-blush-900/35 blur-[1.5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
                {mole && (
                  <span className="animate-pop-in relative z-10 mb-1 text-5xl drop-shadow">
                    <span className="inline-block animate-wiggle">🐶</span>
                  </span>
                )}
                {hits
                  .filter((h) => h.hole === i)
                  .map((h) => (
                    <span
                      key={h.id}
                      className="animate-pop-in pointer-events-none absolute inset-0 grid place-items-center text-3xl"
                    >
                      ✨
                    </span>
                  ))}
              </button>
            )
          })}
        </div>

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/65 p-4 text-center backdrop-blur-sm">
            <div>
              {phase === 'over' && (
                <p className="font-display text-2xl font-extrabold text-blush-900">
                  {score} pups caught! 🎉
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-blush-700/80">
                Tap the puppy before it hides — 3 misses ends it.
              </p>
              <button onClick={start} className="btn-candy mt-4">
                {phase === 'idle' ? 'Start' : 'Play again'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
