import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { uid, type Toast } from './types'
import { osNotify } from './notify'

/* Toasts live in their own tiny context on purpose: showing one used to change
   the giant app context value, which re-rendered *everything* (sidebar, the open
   page, even a running mini-game). Now only the <Toasts/> list re-renders. */

interface ToastContextValue {
  toasts: Toast[]
  pushToast: (message: string, emoji?: string, action?: () => void) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_FADE_MS = 340
const TOAST_LIFE_MS = 4500
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback(
    (message: string, emoji = '💗', action?: () => void) => {
      const id = uid()
      /* Mirror the toast to an OS notification when the window isn't focused,
         so a heart/note/mood that arrives in the background still gets noticed. */
      osNotify(message, emoji)
      setToasts((t) => {
        /* don't stack duplicates of the same message (let fading ones finish) */
        const withoutDup = t.filter((x) => x.leaving || x.message !== message)
        const next = [...withoutDup, { id, message, emoji, action }]
        /* only keep the newest fully visible; the rest fade out */
        let overflow = next.filter((x) => !x.leaving).length - MAX_VISIBLE
        for (let i = 0; i < next.length && overflow > 0; i++) {
          if (!next[i].leaving) {
            next[i] = { ...next[i], leaving: true }
            overflow--
          }
        }
        return next
      })
      window.setTimeout(() => {
        setToasts((t) =>
          t.map((x) => (x.id === id ? { ...x, leaving: true } : x)),
        )
      }, TOAST_LIFE_MS)
    },
    [],
  )

  const dismissToast = useCallback(
    (id: string) =>
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))),
    [],
  )

  const leavingRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const t of toasts) {
      if (t.leaving && !leavingRef.current.has(t.id)) {
        leavingRef.current.add(t.id)
        window.setTimeout(() => {
          leavingRef.current.delete(t.id)
          setToasts((prev) => prev.filter((x) => x.id !== t.id))
        }, TOAST_FADE_MS)
      }
    }
  }, [toasts])

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used inside ToastProvider')
  return ctx
}
