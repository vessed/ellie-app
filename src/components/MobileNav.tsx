import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../lib/store'
import { NAV, loadNavOrder } from '../lib/nav'
import { CloseIcon } from './Icons'
import type { Route } from '../lib/types'

/* Bottom tab bar + a searchable, grouped full-screen menu for phones. The
   desktop sidebar is hidden below the `md` breakpoint, so this is how the app
   is navigated on a phone. */
const GROUPS: { title: string; keys: Route[] }[] = [
  { title: 'Every day', keys: ['home', 'daily', 'todo', 'mood'] },
  { title: 'Ours', keys: ['notes', 'memories', 'dates', 'treats', 'wishlist'] },
  { title: 'Play & unwind', keys: ['playroom', 'music', 'library'] },
  { title: 'Settings', keys: ['rules', 'settings'] },
]

function MenuGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function MobileNav() {
  const { route, setRoute, notes, as } = useApp()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<Route[]>(loadNavOrder)

  useEffect(() => {
    const refresh = () => setOrder(loadNavOrder())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const unread = notes.filter((n) => n.to === as && !n.read).length

  const byKey = useMemo(() => new Map(NAV.map((n) => [n.key, n])), [])

  const q = query.trim().toLowerCase()
  const matches = q
    ? order
        .map((k) => byKey.get(k))
        .filter(
          (x): x is (typeof NAV)[number] =>
            Boolean(x) && x!.label.toLowerCase().includes(q),
        )
    : []

  const go = (r: Route) => {
    setOpen(false)
    setQuery('')
    setRoute(r)
  }

  const badgeFor = (key: Route) => (key === 'notes' ? unread : 0)

  const tile = (key: Route) => {
    const item = byKey.get(key)
    if (!item) return null
    const Icon = item.icon
    const active = route === key
    const badge = badgeFor(key)
    return (
      <button
        key={key}
        onClick={() => go(key)}
        className="relative flex flex-col items-center gap-2 rounded-2xl bg-white/70 px-2 py-4 text-center shadow-sm transition active:scale-95"
      >
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl transition ${
            active
              ? 'bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow-glow'
              : 'bg-white/80 text-blush-500'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-extrabold text-blush-800">{item.label}</span>
        {badge > 0 && (
          <span className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-blush-500 px-1 text-[0.6rem] font-extrabold text-white shadow">
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
        <div className="flex items-stretch gap-0.5 overflow-x-auto px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] [scrollbar-width:thin]">
          {order.map((key) => {
            const item = byKey.get(key)
            if (!item) return null
            const Icon = item.icon
            const active = route === key
            const badge = badgeFor(key)
            return (
              <button
                key={key}
                onClick={() => setRoute(key)}
                className="relative flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl py-1.5 transition"
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition ${
                    active ? 'bg-blush-200/80 text-blush-700' : 'text-blush-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`max-w-full truncate text-[0.62rem] font-extrabold ${
                    active ? 'text-blush-700' : 'text-blush-400'
                  }`}
                >
                  {item.label}
                </span>
                {badge > 0 && (
                  <span className="absolute right-1 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-blush-500 px-1 text-[0.55rem] font-extrabold text-white shadow">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
          <button
            onClick={() => setOpen(true)}
            className="flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl py-1.5 text-blush-400 transition active:text-blush-600"
          >
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <MenuGlyph />
            </span>
            <span className="text-[0.62rem] font-extrabold">More</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/60 px-4 pt-4 pb-3">
            <span className="font-display text-lg font-extrabold text-candy-dark">
              Find anything
            </span>
            <button
              onClick={() => {
                setOpen(false)
                setQuery('')
              }}
              aria-label="Close menu"
              className="btn-ghost shrink-0 !px-3 !py-2"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 pt-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search… notes, treats, music"
              autoComplete="off"
              className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-blush-800 shadow-sm outline-none placeholder:text-blush-400 focus:border-blush-300"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {q ? (
              matches.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">{matches.map((m) => tile(m.key))}</div>
              ) : (
                <p className="mt-10 text-center text-sm font-semibold text-blush-500">
                  Nothing matches “{query}”.
                </p>
              )
            ) : (
              GROUPS.map((g) => {
                const keys = order.filter((k) => g.keys.includes(k))
                if (keys.length === 0) return null
                return (
                  <div key={g.title} className="mb-5 last:mb-0">
                    <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-widest text-blush-400">
                      {g.title}
                    </p>
                    <div className="grid grid-cols-3 gap-3">{keys.map((k) => tile(k))}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}
