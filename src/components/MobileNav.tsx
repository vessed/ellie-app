import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { NAV, loadNavOrder } from '../lib/nav'
import { CloseIcon } from './Icons'
import type { Route } from '../lib/types'

/* Bottom tab bar + full-screen menu for phones. The desktop sidebar is hidden
   below the `md` breakpoint, so this is how the app is navigated on a phone. */
const QUICK: Route[] = ['home', 'daily', 'todo', 'playroom']

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
  const { route, setRoute } = useApp()
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<Route[]>(loadNavOrder)

  useEffect(() => {
    const refresh = () => setOrder(loadNavOrder())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const quick = QUICK.map((k) => NAV.find((n) => n.key === k)).filter(
    (x): x is (typeof NAV)[number] => Boolean(x),
  )

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around gap-1 border-t border-white/60 bg-white/85 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
        {quick.map((item) => {
          const Icon = item.icon
          const active = route === item.key
          return (
            <button
              key={item.key}
              onClick={() => setRoute(item.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                active ? 'text-blush-600' : 'text-blush-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[0.62rem] font-extrabold">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-blush-400 transition active:text-blush-600"
        >
          <MenuGlyph />
          <span className="text-[0.62rem] font-extrabold">More</span>
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between border-b border-white/60 px-5 pt-4 pb-3">
            <span className="font-display text-lg font-extrabold text-candy-dark">
              Menu
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="btn-ghost !px-3 !py-2"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="grid flex-1 grid-cols-3 content-start gap-3 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {order.map((key) => {
              const item = NAV.find((n) => n.key === key)
              if (!item) return null
              const Icon = item.icon
              const active = route === key
              return (
                <button
                  key={key}
                  onClick={() => {
                    setOpen(false)
                    setRoute(key)
                  }}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/60 px-2 py-4 text-center shadow-sm transition active:scale-95"
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl transition ${
                      active
                        ? 'bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow-glow'
                        : 'bg-white/70 text-blush-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-extrabold text-blush-800">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
