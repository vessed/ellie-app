import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { relativeTime } from '../lib/media'
import { WHO_NAME, type Who } from '../lib/types'
import { NotificationCenter } from './NotificationCenter'
import { Avatar } from './Avatar'
import { PlayerWidget } from './PlayerWidget'

function PresencePill() {
  const { as, presence } = useApp()
  const other: Who = as === 'you' ? 'ellie' : 'you'
  const otherLabel = as === 'ellie' ? 'Daddy' : WHO_NAME[other]

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(iv)
  }, [])

  const last = presence[other]
  const online = last !== undefined && now - last < 60_000
  const label = online
    ? `${otherLabel} is online now!`
    : last
      ? `${otherLabel} was online ${relativeTime(last, now)}`
      : `${otherLabel} hasn't been online yet`

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/60 px-2 py-1.5 shadow-sm sm:px-3">
      <div className="relative">
        <Avatar who={other} size={28} />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            online ? 'bg-emerald-400' : 'bg-blush-300'
          }`}
        />
      </div>
      <span className="hidden max-w-44 truncate text-xs font-extrabold text-blush-700 sm:inline">
        {label}
      </span>
    </div>
  )
}

export function TopBar() {
  const { as } = useApp()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar who={as} size={30} />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-xl font-extrabold text-blush-900 sm:text-2xl lg:text-3xl">
            Hi {WHO_NAME[as]}
          </p>
          <p className="hidden text-sm font-semibold text-blush-700/75 sm:block">
            Welcome back to our little bubble.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PresencePill />
        <div className="md:hidden">
          <NotificationCenter variant="icon" />
        </div>
        <PlayerWidget />
      </div>
    </header>
  )
}
