import { lazy, Suspense, useEffect, useRef } from 'react'
import { AppProvider, useApp } from './lib/store'
import { ToastProvider } from './lib/toast'
import { PlayerProvider, usePlayer } from './lib/player'
import { BUILTIN_SONGS } from './lib/builtin'
import { softClick, consumeClickSound } from './lib/sound'
import { Background } from './components/Background'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { TopBar } from './components/TopBar'
import { Toasts } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Home } from './pages/Home'

/* Pages are split into their own chunks and only parsed/loaded when first
   opened, so the app uses less memory and starts faster. Home stays eager
   because it's the landing page. */
const Daily = lazy(() => import('./pages/Daily').then((m) => ({ default: m.Daily })))
const Dates = lazy(() => import('./pages/Dates').then((m) => ({ default: m.Dates })))
const Memories = lazy(() =>
  import('./pages/Memories').then((m) => ({ default: m.Memories })),
)
const Treats = lazy(() => import('./pages/Treats').then((m) => ({ default: m.Treats })))
const Notes = lazy(() => import('./pages/Notes').then((m) => ({ default: m.Notes })))
const Music = lazy(() => import('./pages/Music').then((m) => ({ default: m.Music })))
const Wishlist = lazy(() =>
  import('./pages/Wishlist').then((m) => ({ default: m.Wishlist })),
)
const Mood = lazy(() => import('./pages/Mood').then((m) => ({ default: m.Mood })))
const Todo = lazy(() => import('./pages/Todo').then((m) => ({ default: m.Todo })))
const Rules = lazy(() => import('./pages/Rules').then((m) => ({ default: m.Rules })))
const Playroom = lazy(() =>
  import('./pages/Playroom').then((m) => ({ default: m.Playroom })),
)
const Library = lazy(() =>
  import('./pages/Library').then((m) => ({ default: m.Library })),
)
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings })),
)

function PageFallback() {
  return (
    <div className="grid place-items-center py-24">
      <div className="animate-heartbeat text-4xl">💗</div>
    </div>
  )
}

function ClickSounds() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (consumeClickSound()) return
      const t = e.target as HTMLElement
      const c = t.closest(
        'button, a[href], select, summary, label, textarea, ' +
          'input:not([type="range"]), [role="button"], [role="checkbox"], ' +
          '[role="switch"], [role="radio"], [role="option"], [role="menuitem"], [data-sound]',
      )
      if (!c) return
      softClick()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}

/* Pauses the animated background while the window is hidden/backgrounded,
   which saves CPU/GPU (and battery) on laptops. */
function BackgroundPause() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.bgPaused = document.hidden ? '1' : ''
    }
    apply()
    document.addEventListener('visibilitychange', apply)
    return () => document.removeEventListener('visibilitychange', apply)
  }, [])
  return null
}

function AutoMusic() {
  const { playQueue } = usePlayer()
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    doneRef.current = true
    window.setTimeout(() => {
      playQueue(BUILTIN_SONGS, 0)
    }, 700)
  }, [playQueue])

  return null
}

function Screen() {
  const { route } = useApp()

  return (
    <div className="relative h-full w-full">
      <Background />
      <ClickSounds />
      <BackgroundPause />

      <div className="flex h-full w-full gap-6 p-3.5 sm:p-5 lg:gap-8 lg:p-7">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden pr-1 pb-24 md:pb-6">
          <TopBar />
          <Suspense fallback={<PageFallback />}>
            {route === 'home' && <Home />}
            {route === 'daily' && <Daily />}
            {route === 'dates' && <Dates />}
            {route === 'memories' && <Memories />}
            {route === 'treats' && <Treats />}
            {route === 'notes' && <Notes />}
            {route === 'music' && <Music />}
            {route === 'wishlist' && <Wishlist />}
            {route === 'mood' && <Mood />}
            {route === 'todo' && <Todo />}
            {route === 'rules' && <Rules />}
            {route === 'playroom' && <Playroom />}
            {route === 'library' && <Library />}
            {route === 'settings' && <Settings />}
          </Suspense>
        </main>
      </div>

      <Toasts />
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <PlayerProvider>
          <AutoMusic />
          <ErrorBoundary>
            <Screen />
          </ErrorBoundary>
        </PlayerProvider>
      </AppProvider>
    </ToastProvider>
  )
}
