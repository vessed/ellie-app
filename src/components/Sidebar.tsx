import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import type { Route } from '../lib/types'
import { NAV, loadNavOrder, SIDEBAR_ORDER_KEY } from '../lib/nav'
import { GripIcon } from './Icons'
import { NotificationCenter } from './NotificationCenter'
import { Avatar } from './Avatar'
import { suppressNextClick } from '../lib/sound'

const ROW_GAP = 6

interface DragState {
  key: Route
  startIndex: number
  startY: number
  overIndex: number
  dy: number
  rowStep: number
}

export function Sidebar() {
  const { route, setRoute, notes, as } = useApp()
  const unread = notes.filter((n) => n.to === as && !n.read).length

  const [order, setOrder] = useState<Route[]>(loadNavOrder)
  const [drag, setDrag] = useState<DragState | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const justDraggedRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(order))
  }, [order])

  const rowTransform = (i: number): string | undefined => {
    if (!drag) return undefined
    const { startIndex, overIndex, dy, rowStep } = drag
    if (i === startIndex) {
      return `translateY(${dy}px) scale(1.04)`
    }
    let slot = i
    if (startIndex < overIndex && i > startIndex && i <= overIndex) {
      slot = i - 1
    } else if (startIndex > overIndex && i >= overIndex && i < startIndex) {
      slot = i + 1
    }
    const off = (slot - i) * rowStep
    return off === 0 ? undefined : `translateY(${off}px)`
  }

  const startDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    item: Route,
    index: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const el = itemRefs.current[index]
    const rowHeight = el?.offsetHeight ?? 48
    setDrag({
      key: item,
      startIndex: index,
      startY: e.clientY,
      overIndex: index,
      dy: 0,
      rowStep: rowHeight + ROW_GAP,
    })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return
    const dy = e.clientY - drag.startY
    const moved = Math.round(dy / drag.rowStep)
    const overIndex = Math.max(
      0,
      Math.min(order.length - 1, drag.startIndex + moved),
    )
    setDrag((d) => (d ? { ...d, dy, overIndex } : d))
  }

  const onDragEnd = () => {
    if (!drag) return
    if (drag.overIndex !== drag.startIndex) {
      const next = [...order]
      const [movedItem] = next.splice(drag.startIndex, 1)
      next.splice(drag.overIndex, 0, movedItem)
      setOrder(next)
      justDraggedRef.current = true
    }
    setDrag(null)
    if (drag.key === route && drag.overIndex !== drag.startIndex) {
      suppressNextClick()
    }
  }

  return (
    <aside className="glass hidden w-60 shrink-0 flex-col p-5 md:flex lg:w-64">
      <div className="mb-6 flex items-center gap-3 px-1">
        <Avatar who={as} size={44} className="shadow-glow" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-lg font-extrabold text-candy-dark">
            Micah and Ellie
          </p>
          <p className="text-xs font-semibold text-blush-700/70">
            our little world
          </p>
        </div>
      </div>

      <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1 pb-1">
        {order.map((key, i) => {
          const item = NAV.find((n) => n.key === key)!
          const Icon = item.icon
          const isActive = route === item.key
          const isDragged = drag?.key === item.key
          const badge = item.key === 'notes' && unread > 0 ? unread : 0
          return (
            <div
              key={item.key}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              onClick={(e) => {
                if (justDraggedRef.current) {
                  justDraggedRef.current = false
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              style={{ transform: rowTransform(i) }}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition-transform duration-200 ease-out ${
                isActive
                  ? 'bg-white/80 text-blush-700 shadow-[0_14px_30px_-20px_rgba(251,98,165,0.95)]'
                  : 'text-blush-800/80 hover:bg-white/45'
              } ${isDragged ? 'z-20 shadow-lg' : 'z-0'}`}
            >
              <button
                onPointerDown={(e) => startDrag(e, item.key, i)}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
                aria-label={`Reorder ${item.label}`}
                className={`grid h-8 w-5 shrink-0 cursor-grab touch-none select-none place-items-center rounded-lg transition-colors ${
                  isDragged ? 'cursor-grabbing text-blush-600' : 'text-blush-400 hover:text-blush-600'
                }`}
              >
                <GripIcon className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  if (route === item.key) {
                    suppressNextClick()
                    return
                  }
                  setRoute(item.key)
                }}
                className="flex flex-1 items-center gap-2.5 text-left"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${
                    isActive
                      ? 'bg-gradient-to-br from-blush-300 to-lilac-300 text-white'
                      : 'bg-white/60 text-blush-500'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blush-500 px-1.5 text-[0.65rem] font-extrabold text-white shadow">
                    {badge}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      <NotificationCenter />
    </aside>
  )
}