import type { CareTask } from '../../lib/care'

export function CareChecklist({
  title,
  tasks,
}: {
  title: string
  tasks: CareTask[]
}) {
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  return (
    <div className="glass-soft flex flex-col gap-3 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold text-blush-800">{title}</span>
        <span className="pill">
          {total > 0 && done === total ? '✅ all done!' : `${done}/${total}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tasks.length === 0 ? (
          <span className="text-xs font-semibold text-blush-500/80">
            Nothing to do here yet!
          </span>
        ) : (
          tasks.map((t) => (
            <span
              key={t.id}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                t.done
                  ? 'border-mint-300/70 bg-mint-200/60 text-blush-800 line-through'
                  : 'border-white/60 bg-white/40 text-blush-600'
              }`}
            >
              {t.done ? '✓ ' : ''}
              {t.label}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
