import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

export function Modal({
  title,
  emoji,
  onClose,
  children,
}: {
  title: string
  emoji?: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-blush-900/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass relative w-full max-w-md animate-pop !rounded-3xl">
        <div className="relative z-10 flex items-start gap-3 p-5 pb-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
              {emoji ?? '✨'}
            </p>
            <h3 className="font-display text-xl font-extrabold text-blush-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-blush-500 transition hover:bg-white/60"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="relative z-10 px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-blush-500">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-blush-800 outline-none placeholder:text-blush-400 focus:bg-white focus:ring-2 focus:ring-blush-300'