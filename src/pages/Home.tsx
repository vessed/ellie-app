import { useState } from 'react'
import { useApp } from '../lib/store'
import { daysTogether, prettyToday, todayISO } from '../lib/media'
import { inputCls } from '../components/Modal'
import { EditIcon } from '../components/Icons'
import type { Route } from '../lib/types'
import {
  BlocksIcon,
  BookIcon,
  CalendarIcon,
  CameraIcon,
  GiftIcon,
  HeartIcon,
  MoodIcon,
  MusicIcon,
  NoteIcon,
  RibbonIcon,
  SparkleIcon,
  StarIcon,
  TodoIcon,
} from '../components/Icons'

type IconType = typeof CalendarIcon

const features: {
  title: string
  desc: string
  icon: IconType
  tint: string
  route?: Route
  soon?: boolean
}[] = [
  {
    title: 'Our Moods',
    desc: 'A board of how we’re both feeling.',
    icon: MoodIcon,
    tint: 'from-butter-200/80 to-mint-200/70',
    route: 'mood',
  },
  {
    title: 'Daily',
    desc: 'A puppy, a quote & daddy’s reminder.',
    icon: StarIcon,
    tint: 'from-butter-200/80 to-blush-200/70',
    route: 'daily',
  },
  {
    title: 'Checklist',
    desc: 'Our little routine for the day.',
    icon: TodoIcon,
    tint: 'from-mint-200/80 to-butter-200/70',
    route: 'todo',
  },
  {
    title: 'Playroom',
    desc: 'Games, our pup & little garden.',
    icon: BlocksIcon,
    tint: 'from-lilac-200/80 to-sky-200/70',
    route: 'playroom',
  },
  {
    title: 'Library',
    desc: 'Journals & cosy bedtime stories.',
    icon: BookIcon,
    tint: 'from-sky-200/80 to-lilac-200/70',
    route: 'library',
  },
  {
    title: 'Date Ideas',
    desc: 'Little adventures for us to try.',
    icon: CalendarIcon,
    tint: 'from-blush-200/80 to-lilac-200/70',
    route: 'dates',
  },
  {
    title: 'Memories',
    desc: 'Photos, quotes & silly moments.',
    icon: CameraIcon,
    tint: 'from-sky-200/80 to-mint-200/70',
    route: 'memories',
  },
  {
    title: 'Treat Jar',
    desc: 'Rewards you can work towards.',
    icon: GiftIcon,
    tint: 'from-butter-200/90 to-blush-200/70',
    route: 'treats',
  },
  {
    title: 'Our Songs',
    desc: 'The soundtrack of us.',
    icon: MusicIcon,
    tint: 'from-lilac-200/80 to-blush-200/70',
    route: 'music',
  },
  {
    title: "Ellie's Wishlist",
    desc: 'Little things Ellie is dreaming about.',
    icon: RibbonIcon,
    tint: 'from-blush-200/80 to-butter-200/80',
    route: 'wishlist',
  },
  {
    title: 'Rulebook',
    desc: 'Daddy’s rules and sweet reminders.',
    icon: EditIcon,
    tint: 'from-sky-200/80 to-mint-200/70',
    route: 'rules',
  },
  {
    title: 'Bucket List',
    desc: 'Everything we still wanna do.',
    icon: StarIcon,
    tint: 'from-mint-200/80 to-sky-200/70',
    soon: true,
  },
  {
    title: 'Love Notes',
    desc: 'Sweet nothings, saved forever.',
    icon: NoteIcon,
    tint: 'from-blush-200/80 to-butter-200/80',
    route: 'notes',
  },
]

export function Home() {
  const { setRoute, addHeart, pushToast } = useApp()

  const openCard = (route?: Route, soon?: boolean) => {
    if (route) setRoute(route)
    else if (soon) pushToast('Bucket list is coming soon ✨', '🌟')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="glass p-6 lg:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <span className="pill mb-4 bg-white/70">
              <HeartIcon className="h-3.5 w-3.5 text-blush-500" />
              our tiny universe
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-blush-900 lg:text-5xl">
              Every day with you is a
              <span className="text-candy"> little celebration</span>
            </h1>
            <p className="mt-3 text-sm font-semibold text-blush-800/80 lg:text-base">
              A soft, glossy home for all the sweet things we do together.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => addHeart()}
                className="btn-candy"
              >
                <HeartIcon className="h-4.5 w-4.5" />
                Send a heart
              </button>
              <button onClick={() => setRoute('dates')} className="btn-ghost">
                <CalendarIcon className="h-4.5 w-4.5" />
                Plan a date
              </button>
            </div>
          </div>

          <DaysCounter />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-blush-900">
              Our little corners
            </h2>
            <p className="text-sm font-semibold text-blush-700/70">
              Everything soft, sweet & ours.
            </p>
          </div>
          <button
            onClick={() => setRoute('settings')}
            className="btn-ghost shrink-0 text-sm"
          >
            <SparkleIcon className="h-4 w-4" />
            Customize
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              onClick={() => openCard(f.route, f.soon)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openCard(f.route, f.soon)
              }}
              className="glass group cursor-pointer p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div
                  className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.tint} text-blush-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-blush-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-blush-700/75">
                  {f.desc}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blush-500 opacity-0 transition-opacity group-hover:opacity-100">
                  open <span aria-hidden>→</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <ThisWeek />
          <TodayNote />
        </div>
      </section>
    </div>
  )
}

function DaysCounter() {
  const { anniversary, setAnniversary, pushToast } = useApp()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(anniversary)

  const days = daysTogether(anniversary)

  const save = () => {
    if (!draft) {
      pushToast('Pick a date first, cutie! 📅', '🌸')
      return
    }
    if (draft > todayISO()) {
      pushToast("That's in the future... set our real start date! 🌸", '📅')
      return
    }
    setAnniversary(draft)
    setEditing(false)
    pushToast('Anniversary saved — counting from today! 💞', '💞')
  }

  const startEdit = () => {
    setDraft(anniversary || '')
    setEditing(true)
  }

  return (
    <div className="glass-soft relative w-full max-w-xs self-stretch overflow-hidden rounded-3xl p-6 lg:self-center">
      <div className="absolute -right-6 -top-6 text-8xl opacity-20">💞</div>
      <div className="relative z-10">
        <p className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
          days together
        </p>

        {editing ? (
          <>
            <p className="mt-1 font-display font-extrabold text-blush-700">
              When did we become us?
            </p>
            <input
              type="date"
              value={draft}
              max={todayISO()}
              onChange={(e) => setDraft(e.target.value)}
              className={`${inputCls} mt-3`}
            />
            <div className="mt-3 flex gap-2">
              <button onClick={save} className="btn-candy !px-4 !py-2 text-sm">
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn-ghost !px-4 !py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        ) : anniversary ? (
          <>
            <p className="font-display text-6xl font-extrabold leading-none text-candy">
              {days.toLocaleString()}
            </p>
            <p className="mt-2 text-sm font-semibold text-blush-700/80">
              and counting, always & forever.
            </p>
            <button
              onClick={startEdit}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blush-500 transition hover:text-blush-600"
            >
              <EditIcon className="h-3.5 w-3.5" />
              change date
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-blush-700">
              Since when are we us? 💞
            </p>
            <p className="mt-2 text-sm font-semibold text-blush-700/75">
              Set our anniversary and I'll count every single day with you.
            </p>
            <button onClick={startEdit} className="btn-candy mt-4 w-full">
              <CalendarIcon className="h-4.5 w-4.5" />
              Set anniversary
            </button>
          </>
        )}
      </div>
      <div className="relative z-10 mt-4 flex gap-1">
        {[...Array(7)].map((_, i) => (
          <span
            key={i}
            className="h-2 flex-1 rounded-full bg-gradient-to-r from-blush-300 to-lilac-300"
            style={{ opacity: 0.45 + i * 0.08 }}
          />
        ))}
      </div>
    </div>
  )
}

function ThisWeek() {
  const { setRoute } = useApp()
  return (
    <div className="glass p-6 lg:col-span-3">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            This week
          </h3>
          <span className="pill">
            <CalendarIcon className="h-3.5 w-3.5 text-blush-500" />
            {prettyToday()}
          </span>
        </div>

        <div className="flex min-h-[168px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blush-200/70 bg-white/30 p-6 text-center">
          <span className="text-3xl">🗓️</span>
          <p className="mt-2 font-display font-extrabold text-blush-700">
            Nothing planned yet
          </p>
          <p className="mt-1 max-w-xs text-sm font-semibold text-blush-500">
            Your week is a blank page — fill it with something cute.
          </p>
          <button
            onClick={() => setRoute('dates')}
            className="btn-ghost mt-4 text-sm"
          >
            Add a date
          </button>
        </div>
      </div>
    </div>
  )
}

function TodayNote() {
  const { setRoute } = useApp()
  return (
    <div className="glass flex flex-col p-5 lg:col-span-2">
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Today's note
          </h3>
          <NoteIcon className="h-5 w-5 text-blush-400" />
        </div>
        <p className="flex-1 text-sm font-semibold leading-relaxed text-blush-800/85">
          "You're my favorite notification, my softest place to land, and my
          very best idea."
        </p>
        <button
          onClick={() => setRoute('notes')}
          className="btn-ghost mt-4 self-start"
        >
          Open love notes
        </button>
      </div>
    </div>
  )
}