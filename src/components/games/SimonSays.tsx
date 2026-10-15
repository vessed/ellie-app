import { useCallback, useEffect, useRef, useState } from 'react'
import { playLose, playTone, playWin } from '../../lib/sound'

const TONES = [329.63, 415.3, 493.88, 659.25]

const PADS = [
  { id: 0, from: '#ff9a9a', to: '#e23b3b', glow: '226, 59, 59' },
  { id: 1, from: '#9ef0ac', to: '#31b455', glow: '49, 180, 85' },
  { id: 2, from: '#93bdff', to: '#3b6fe2', glow: '59, 111, 226' },
  { id: 3, from: '#ffe58f', to: '#e2b93b', glow: '226, 185, 59' },
]

export function SimonSays({
  onFinish,
}: {
  onFinish: (score: number) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'over'>(
    'idle',
  )
  const [active, setActive] = useState<number | null>(null)
  const [round, setRound] = useState(0)

  const seqRef = useRef<number[]>([])
  const inputRef = useRef(0)
  const roundRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const doneRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t)
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const flash = useCallback(
    (pad: number, dur: number, gain = 0.08) => {
      setActive(pad)
      playTone(TONES[pad], dur, gain)
      const t = window.setTimeout(() => setActive(null), Math.round(dur * 1000))
      timersRef.current.push(t)
    },
    [],
  )

  const playSeq = useCallback(
    (seq: number[]) => {
      setPhase('showing')
      let i = 0
      const step = () => {
        if (i >= seq.length) {
          inputRef.current = 0
          setPhase('input')
          return
        }
        const pad = seq[i]
        flash(pad, 0.28)
        i++
        const gap = Math.max(280, 640 - roundRef.current * 35)
        const t = window.setTimeout(step, gap)
        timersRef.current.push(t)
      }
      const t = window.setTimeout(step, 500)
      timersRef.current.push(t)
    },
    [flash],
  )

  const start = () => {
    clearTimers()
    doneRef.current = false
    roundRef.current = 0
    setRound(0)
    const first = Math.floor(Math.random() * 4)
    seqRef.current = [first]
    inputRef.current = 0
    playSeq(seqRef.current)
  }

  const press = (pad: number) => {
    if (phase !== 'input') return
    flash(pad, 0.18, 0.09)
    const seq = seqRef.current
    if (seq[inputRef.current] === pad) {
      inputRef.current += 1
      if (inputRef.current === seq.length) {
        roundRef.current += 1
        setRound(roundRef.current)
        const next = [...seq, Math.floor(Math.random() * 4)]
        seqRef.current = next
        inputRef.current = 0
        setPhase('showing')
        const t = window.setTimeout(() => playSeq(next), 750)
        timersRef.current.push(t)
      }
    } else {
      if (doneRef.current) return
      doneRef.current = true
      setActive(pad)
      setPhase('over')
      const t = window.setTimeout(() => setActive(null), 260)
      timersRef.current.push(t)
      if (roundRef.current <= 0) playLose()
      else playWin()
      onFinishRef.current(roundRef.current)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">
          🎵 Round {round + (phase === 'showing' || phase === 'input' ? 1 : 0)}
        </span>
        <span
          className={`pill h-7 ${phase === 'input' ? 'animate-heartbeat' : ''}`}
        >
          {phase === 'showing' && 'Watch…'}
          {phase === 'input' && 'Your turn!'}
          {phase === 'idle' && 'Ready?'}
          {phase === 'over' && `${round} rounds`}
        </span>
      </div>

      <div className="relative rounded-3xl border-4 border-blush-400/80 bg-white/25 p-3 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)]">
        <div
          className={`grid grid-cols-2 gap-3 ${
            phase === 'over' ? 'animate-shake' : ''
          }`}
        >
          {PADS.map((p) => {
            const on = active === p.id
            return (
              <button
                key={p.id}
                onClick={() => press(p.id)}
                disabled={phase !== 'input'}
                aria-label={`Pad ${p.id + 1}`}
                style={{
                  background: `linear-gradient(to bottom right, ${p.from}, ${p.to})`,
                  boxShadow: on
                    ? `0 0 0 5px rgba(255,255,255,0.75), 0 0 34px rgba(${p.glow}, 0.95)`
                    : `0 10px 24px -16px rgba(${p.glow}, 0.9), inset 0 1px 0 rgba(255,255,255,0.55)`,
                  transform: on ? 'scale(0.93)' : undefined,
                  filter: on ? 'brightness(1.18)' : undefined,
                }}
                className={`aspect-square rounded-3xl transition-all duration-150 ease-out ${
                  phase === 'input'
                    ? 'cursor-pointer hover:-translate-y-0.5 hover:brightness-105 active:scale-95'
                    : 'cursor-default'
                }`}
              />
            )
          })}
        </div>

        {(phase === 'idle' || phase === 'over') && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/70 p-4 text-center backdrop-blur-sm">
            <div>
              {phase === 'over' && (
                <p className="font-display text-2xl font-extrabold text-blush-900">
                  {round} rounds! 🎉
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-blush-700/80">
                Repeat the growing colour and sound pattern. 🎵
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
