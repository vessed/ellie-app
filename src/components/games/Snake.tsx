import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playCatch, playLose, playWin } from '../../lib/sound'

interface Pt {
  x: number
  y: number
}

const GRID = 15
const CELL = 100 / GRID
const START: Pt = { x: 7, y: 7 }
const UP: Pt = { x: 0, y: -1 }
const DOWN: Pt = { x: 0, y: 1 }
const LEFT: Pt = { x: -1, y: 0 }
const RIGHT: Pt = { x: 1, y: 0 }

function randomFood(snake: Pt[]): Pt {
  const taken = new Set(snake.map((s) => `${s.x},${s.y}`))
  const free: Pt[] = []
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

export function Snake({ onFinish }: { onFinish: (score: number) => void }) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [snake, setSnake] = useState<Pt[]>([START])
  const [food, setFood] = useState<Pt>({ x: 3, y: 3 })
  const [score, setScore] = useState(0)
  const [gameId, setGameId] = useState(0)

  const snakeRef = useRef<Pt[]>([{ ...START }])
  const dirRef = useRef<Pt>({ ...RIGHT })
  const queueRef = useRef<Pt[]>([])
  const foodRef = useRef<Pt>({ x: 3, y: 3 })
  const speedRef = useRef(130)
  const scoreRef = useRef(0)
  const doneRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const die = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('over')
    if (scoreRef.current <= 0) playLose()
    else playWin()
    onFinishRef.current(scoreRef.current)
  }, [])

  const step = useCallback(() => {
    if (queueRef.current.length) dirRef.current = queueRef.current.shift() as Pt
    const dir = dirRef.current
    const body = snakeRef.current
    const head = body[0]
    const next: Pt = { x: head.x + dir.x, y: head.y + dir.y }

    const hitWall =
      next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID
    const eating = next.x === foodRef.current.x && next.y === foodRef.current.y
    const willHitSelf = body
      .slice(0, eating ? body.length : body.length - 1)
      .some((s) => s.x === next.x && s.y === next.y)

    if (hitWall || willHitSelf) {
      die()
      return
    }

    const grown = [next, ...body]
    if (!eating) grown.pop()
    snakeRef.current = grown
    setSnake(grown)

    if (eating) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      speedRef.current = Math.max(60, 130 - scoreRef.current * 4)
      const f = randomFood(grown)
      foodRef.current = f
      setFood(f)
      playCatch()
    }
  }, [die])

  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      let dt = now - last
      last = now
      if (dt > 200) dt = 0
      acc += dt
      let guard = 0
      while (acc >= speedRef.current && !doneRef.current && guard < 4) {
        acc -= speedRef.current
        step()
        guard += 1
      }
      if (!doneRef.current) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [phase, step])

  const turn = useCallback((nd: Pt) => {
    const last = queueRef.current.length
      ? (queueRef.current[queueRef.current.length - 1] as Pt)
      : dirRef.current
    if (nd.x === -last.x && nd.y === -last.y) return
    if (nd.x === last.x && nd.y === last.y) return
    if (queueRef.current.length < 2) queueRef.current.push(nd)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault()
        turn(UP)
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault()
        turn(DOWN)
      } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        e.preventDefault()
        turn(LEFT)
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        e.preventDefault()
        turn(RIGHT)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, turn])

  const start = () => {
    const init = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ]
    const f = randomFood(init)
    snakeRef.current = init
    dirRef.current = { ...RIGHT }
    queueRef.current = []
    foodRef.current = f
    speedRef.current = 150
    scoreRef.current = 0
    doneRef.current = false
    setSnake(init)
    setFood(f)
    setScore(0)
    setGameId((g) => g + 1)
    setPhase('playing')
  }

  const stepMs = Math.max(60, 130 - score * 4)
  const bgCells = useMemo(
    () =>
      Array.from({ length: GRID * GRID }, (_, i) => (
        <div
          key={i}
          className="absolute p-[1px]"
          style={{
            left: `${(i % GRID) * CELL}%`,
            top: `${Math.floor(i / GRID) * CELL}%`,
            width: `${CELL}%`,
            height: `${CELL}%`,
          }}
        >
          <div className="h-full w-full rounded-[5px] bg-white/25" />
        </div>
      )),
    [],
  )

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">🌸 {score} blossoms</span>
        <span className="pill">Speed {Math.min(score + 1, 21)}</span>
      </div>

      <div className="relative">
        <div
          className={`relative aspect-square overflow-hidden rounded-3xl border-4 border-blush-400/80 bg-gradient-to-br from-mint-200/70 to-sky-200/60 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)] ${
            phase === 'over' ? 'animate-shake' : ''
          }`}
        >
          <div className="absolute inset-2">
            {bgCells}
            {phase === 'playing' && (
              <div key={gameId} style={{ display: 'contents' }}>
              <div
                className="absolute left-0 top-0 z-[15] grid place-items-center p-[1px]"
                style={{
                  width: `${CELL}%`,
                  height: `${CELL}%`,
                  transform: `translate3d(${food.x * 100}%, ${food.y * 100}%, 0)`,
                }}
              >
                <span className="animate-bob text-lg leading-none drop-shadow-[0_0_6px_rgba(255,120,170,0.85)]">
                  🌸
                </span>
              </div>
              {snake.map((s, i) => (
                <Fragment key={i}>
                  <div
                    className="absolute left-0 top-0 p-[1px] will-change-transform"
                    style={{
                      width: `${CELL}%`,
                      height: `${CELL}%`,
                      transform: `translate3d(${s.x * 100}%, ${s.y * 100}%, 0)`,
                      transition:
                        phase === 'playing'
                          ? `transform ${stepMs}ms linear`
                          : 'none',
                      zIndex: i === 0 ? 20 : 10 + (snake.length - i),
                    }}
                  >
                    <div
                      className={`h-full w-full rounded-[6px] ${
                        i === 0
                          ? 'bg-gradient-to-br from-blush-500 to-blush-600 shadow-[0_1px_5px_rgba(190,60,90,0.5)]'
                          : 'bg-gradient-to-br from-blush-300 to-lilac-300'
                      }`}
                      style={
                        i === 0
                          ? undefined
                          : { opacity: Math.max(0.62, 1 - i * 0.02) }
                      }
                    />
                  </div>
                </Fragment>
              ))}
              </div>
            )}
          </div>
        </div>

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/70 p-4 text-center backdrop-blur-sm">
            <div>
              {phase === 'over' && (
                <p className="font-display text-2xl font-extrabold text-blush-900">
                  {score} blossoms! 🎉
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-blush-700/80">
                Eat the blossoms and grow — don’t hit the walls or yourself!
              </p>
              <button onClick={start} className="btn-candy mt-4">
                {phase === 'idle' ? 'Start' : 'Play again'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto grid w-36 grid-cols-3 gap-1.5">
        <span />
        <button
          type="button"
          className="ctrl touch-manipulation"
          onPointerDown={(e) => {
            e.preventDefault()
            turn(UP)
          }}
          aria-label="Up"
        >
          ↑
        </button>
        <span />
        <button
          type="button"
          className="ctrl touch-manipulation"
          onPointerDown={(e) => {
            e.preventDefault()
            turn(LEFT)
          }}
          aria-label="Left"
        >
          ←
        </button>
        <button
          type="button"
          className="ctrl touch-manipulation"
          onPointerDown={(e) => {
            e.preventDefault()
            turn(DOWN)
          }}
          aria-label="Down"
        >
          ↓
        </button>
        <button
          type="button"
          className="ctrl touch-manipulation"
          onPointerDown={(e) => {
            e.preventDefault()
            turn(RIGHT)
          }}
          aria-label="Right"
        >
          →
        </button>
      </div>
    </div>
  )
}
