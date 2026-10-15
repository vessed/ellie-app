import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string
  subtitle: string
  emoji: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="pill mb-2">{emoji}</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-blush-900">
          {title}
        </h1>
        <p className="mt-1 max-w-xl text-sm font-semibold text-blush-700/80">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  )
}