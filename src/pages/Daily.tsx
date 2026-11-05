import { useEffect, useState } from 'react'
import { useApp, todayKey } from '../lib/store'
import { uid } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { Avatar } from '../components/Avatar'
import { inputCls } from '../components/Modal'
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from '../components/Icons'

const QUOTES = [
  'You are so much cuter than any puppy, and that is a big deal. 🐶',
  'Every day with you is my favorite day.',
  'You are my favorite hello and my hardest goodbye.',
  'Just be your adorable self — everything else falls into place.',
  'Your smile is my favorite place to be.',
  'I love you more than all the stars and all the polka dots.',
  'You make ordinary days feel like little adventures.',
  'Nobody can make my heart do what you do — no matter what. 💗',
  'You are softness, sunshine, and slightly too many snacks.',
  'If kisses were raindrops, you would never be dry.',
  'You are the best thing that ever happened to my phone’s wallpaper.',
  'Even grumpy days end softer with you in them.',
  'You are braver than you believe, and cuter than you know.',
  'Home is wherever you are, plus snacks.',
  'I would pick you in every single lifetime.',
]

function daySeed() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return now.getFullYear() * 1000 + day
}

/* Only breeds that read as extra-cute / puppy-like, so the daily puppy is always adorable. */
const CUTE_BREEDS = [
  'pomeranian',
  'corgi',
  'samoyed',
  'shihtzu',
  'pug',
  'husky',
  'shiba',
  'keeshond',
  'labrador',
]

export function Daily() {
  const { as, dailyReminders, setDailyReminders, dailyPhoto, setDailyPhoto, pushToast } =
    useApp()
  const isMicah = as === 'you'
  const seed = daySeed()
  const today = todayKey()

  const quote = QUOTES[seed % QUOTES.length]

  const todayIdx = dailyReminders.length
    ? seed % dailyReminders.length
    : -1
  const todaysReminder =
    todayIdx >= 0 ? dailyReminders[todayIdx] : null

  const puppySrc = dailyPhoto.date === today ? dailyPhoto.url : ''
  const [puppyBroken, setPuppyBroken] = useState(false)

  useEffect(() => {
    let alive = true
    if (dailyPhoto.date === today) {
      setPuppyBroken(false)
      return
    }
    let attempts = 0
    const pick = () => {
      if (!alive || attempts >= 3) return
      attempts += 1
      const breed =
        CUTE_BREEDS[Math.floor(Math.random() * CUTE_BREEDS.length)]
      fetch(`https://dog.ceo/api/breed/${breed}/images/random`)
        .then((r) => {
          if (!r.ok) throw new Error('puppy fetch failed')
          return r.json() as Promise<{ status?: string; message?: string }>
        })
        .then((j) => {
          if (!alive) return
          if (j && j.status === 'success' && j.message) {
            setDailyPhoto({ date: today, url: j.message })
            setPuppyBroken(false)
          } else {
            pick()
          }
        })
        .catch(() => pick())
    }
    pick()
    return () => {
      alive = false
    }
  }, [today, dailyPhoto.date, setDailyPhoto])

  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const addReminder = () => {
    if (!newText.trim()) {
      pushToast('Write the reminder first! ✍️', '📝')
      return
    }
    setDailyReminders((prev) => [
      ...prev,
      { id: uid(), text: newText.trim() },
    ])
    setNewText('')
    setAdding(false)
  }

  const saveEdit = () => {
    if (!editingId) return
    if (!editText.trim()) {
      pushToast('The words went missing! ✍️', '📝')
      return
    }
    setDailyReminders((prev) =>
      prev.map((it) =>
        it.id === editingId ? { ...it, text: editText.trim() } : it,
      ),
    )
    setEditingId(null)
    setEditText('')
  }

  const removeReminder = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setDailyReminders((prev) => prev.filter((it) => it.id !== id))
    setConfirmId(null)
  }

  const onPuppyError = () => {
    setPuppyBroken(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🐶"
        title="Daily"
        subtitle="Puppy of the day, a sweet quote, and a personal reminder for You ♡"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl p-0">
          <div className="relative z-10 flex items-center gap-2 p-5 pb-3">
            <span className="pill">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
                puppy of the day 🦴
              </span>
            </span>
          </div>
          {puppySrc && !puppyBroken ? (
            <img
              src={puppySrc}
              alt="Puppy of the day"
              onError={onPuppyError}
              className="relative z-0 min-h-[220px] w-full flex-1 object-cover"
            />
          ) : (
            <div className="relative z-0 grid min-h-[220px] w-full flex-1 place-items-center bg-gradient-to-br from-sky-200 to-mint-200 p-8 text-center">
              <p className="text-sm font-extrabold text-blush-600">
                The puppy is napping today! Come back tomorrow for a new one 🐾
              </p>
            </div>
          )}
        </section>

        <section className="glass-soft flex flex-col gap-4 rounded-3xl p-6">
          <span className="pill w-fit">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
              quote of the day 💌
            </span>
          </span>
          <p className="font-display text-2xl font-extrabold leading-snug text-blush-900">
            “{quote}”
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-blush-500">
            <Avatar who="you" size={20} /> — Your Daddy Micah
          </p>
        </section>
      </div>

      <section className="glass-soft flex flex-col gap-4 rounded-3xl p-6 text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="pill w-fit">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
              today's reminder 🎀
            </span>
          </span>
          {todaysReminder && (
            <span className="text-xs font-extrabold text-blush-400">
              #{todayIdx + 1} of {dailyReminders.length}
            </span>
          )}
        </div>

        {todaysReminder ? (
          <p className="font-display text-xl font-extrabold text-blush-900">
            {todaysReminder.text}
          </p>
        ) : (
          <p className="text-sm font-semibold text-blush-500">
            No reminders yet — daddy can add some to the rotation.
          </p>
        )}

        {!isMicah && (
          <p className="text-xs font-bold text-blush-400">
            A little note from daddy — yours for the day. 💕
          </p>
        )}
      </section>

      {isMicah && (
        <section className="glass-soft flex flex-col gap-4 rounded-3xl p-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold text-blush-900">
              ✍️ Manage reminders
            </h2>
            <span className="pill">{dailyReminders.length}</span>
          </div>
          <p className="text-sm font-semibold text-blush-600">
            One of these rotates in each day for Ellie. Only you can see this
            list.
          </p>

          {dailyReminders.length === 0 && (
            <p className="text-sm font-semibold text-blush-500">
              No reminders in rotation yet.
            </p>
          )}

          <ol className="space-y-2 text-sm font-semibold text-blush-800">
            {dailyReminders.map((item) => {
              const isToday = item.id === todaysReminder?.id
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl p-3 transition ${
                    isToday ? 'bg-blush-100 ring-1 ring-blush-300' : 'bg-white/50'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className={inputCls}
                      />
                      <button
                        onClick={saveEdit}
                        aria-label="Save"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blush-500 text-white shadow transition hover:bg-blush-600"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-white"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="flex-1">
                        {isToday && (
                          <span className="mr-2 rounded-full bg-blush-500 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-white">
                            today
                          </span>
                        )}
                        {item.text}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id)
                            setEditText(item.text)
                            setConfirmId(null)
                          }}
                          aria-label="Edit"
                          className="grid h-7 w-7 place-items-center rounded-lg text-blush-400 transition hover:bg-white/60 hover:text-blush-600"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeReminder(item.id)}
                          onBlur={() => setConfirmId(null)}
                          aria-label="Delete"
                          className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                            confirmId === item.id
                              ? 'bg-red-500 text-white'
                              : 'text-blush-400 hover:bg-white/60 hover:text-red-500'
                          }`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {confirmId && (
            <p className="text-xs font-bold text-red-500">
              Tap the trash again to delete that reminder.
            </p>
          )}

          {adding ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addReminder()
                  if (e.key === 'Escape') {
                    setAdding(false)
                    setNewText('')
                  }
                }}
                placeholder="Write a cute reminder for her…"
                className={inputCls}
              />
              <button
                onClick={addReminder}
                aria-label="Add"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blush-500 text-white shadow transition hover:bg-blush-600"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setAdding(false)
                  setNewText('')
                }}
                aria-label="Cancel"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-fit items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-sm font-bold text-blush-600 shadow transition hover:bg-white"
            >
              <PlusIcon className="h-4 w-4" /> Add to rotation
            </button>
          )}
        </section>
      )}
    </div>
  )
}