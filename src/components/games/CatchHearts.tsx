import { useCallback, useEffect, useRef, useState } from 'react'
import { playCatch, playLose, playWin } from '../../lib/sound'

interface Drop {
  id: number
  kind: 'heart' | 'star' | 'rainbow'
  x: number
  y: number
  vy: number
  drift: number
}

const GAME_MS = 30_000
const BASKET_HALF = 12
const CATCH_TOP = 78
const CATCH_BOTTOM = 98
const MIN_X = 6
const MAX_X = 94

const KINDS: Record<
  Drop['kind'],
  { emoji: string; points: number; weight: number }
> = {
  heart: { emoji: '💗', points: 1, weight: 6 },
  star: { emoji: '⭐', points: 3, weight: 2 },
  rainbow: { emoji: '🌈', points: 5, weight: 1 },
}

function pickKind(): Drop['kind'] {
  const total = Object.values(KINDS).reduce((s, k) => s + k.weight, 0)
  let r = Math.random() * total
  for (const key of Object.keys(KINDS) as Drop['kind'][]) {
    r -= KINDS[key].weight
    if (r <= 0) return key
  }
  return 'heart'
}

export function CatchHearts({
  onFinish,
}: {
  onFinish: (score: number) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [drops, setDrops] = useState<Drop[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_MS)
  const [pops, setPops] = useState<
    { id: number; x: number; y: number; n: number }[]
  >([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const dropsRef = useRef<Drop[]>([])
  const scoreRef = useRef(0)
  const idRef = useRef(0)
  const doneRef = useRef(false)
  const onFinishRef = useRef(onFinish)

  const boxRef = useRef<HTMLDivElement | null>(null)
  const basketElRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef(50)
  const posRef = useRef(50)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const applyBasket = useCallback(() => {
    const el = basketElRef.current
    const w = sizeRef.current.w
    if (!el || !w) return
    el.style.transform = `translate3d(${(posRef.current / 100) * w}px, 0, 0) translateX(-50%)`
  }, [])

  useEffect(() => {
    const measure = () => {
      const el = boxRef.current
      if (!el) return
      const w = el.clientWidth
      const h = el.clientHeight
      sizeRef.current = { w, h }
      setSize({ w, h })
      applyBasket()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [applyBasket])

  const finish = useCallback((final: number) => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('over')
    if (final <= 0) playLose()
    else playWin()
    onFinishRef.current(final)
  }, [])

  const nudge = useCallback((dir: number) => {
    targetRef.current = Math.max(MIN_X, Math.min(MAX_X, targetRef.current + dir * 6))
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudge(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudge(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, nudge])

  useEffect(() => {
    if (phase !== 'playing') return
    const started = Date.now()
    let raf = 0
    let last = started
    let spawnAcc = 0
    let lastScore = 0

    const loop = () => {
      const now = Date.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const left = GAME_MS - (now - started)
      setTimeLeft(Math.max(0, left))

      posRef.current += (targetRef.current - posRef.current) * Math.min(1, dt * 24)
      if (Math.abs(targetRef.current - posRef.current) < 0.04)
        posRef.current = targetRef.current
      applyBasket()

      spawnAcc += dt
      if (spawnAcc > 0.62) {
        spawnAcc = 0
        idRef.current += 1
        dropsRef.current = [
          ...dropsRef.current,
          {
            id: idRef.current,
            kind: pickKind(),
            x: 8 + Math.random() * 84,
            y: -6,
            vy: 42 + Math.random() * 26,
            drift: (Math.random() - 0.5) * 18,
          },
        ]
      }

      const next: Drop[] = []
      for (const d of dropsRef.current) {
        const ny = d.y + d.vy * dt
        const nx = Math.max(4, Math.min(96, d.x + d.drift * dt))
        if (
          ny >= CATCH_TOP &&
          ny <= CATCH_BOTTOM &&
          Math.abs(nx - posRef.current) <= BASKET_HALF
        ) {
          const pts = KINDS[d.kind].points
          scoreRef.current += pts
          const pid = d.id + 100000
          setPops((p) => [...p, { id: pid, x: nx, y: ny, n: pts }])
          window.setTimeout(
            () => setPops((p) => p.filter((x) => x.id !== pid)),
            520,
          )
          playCatch()
          continue
        }
        if (ny <= 104) next.push({ ...d, x: nx, y: ny })
      }
      if (scoreRef.current !== lastScore) {
        lastScore = scoreRef.current
        setScore(scoreRef.current)
      }
      dropsRef.current = next
      setDrops(next)

      if (left <= 0) {
        finish(scoreRef.current)
        return
      }
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [phase, finish, applyBasket])

  const move = (clientX: number) => {
    if (phase !== 'playing') return
    const el = boxRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect.width) return
    const frac = ((clientX - rect.left) / rect.width) * 100
    targetRef.current = Math.max(MIN_X, Math.min(MAX_X, frac))
  }

  const start = () => {
    dropsRef.current = []
    scoreRef.current = 0
    idRef.current = 0
    doneRef.current = false
    targetRef.current = 50
    posRef.current = 50
    applyBasket()
    setDrops([])
    setPops([])
    setScore(0)
    setTimeLeft(GAME_MS)
    setPhase('playing')
  }

  const pct = Math.max(0, (timeLeft / GAME_MS) * 100)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">💖 {score} points</span>
        <span className="pill">⏱ {Math.ceil(timeLeft / 1000)}s</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blush-300 to-lilac-300 transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        ref={boxRef}
        onPointerMove={(e) => move(e.clientX)}
        onPointerDown={(e) => move(e.clientX)}
        className="relative h-80 touch-none select-none overflow-hidden rounded-3xl border-4 border-blush-400/80 bg-gradient-to-b from-sky-200/80 via-blush-100/70 to-lilac-200/80 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)]"
      >
        {phase === 'playing' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="animate-float absolute left-[10%] top-[16%] text-2xl opacity-30">
              💗
            </span>
            <span className="animate-float-slow absolute right-[14%] top-[26%] text-xl opacity-25">
              ⭐
            </span>
            <span className="animate-float absolute bottom-[14%] left-[68%] text-2xl opacity-30">
              🌈
            </span>
            <span className="animate-bob absolute left-[42%] top-[8%] text-lg opacity-20">
              ✨
            </span>
          </div>
        )}

        {drops.map((d) => {
          const px = size.w ? (d.x / 100) * size.w : 0
          const py = size.h ? (d.y / 100) * size.h : 0
          return (
            <span
              key={d.id}
              className="absolute left-0 top-0 text-3xl will-change-transform"
              style={{
                transform: `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`,
              }}
            >
              {KINDS[d.kind].emoji}
            </span>
          )
        })}

        {pops.map((p) => (
          <span
            key={p.id}
            className="animate-rise absolute text-xs font-extrabold text-blush-600"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            +{p.n}
          </span>
        ))}

        <div
          ref={basketElRef}
          className="absolute bottom-1 left-0 text-4xl drop-shadow-md will-change-transform"
        >
          🧺
        </div>

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 p-4 text-center backdrop-blur-sm">
            <div>
              {phase === 'over' && (
                <p className="font-display text-2xl font-extrabold text-blush-900">
                  {score} points! 🎉
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-blush-700/80">
                Slide the basket to catch the falling hearts and stars. 💗⭐🌈
              </p>
              <button onClick={start} className="btn-candy mt-4">
                {phase === 'idle' ? 'Start' : 'Play again'}
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-xs font-semibold text-blush-500/80">
        Tip: move with your mouse or finger · arrow keys also work
      </p>
    </div>
  )
}
