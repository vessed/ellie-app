import { useState, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import { prettyDate } from '../lib/media'
import { uid, type DateItem } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { EditIcon, PlusIcon, TrashIcon, CalendarIcon } from '../components/Icons'
import { Field, Modal, inputCls } from '../components/Modal'

const blank: DateItem = {
  id: '',
  title: '',
  detail: '',
  date: '',
  time: '',
  emoji: '💕',
}

const EMOJIS = ['💕', '🎬', '🧺', '🍜', '🍦', '🌸', '🎡', '🐾', '☕', '🎟️']

export function Dates() {
  const { dates, setDates, pushToast } = useApp()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateItem>(blank)
  const [editing, setEditing] = useState(false)

  const startNew = () => {
    setDraft(blank)
    setEditing(false)
    setOpen(true)
  }

  const startEdit = (d: DateItem) => {
    setDraft(d)
    setEditing(true)
    setOpen(true)
  }

  const save = () => {
    if (!draft.title.trim()) {
      pushToast('Give your date a little name first 💕', '🙈')
      return
    }
    if (editing) {
      setDates((prev) => prev.map((d) => (d.id === draft.id ? draft : d)))
      pushToast('Date updated ✨', '✅')
    } else {
      setDates((prev) => [{ ...draft, id: uid() }, ...prev])
      pushToast('New date added to your calendar 🎉', '🗓️')
    }
    setOpen(false)
  }

  const remove = (id: string) => {
    setDates((prev) => prev.filter((d) => d.id !== id))
    pushToast('Date removed', '🗑️')
  }

  const sorted = [...dates].sort((a, b) => (a.date < b.date ? -1 : 1))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🗓️"
        title="Our Dates"
        subtitle="Plan, edit and keep all your little adventures in one place."
        action={
          <button onClick={startNew} className="btn-candy">
            <PlusIcon className="h-4.5 w-4.5" />
            New date
          </button>
        }
      />

      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((d) => (
            <div key={d.id} className="glass p-5">
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blush-200 to-lilac-200 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    {d.emoji}
                  </div>
                  <div className="flex gap-1">
                    <IconBtn label="Edit" onClick={() => startEdit(d)}>
                      <EditIcon className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => remove(d.id)}>
                      <TrashIcon className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>

                <h3 className="font-display text-lg font-extrabold text-blush-900">
                  {d.title}
                </h3>
                {d.detail && (
                  <p className="mt-1 text-sm font-semibold text-blush-700/75">
                    {d.detail}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <span className="pill">
                    <CalendarIcon className="h-3.5 w-3.5 text-blush-500" />
                    {prettyDate(d.date) || 'No date'}
                  </span>
                  {d.time && <span className="pill">🕒 {d.time}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal
          title={editing ? 'Edit date' : 'Plan a new date'}
          emoji="💕"
          onClose={() => setOpen(false)}
        >
          <Field label="What are we doing?">
            <input
              autoFocus
              className={inputCls}
              placeholder="Cozy movie night"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="Little details">
            <textarea
              className={`${inputCls} min-h-20 resize-none`}
              placeholder="Blankets, popcorn, our favourite trilogy..."
              value={draft.detail}
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day">
              <input
                type="date"
                className={inputCls}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                className={inputCls}
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pick a vibe">
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft({ ...draft, emoji: e })}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                    draft.emoji === e
                      ? 'bg-blush-300 text-white shadow'
                      : 'bg-white/70 hover:bg-white'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <div className="mt-4 flex gap-3">
            <button onClick={save} className="btn-candy flex-1">
              {editing ? 'Save changes' : 'Add date'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-white hover:text-blush-600"
    >
      {children}
    </button>
  )
}

function Empty() {
  return (
    <div className="glass flex flex-col items-center justify-center p-10 text-center">
      <span className="text-4xl">🗓️</span>
      <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
        No dates planned yet
      </p>
      <p className="mt-1 max-w-sm text-sm font-semibold text-blush-500">
        Tap “New date” to plan your first little adventure together.
      </p>
    </div>
  )
}