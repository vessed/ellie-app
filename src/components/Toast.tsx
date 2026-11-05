import { useToasts } from '../lib/toast'
import { CloseIcon } from './Icons'

export function Toasts() {
  const { toasts, dismissToast } = useToasts()

  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-50 flex max-h-[calc(100vh-6rem)] w-[min(90vw,26rem)] -translate-x-1/2 flex-col items-center gap-3 overflow-y-auto">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => {
            if (t.action) {
              t.action()
              dismissToast(t.id)
            }
          }}
          role={t.action ? 'button' : undefined}
          className={`glass flex w-full items-center gap-3 rounded-full px-4 py-3 ${
            t.leaving
              ? 'pointer-events-none animate-toast-out'
              : 'pointer-events-auto animate-pop'
          } ${t.action && !t.leaving ? 'cursor-pointer hover:bg-white/70' : ''}`}
        >
          <span className="text-xl">{t.emoji}</span>
          <p className="flex-1 text-sm font-bold text-blush-800">
            {t.message}
            {t.action && (
              <span className="ml-1 text-xs font-extrabold text-blush-400">
                · tap to open
              </span>
            )}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              dismissToast(t.id)
            }}
            aria-label="Dismiss"
            className="grid h-7 w-7 place-items-center rounded-full text-blush-500 transition hover:bg-white/60"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}