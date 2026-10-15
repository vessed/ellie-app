import { useState } from 'react'
import { useCare } from '../../lib/care'
import { CareChecklist } from './CareChecklist'

function StatBar({
  label,
  emoji,
  value,
}: {
  label: string
  emoji: string
  value: number
}) {
  const tone =
    value >= 66
      ? 'from-mint-300 to-mint-200'
      : value >= 33
        ? 'from-butter-200 to-blush-200'
        : 'from-blush-400 to-blush-300'
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-lg">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs font-bold text-blush-600">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/55">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-500`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Action({
  emoji,
  label,
  done,
  onClick,
}: {
  emoji: string
  label: string
  done: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={done}
      className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 font-extrabold transition ${
        done
          ? 'border-white/60 bg-white/30 text-blush-500/50'
          : 'border-white/70 bg-white/60 text-blush-800 hover:-translate-y-0.5 hover:bg-white/85'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs">{done ? 'Done today' : label}</span>
    </button>
  )
}

export function VirtualPup() {
  const care = useCare()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(care.pup.name)

  const startEdit = () => {
    setDraft(care.pup.name)
    setEditing(true)
  }
  const save = () => {
    care.rename(draft)
    setEditing(false)
  }

  const toNext = care.bond.next ? care.bond.next - care.pup.bond : 0

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="rounded-3xl bg-gradient-to-b from-blush-200/70 to-lilac-200/70 p-6 text-center">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
            className="flex items-center justify-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={20}
              autoFocus
              className="w-40 rounded-xl border border-white/70 bg-white/85 px-3 py-1 text-center font-display text-lg font-extrabold text-blush-900 outline-none"
            />
            <button type="submit" className="pill">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="pill"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={startEdit}
            className="font-display text-lg font-extrabold text-blush-900"
          >
            {care.pup.name} {care.mood.emoji} <span className="text-sm">✏️</span>
          </button>
        )}
        <p className="text-xs font-semibold text-blush-700/80">
          {care.mood.label}
          {care.daysTogether > 0 && ` · ${care.daysTogether} days together`}
        </p>
        <div className="animate-bob mt-3 text-7xl">🐶</div>
      </div>

      <div className="glass-soft flex flex-col gap-3 rounded-3xl p-5">
        <StatBar label="Fullness" emoji="🍖" value={care.pup.fullness} />
        <StatBar label="Cleanliness" emoji="🛁" value={care.pup.cleanliness} />
        <StatBar label="Happiness" emoji="💛" value={care.pup.happiness} />
      </div>

      <div className="glass-soft flex flex-col gap-2 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-blush-800">
            💞 {care.bond.title}
          </span>
          <span className="text-xs font-bold text-blush-500/80">
            Bond lv {care.bond.level}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/55">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blush-300 to-lilac-300 transition-all duration-500"
            style={{ width: `${care.bond.progress * 100}%` }}
          />
        </div>
        <p className="text-xs font-semibold text-blush-500/80">
          {care.bond.next
            ? `${toNext} XP until the next bond level`
            : 'Fully bonded, forever friends 💞'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Action
          emoji="🍖"
          label="Feed"
          done={care.fedToday}
          onClick={care.feed}
        />
        <Action
          emoji="🛁"
          label="Brush"
          done={care.brushedToday}
          onClick={care.brush}
        />
        <Action
          emoji="🦮"
          label="Walk"
          done={care.walkedToday}
          onClick={care.walk}
        />
        <Action
          emoji="🎾"
          label="Play"
          done={care.playedToday}
          onClick={care.play}
        />
        <Action
          emoji="🫂"
          label="Cuddle"
          done={care.cuddledToday}
          onClick={care.cuddle}
        />
        <Action
          emoji="🍬"
          label="Treat"
          done={care.treatedToday}
          onClick={care.treat}
        />
      </div>

      <CareChecklist title="Today’s pup care" tasks={care.pupTasks} />

      <p className="text-center text-xs font-semibold text-blush-500/80">
        Your pup’s needs slowly drop each day — every cuddle, walk and treat
        also grows your bond. Come back tomorrow! 🐾
      </p>
    </div>
  )
}
