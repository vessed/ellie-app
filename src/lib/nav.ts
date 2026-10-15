import type { Route } from './types'
import {
  BlocksIcon,
  BookIcon,
  CalendarIcon,
  CameraIcon,
  EditIcon,
  GiftIcon,
  HomeIcon,
  MoodIcon,
  MusicIcon,
  NoteIcon,
  RibbonIcon,
  SettingsIcon,
  StarIcon,
  TodoIcon,
} from '../components/Icons'

export interface NavItem {
  key: Route
  label: string
  icon: typeof HomeIcon
}

export const NAV: NavItem[] = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'daily', label: 'Daily', icon: StarIcon },
  { key: 'mood', label: 'Our Moods', icon: MoodIcon },
  { key: 'todo', label: 'Checklist', icon: TodoIcon },
  { key: 'playroom', label: 'Playroom', icon: BlocksIcon },
  { key: 'dates', label: 'Dates', icon: CalendarIcon },
  { key: 'memories', label: 'Memories', icon: CameraIcon },
  { key: 'treats', label: 'Treat Jar', icon: GiftIcon },
  { key: 'wishlist', label: 'Wishlist', icon: RibbonIcon },
  { key: 'music', label: 'Music', icon: MusicIcon },
  { key: 'notes', label: 'Love Notes', icon: NoteIcon },
  { key: 'library', label: 'Library', icon: BookIcon },
  { key: 'rules', label: 'Rulebook', icon: EditIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

export const SIDEBAR_ORDER_KEY = 'ellie-sidebar-order-v2'

export function loadNavOrder(): Route[] {
  const all: Route[] = NAV.map((n) => n.key)
  try {
    const raw = localStorage.getItem(SIDEBAR_ORDER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const seen = new Set<Route>()
        const out: Route[] = []
        for (const k of parsed) {
          const key = k as Route
          if (all.includes(key) && !seen.has(key)) {
            out.push(key)
            seen.add(key)
          }
        }
        for (const key of all) if (!seen.has(key)) out.push(key)
        if (out.length === all.length) return out
      }
    }
  } catch {
    /* ignore */
  }
  return all
}
