import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { playCatch, playLose, playPop, playWin } from '../../lib/sound'

const W = 10
const H = 16

type Shape = number[][]

interface Piece {
  shape: Shape
  color: number
  x: number
  y: number
}

interface Game {
  board: number[]
  piece: Piece | null
  next: number
  score: number
  lines: number
  level: number
  over: boolean
  started: boolean
}

const I: Shape = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
]
const O: Shape = [
  [1, 1],
  [1, 1],
]
const T: Shape = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 0, 0],
]
const S: Shape = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 0, 0],
]
const Z: Shape = [
  [1, 1, 0],
  [0, 1, 1],
  [0, 0, 0],
]
const J: Shape = [
  [1, 0, 0],
  [1, 1, 1],
  [0, 0, 0],
]
const L: Shape = [
  [0, 0, 1],
  [1, 1, 1],
  [0, 0, 0],
]

const DEFS: { color: number; shape: Shape }[] = [
  { color: 1, shape: I },
  { color: 2, shape: O },
  { color: 3, shape: T },
  { color: 4, shape: S },
  { color: 5, shape: Z },
  { color: 6, shape: J },
  { color: 7, shape: L },
]

/* Deeper, more distinct block colours (still soft enough for the app) so the
   pieces read clearly against the pale board. Each block gets a top highlight,
   a bottom shade and a matching outline to give it a little 3D pop. */
const COLORS: Record<number, { bg: string; edge: string }> = {
  1: { bg: 'linear-gradient(135deg,#ff9ec4,#f4538b)', edge: '#db2f6c' },
  2: { bg: 'linear-gradient(135deg,#bca6f2,#8b5cf6)', edge: '#7341e6' },
  3: { bg: 'linear-gradient(135deg,#82c8f6,#3b9edb)', edge: '#2b83bd' },
  4: { bg: 'linear-gradient(135deg,#82dcab,#34b87b)', edge: '#249a63' },
  5: { bg: 'linear-gradient(135deg,#ffd873,#fbae3c)', edge: '#e6941f' },
  6: { bg: 'linear-gradient(135deg,#ff93a5,#ef4e6e)', edge: '#d63355' },
  7: { bg: 'linear-gradient(135deg,#f8aae2,#d96bc0)', edge: '#c04aa6' },
}

function blockStyle(c: number): CSSProperties {
  const col = COLORS[c]
  return {
    background: col.bg,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -3px 4px rgba(0,0,0,0.22), 0 0 0 1px ${col.edge}`,
  }
}

function emptyBoard(): number[] {
  return new Array(W * H).fill(0)
}

function rotate(shape: Shape): Shape {
  const n = shape.length
  const out: Shape = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) out[x][n - 1 - y] = shape[y][x]
  return out
}

function collides(
  shape: Shape,
  px: number,
  py: number,
  board: number[],
): boolean {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape.length; x++) {
      if (!shape[y][x]) continue
      const bx = px + x
      const by = py + y
      if (bx < 0 || bx >= W || by >= H) return true
      if (by >= 0 && board[by * W + bx]) return true
    }
  }
  return false
}

function gravityFor(level: number): number {
  return Math.max(90, 620 - (level - 1) * 55)
}

function spawn(defIndex: number): Piece {
  const def = DEFS[defIndex]
  const n = def.shape.length
  return {
    shape: def.shape.map((r) => [...r]),
    color: def.color,
    x: Math.floor((W - n) / 2),
    y: 0,
  }
}

function initialGame(next = 0): Game {
  return {
    board: emptyBoard(),
    piece: null,
    next,
    score: 0,
    lines: 0,
    level: 1,
    over: false,
    started: false,
  }
}

export function BlockDrop({ onFinish }: { onFinish: (score: number) => void }) {
  const [game, setGame] = useState<Game>(() => initialGame())
  const gameRef = useRef(game)
  const doneRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const commit = useCallback((g: Game) => {
    gameRef.current = g
    setGame(g)
  }, [])

  const lock = useCallback(
    (g: Game): Game => {
      const piece = g.piece
      if (!piece) return g
      const board = [...g.board]
      let overflow = false
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape.length; x++) {
          if (!piece.shape[y][x]) continue
          const bx = piece.x + x
          const by = piece.y + y
          if (by < 0) {
            overflow = true
            continue
          }
          board[by * W + bx] = piece.color
        }
      }

      let cleared = 0
      const kept: number[] = []
      for (let row = 0; row < H; row++) {
        const full = board
          .slice(row * W, row * W + W)
          .every((c) => c !== 0)
        if (full) cleared++
        else kept.push(...board.slice(row * W, row * W + W))
      }
      while (kept.length < W * H) kept.unshift(...new Array(W).fill(0))

      const lines = g.lines + cleared
      const level = Math.floor(lines / 10) + 1
      const score =
        g.score + [0, 100, 300, 500, 800][cleared] * level
      if (cleared) playCatch()

      if (overflow) {
        return { ...g, board: kept, piece: null, over: true, score, lines, level }
      }

      const nextIndex = Math.floor(Math.random() * DEFS.length)
      const newPiece = spawn(g.next)
      const nextGame: Game = {
        ...g,
        board: kept,
        score,
        lines,
        level,
        next: nextIndex,
        piece: newPiece,
      }
      if (collides(newPiece.shape, newPiece.x, newPiece.y, kept)) {
        return { ...nextGame, over: true }
      }
      return nextGame
    },
    [],
  )

  const descend = useCallback(
    (g: Game): Game => {
      const piece = g.piece
      if (!piece) return g
      if (!collides(piece.shape, piece.x, piece.y + 1, g.board)) {
        return { ...g, piece: { ...piece, y: piece.y + 1 } }
      }
      return lock(g)
    },
    [lock],
  )

  const drop = useCallback(() => {
    const g = gameRef.current
    if (!g.started || g.over || !g.piece) return
    commit(descend(g))
  }, [commit, descend])

  useEffect(() => {
    if (!game.started || game.over) return
    const iv = window.setInterval(drop, gravityFor(game.level))
    return () => window.clearInterval(iv)
  }, [game.started, game.over, game.level, drop])

  const finishIfOver = useCallback((g: Game) => {
    if (!g.over || doneRef.current) return
    doneRef.current = true
    if (g.score <= 0) playLose()
    else playWin()
    onFinishRef.current(g.score)
  }, [])

  const move = useCallback(
    (dx: number) => {
      const g = gameRef.current
      if (!g.started || g.over || !g.piece) return
      if (!collides(g.piece.shape, g.piece.x + dx, g.piece.y, g.board)) {
        commit({ ...g, piece: { ...g.piece, x: g.piece.x + dx } })
        playPop()
      }
    },
    [commit],
  )

  const rotatePiece = useCallback(() => {
    const g = gameRef.current
    if (!g.started || g.over || !g.piece) return
    const rotated = rotate(g.piece.shape)
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(rotated, g.piece.x + kick, g.piece.y, g.board)) {
        commit({ ...g, piece: { ...g.piece, shape: rotated, x: g.piece.x + kick } })
        playPop()
        return
      }
    }
  }, [commit])

  const hardDrop = useCallback(() => {
    const g = gameRef.current
    if (!g.started || g.over || !g.piece) return
    let piece = g.piece
    while (!collides(piece.shape, piece.x, piece.y + 1, g.board)) {
      piece = { ...piece, y: piece.y + 1 }
    }
    const next = lock({ ...g, piece })
    commit(next)
    finishIfOver(next)
  }, [commit, lock, finishIfOver])

  const softDrop = useCallback(() => {
    drop()
    const g = gameRef.current
    finishIfOver(g)
  }, [drop, finishIfOver])

  useEffect(() => {
    if (game.over) finishIfOver(game)
  }, [game, finishIfOver])

  useEffect(() => {
    if (!game.started || game.over) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        move(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        move(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        rotatePiece()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        softDrop()
      } else if (e.key === ' ') {
        e.preventDefault()
        hardDrop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game.started, game.over, move, rotatePiece, softDrop, hardDrop])

  const start = () => {
    doneRef.current = false
    const nextIndex = Math.floor(Math.random() * DEFS.length)
    const first = Math.floor(Math.random() * DEFS.length)
    const g: Game = {
      ...initialGame(nextIndex),
      piece: spawn(first),
      started: true,
    }
    commit(g)
  }

  const display = [...game.board]
  if (game.piece) {
    const { shape, x, y, color } = game.piece
    for (let cy = 0; cy < shape.length; cy++)
      for (let cx = 0; cx < shape.length; cx++) {
        if (!shape[cy][cx]) continue
        const bx = x + cx
        const by = y + cy
        if (bx >= 0 && bx < W && by >= 0 && by < H)
          display[by * W + bx] = color
      }
  }

  const nextDef = DEFS[game.next]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="pill">🧱 {game.score} pts</span>
        <span className="pill">Lines {game.lines} · Lv {game.level}</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="relative">
          <div
            className={`grid gap-[2px] rounded-2xl border-4 border-blush-400/80 bg-gradient-to-b from-lilac-200/70 to-sky-200/60 p-2 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)] ${
              game.over ? 'animate-shake' : ''
            }`}
            style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }}
          >
            {display.map((c, i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-[3px] ${
                  c ? '' : 'bg-white/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]'
                }`}
                style={c ? blockStyle(c) : undefined}
              />
            ))}
          </div>

          {!game.started || game.over ? (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 p-4 text-center backdrop-blur-sm">
              <div>
                {game.over && (
                  <p className="font-display text-xl font-extrabold text-blush-900">
                    {game.score} points! 🎉
                  </p>
                )}
                <p className="mt-1 text-xs font-semibold text-blush-700/80">
                  Stack the blocks and clear full rows.
                </p>
                <button onClick={start} className="btn-candy mt-3">
                  {game.over ? 'Play again' : 'Start'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-blush-500">Next</span>
          <div
            className="animate-bob grid gap-[2px] rounded-xl bg-white/40 p-2"
            style={{
              gridTemplateColumns: `repeat(${nextDef.shape.length}, minmax(0, 1fr))`,
            }}
          >
            {nextDef.shape.flatMap((row, y) =>
              row.map((c, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`h-3 w-3 rounded-[2px] ${c ? '' : 'bg-transparent'}`}
                  style={c ? blockStyle(nextDef.color) : undefined}
                />
              )),
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-44 grid-cols-3 gap-1.5">
        <span />
        <button className="ctrl" onClick={rotatePiece} aria-label="Rotate">
          ↻
        </button>
        <span />
        <button className="ctrl" onClick={() => move(-1)} aria-label="Left">
          ←
        </button>
        <button className="ctrl" onClick={softDrop} aria-label="Down">
          ↓
        </button>
        <button className="ctrl" onClick={() => move(1)} aria-label="Right">
          →
        </button>
        <span />
        <button
          className="ctrl col-span-1"
          onClick={hardDrop}
          aria-label="Drop"
        >
          ⤓
        </button>
        <span />
      </div>
    </div>
  )
}
