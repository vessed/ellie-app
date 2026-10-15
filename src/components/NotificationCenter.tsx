import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { WHO_NAME } from '../lib/types'
import { relativeTime } from '../lib/media'
import {
  BellIcon,
  CheckIcon,
  CloseIcon,
  HeartIcon,
  NoteIcon,
} from './Icons'

/* The bell is just a *view* over notes & hearts — clearing it must never
   delete the love notes themselves (those live on the Notes page and quietly
   expire after 24h). We remember "cleared"/"seen" ids locally instead. */
const BELL_CLEARED_KEY = 'ellie-bell-cleared'
const BELL_SEEN_KEY = 'ellie-bell-seen'

function loadCleared(): number {
  try {
    const raw = localStorage.getItem(BELL_CLEARED_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(BELL_SEEN_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore */
  }
  return new Set()
}

export function NotificationCenter() {
  const { notes, setNotes, heartEvents, as, setRoute } = useApp()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, bottom: 0, maxH: 480 })
  const [cleared, setCleared] = useState(loadCleared)
  const [seen, setSeen] = useState<Set<string>>(loadSeen)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const unread = notes.filter((n) => n.to === as && !n.read).length
  const badge = unread

  useEffect(() => {
    try {
      localStorage.setItem(BELL_SEEN_KEY, JSON.stringify([...seen]))
    } catch {
      /* ignore */
    }
  }, [seen])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  const toggle = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      const w = 352
      let left = r.left
      if (left + w > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - w - 8)
      }
      const bottom = window.innerHeight - r.top + 8
      const maxH = Math.max(220, Math.min(480, r.top - 16))
      setPos({ x: left, bottom, maxH })
    }
    setOpen((o) => !o)
  }

  const shown = (ts: number, id: string) => ts > cleared && !seen.has(id)

  const recentNotes = [...notes]
    .filter((n) => shown(n.createdAt, n.id))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)

  const recentHearts = [...heartEvents]
    .filter((h) => shown(h.createdAt, h.id))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)

  /* Clearing the bell only hides what's showing — the love notes stay safe on
     the Notes page (and quietly disappear there on their own after 24h). */
  const clearAll = () => {
    const now = Date.now()
    setCleared(now)
    try {
      localStorage.setItem(BELL_CLEARED_KEY, String(now))
    } catch {
      /* ignore */
    }
    setSeen((prev) => {
      const next = new Set(prev)
      for (const n of notes) next.add(n.id)
      for (const h of heartEvents) next.add(h.id)
      return next
    })
    setNotes((prev) =>
      prev.map((n) => (n.to === as && !n.read ? { ...n, read: true } : n)),
    )
  }

  const dismissNote = (id: string) => {
    setSeen((prev) => new Set(prev).add(id))
  }

  const dismissHeart = (id: string) => {
    setSeen((prev) => new Set(prev).add(id))
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Notifications"
        className="glass-soft relative mt-auto flex items-center gap-3 rounded-2xl p-3 pt-6 transition hover:-translate-y-0.5"
      >
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-200 to-blush-200 text-blush-600">
          <BellIcon className="h-5 w-5" />
          {badge > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-blush-500 px-1 text-[0.6rem] font-extrabold text-white shadow">
              {badge}
            </span>
          )}
        </span>
        <span className="leading-tight text-left">
          <span className="block text-sm font-extrabold text-blush-800">
            Notifications
          </span>
          <span className="block text-xs font-semibold text-blush-700/70">
            {badge > 0
              ? `${badge} new note${badge > 1 ? 's' : ''}`
              : heartEvents.length > 0
                ? 'hearts & notes'
                : 'all caught up'}
          </span>
        </span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ left: pos.x, bottom: pos.bottom, maxHeight: pos.maxH }}
          className="glass fixed z-50 flex w-[22rem] max-w-[calc(100vw-24px)] flex-col animate-pop rounded-3xl !overflow-visible"
        >
          <div className="relative z-10 flex items-center gap-2 p-4 pb-2">
            <BellIcon className="h-5 w-5 text-blush-500" />
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Notifications
            </h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto grid h-8 w-8 place-items-center rounded-full text-blush-500 transition hover:bg-white/60"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {recentHearts.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-blush-400">
                  Hearts
                </p>
                <div className="flex flex-col gap-1.5">
                  {recentHearts.map((h) => (
                    <div
                      key={h.id}
                      className="relative flex items-start gap-2 rounded-2xl bg-white/50 px-3 py-2 pr-9"
                    >
                      <HeartIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" />
                      <p className="min-w-0 flex-1 break-words text-sm font-bold text-blush-800">
                        {WHO_NAME[h.from]} sent a heart
                      </p>
                      <span className="shrink-0 text-[0.65rem] font-bold text-blush-400">
                        {relativeTime(h.createdAt)}
                      </span>
                      <button
                        onClick={() => dismissHeart(h.id)}
                        aria-label="Dismiss"
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-blush-400 transition hover:bg-white/70 hover:text-blush-600"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentNotes.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-blush-400">
                    Notes &amp; updates
                  </p>
                  {(recentNotes.length > 0 || recentHearts.length > 0) && (
                    <button
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-blush-600 hover:text-blush-700"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {recentNotes.map((n) => (
                    <div
                      key={n.id}
                      className={`relative rounded-2xl px-3 py-2 pr-9 ${
                        n.to === as && !n.read
                          ? 'bg-blush-200/60'
                          : 'bg-white/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.kind === 'system' ? (
                          <BellIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-400" />
                        ) : (
                          <NoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-blush-800">
                            {n.kind === 'system'
                              ? `Update from ${WHO_NAME[n.from]}`
                              : `Note from ${WHO_NAME[n.from]}`}
                          </p>
                          <p className="mt-0.5 break-words text-xs font-semibold leading-snug text-blush-500">
                            {n.body}
                          </p>
                        </div>
                      </div>
                      <span className="mt-1 block text-[0.65rem] font-bold text-blush-400">
                        {relativeTime(n.createdAt)}
                      </span>
                      <button
                        onClick={() => dismissNote(n.id)}
                        aria-label="Dismiss"
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-blush-400 transition hover:bg-white/70 hover:text-blush-600"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setOpen(false)
                    setRoute('notes')
                  }}
                  className="mt-3 w-full rounded-full bg-white/60 py-2 text-xs font-extrabold text-blush-600 transition hover:bg-white"
                >
                  Open love notes
                </button>
              </div>
            )}

            {recentHearts.length === 0 && recentNotes.length === 0 && (
              <p className="py-6 text-center text-sm font-semibold text-blush-500">
                Nothing yet — send each other a heart! 💗
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}