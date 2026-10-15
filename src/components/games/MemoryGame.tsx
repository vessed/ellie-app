import { useState } from 'react'
import { playHeart } from '../../lib/sound'

const EMOJIS = ['🐶', '🐱', '🌸', '🍓', '🎀', '🦄', '🐸', '🍭']

interface Card {
  id: number
  emoji: string
}

function shuffled(): Card[] {
  const cards = [...EMOJIS, ...EMOJIS].map((emoji, id) => ({ id, emoji }))
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function MemoryGame({
  onFinish,
}: {
  onFinish: (score: number) => void
}) {
  const [cards, setCards] = useState<Card[]>(shuffled)
  const [picked, setPicked] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [lock, setLock] = useState(false)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)

  const reset = () => {
    setCards(shuffled())
    setPicked([])
    setMatched(new Set())
    setLock(false)
    setMoves(0)
    setWon(false)
  }

  const flip = (index: number) => {
    if (lock || won) return
    if (picked.includes(index) || matched.has(index)) return

    if (picked.length === 0) {
      setPicked([index])
      return
    }

    const first = picked[0]
    setPicked([first, index])
    const nextMoves = moves + 1
    setMoves(nextMoves)

    if (cards[first].emoji === cards[index].emoji) {
      const done = new Set(matched)
      done.add(first)
      done.add(index)
      setMatched(done)
      setPicked([])
      playHeart()
      if (done.size === cards.length) {
        setWon(true)
        onFinish(nextMoves)
      }
    } else {
      setLock(true)
      window.setTimeout(() => {
        setPicked([])
        setLock(false)
      }, 750)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-blush-700/80">
          {won ? 'You matched them all! 🎉' : `${moves} moves`}
        </p>
        <button onClick={reset} className="btn-ghost !py-1.5 !text-xs">
          {won ? 'Play again' : 'New game'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-3xl border-4 border-blush-400/80 bg-white/25 p-3 ring-1 ring-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.07)] [perspective:900px]">
        {cards.map((card, i) => {
          const revealed = picked.includes(i) || matched.has(i)
          const isMatched = matched.has(i)
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              disabled={isMatched}
              aria-label={revealed ? card.emoji : 'Hidden card'}
              className={`relative aspect-square rounded-2xl transition-transform duration-300 ease-out [transform-style:preserve-3d] ${
                revealed ? '[transform:rotateY(180deg)]' : 'hover:-translate-y-0.5'
              }`}
            >
              <span className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-blush-300 to-lilac-300 shadow-sm [backface-visibility:hidden]">
                <span className="text-xl text-white/85">♡</span>
              </span>
              <span
                className={`absolute inset-0 grid place-items-center rounded-2xl bg-white/85 text-3xl shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                  isMatched ? 'ring-2 ring-mint-300' : ''
                }`}
              >
                {card.emoji}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
