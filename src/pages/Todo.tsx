import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import {
  uid,
  WHO_NAME,
  type TodoDayLog,
  type TodoExtra,
  type TodoLogTask,
  type TodoSection,
  type TodoTask,
} from '../lib/types'
import { todayKey } from '../lib/store'
import { PageHeader } from '../components/PageHeader'
import { inputCls } from '../components/Modal'
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  GripIcon,
  PlusIcon,
  StarIcon,
  TodoIcon,
  TrashIcon,
} from '../components/Icons'
import { suppressNextClick } from '../lib/sound'

const SECTIONS: { key: TodoSection; label: string; emoji: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '☀️' },
  { key: 'midday', label: 'Midday', emoji: '🌤️' },
  { key: 'night', label: 'Night', emoji: '🌙' },
]

function prettyDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function Todo() {
  const { as, todoRoutine, setTodoRoutine, todoDay, setTodoDay, todoLog, setTodoLog, pushToast } =
    useApp()
  const today = todayKey()
  const canEdit = as === 'you'
  const isMicah = as === 'you'

  const [addingSection, setAddingSection] = useState<TodoSection | null>(null)
  const [newText, setNewText] = useState('')
  const [newTime, setNewTime] = useState('')
  const [editing, setEditing] = useState<TodoTask | null>(null)
  const [editText, setEditText] = useState('')
  const [editTime, setEditTime] = useState('')
  const [extraText, setExtraText] = useState('')
  const [newRoutineIds, setNewRoutineIds] = useState<Set<string>>(new Set())
  const [showCal, setShowCal] = useState(false)
  const [viewLog, setViewLog] = useState<TodoDayLog | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const routine = useMemo(
    () => [
      ...todoRoutine.filter((t) => t.section === 'morning'),
      ...todoRoutine.filter((t) => t.section === 'midday'),
      ...todoRoutine.filter((t) => t.section === 'night'),
    ],
    [todoRoutine],
  )

  const taskStatus = (id: string) => todoDay.routine[id]?.done ?? false
  const extraStatus = (id: string) => todoDay.extraStatus[id]?.done ?? false

  const routineDone = routine.filter((t) => taskStatus(t.id)).length
  const allRoutineDone = routine.length > 0 && routineDone === routine.length

  const addTask = (section: TodoSection) => {
    if (!newText.trim()) {
      pushToast('Write the task first! ✍️', '📝')
      return
    }
    const task: TodoTask = {
      id: uid(),
      text: newText.trim(),
      time: newTime.trim(),
      section,
    }
    setTodoRoutine((prev) => [...prev, task])
    setNewRoutineIds((s) => new Set(s).add(task.id))
    setNewText('')
    setNewTime('')
    setAddingSection(null)
  }

  const saveEdit = () => {
    if (!editing) return
    if (!editText.trim()) {
      pushToast('The task needs some words! ✍️', '📝')
      return
    }
    setTodoRoutine((prev) =>
      prev.map((t) =>
        t.id === editing.id ? { ...t, text: editText.trim(), time: editTime.trim() } : t,
      ),
    )
    setEditing(null)
  }

  const removeTask = (id: string) => {
    setTodoRoutine((prev) => prev.filter((t) => t.id !== id))
  }

  /* Reorder within a section. The routine array is synced, so the new order is
     the same for both Micah and Ellie. Other sections keep their own order. */
  const reorderSection = (section: TodoSection, next: TodoTask[]) => {
    setTodoRoutine((prev) => [
      ...prev.filter((t) => t.section !== section),
      ...next,
    ])
  }

  const toggleTask = (id: string) => {
    setTodoDay((prev) => ({
      ...prev,
      routine: {
        ...prev.routine,
        [id]: prev.routine[id]?.done
          ? { done: false }
          : { done: true, doneAt: Date.now() },
      },
    }))
  }

  const toggleExtra = (id: string) => {
    setTodoDay((prev) => ({
      ...prev,
      extraStatus: {
        ...prev.extraStatus,
        [id]: prev.extraStatus[id]?.done
          ? { done: false }
          : { done: true, doneAt: Date.now() },
      },
    }))
  }

  const addExtra = () => {
    if (!extraText.trim()) {
      pushToast('Tell us the extra task! ✨', '📝')
      return
    }
    const extra: TodoExtra = { id: uid(), text: extraText.trim() }
    setTodoDay((prev) => ({ ...prev, extras: [...prev.extras, extra] }))
    setExtraText('')
  }

  const removeExtra = (id: string) => {
    setTodoDay((prev) => {
      const { [id]: _gone, ...rest } = prev.extraStatus
      return { ...prev, extras: prev.extras.filter((e) => e.id !== id), extraStatus: rest }
    })
  }

  const setRating = (r: number) => setTodoDay((prev) => ({ ...prev, rating: r }))
  const setMood = (m: string) => setTodoDay((prev) => ({ ...prev, mood: m }))

  const finishDay = () => {
    if (!allRoutineDone) {
      pushToast('Finish every task in the checklist first! 💪', '📝')
      return
    }
    const tasks: TodoLogTask[] = routine.map((t) => ({
      id: t.id,
      text: t.text,
      time: t.time,
      section: t.section,
      done: taskStatus(t.id),
    }))
    const extras = todoDay.extras.map((e) => ({
      id: e.id,
      text: e.text,
      done: extraStatus(e.id),
    }))
    const entry: TodoDayLog = {
      id: uid(),
      date: today,
      tasks,
      extras,
      rating: todoDay.rating,
      mood: todoDay.mood.trim(),
      completedAt: Date.now(),
      grade: 0,
    }
    setTodoLog((prev) => [entry, ...prev])
    setTodoDay((prev) => ({ ...prev, completed: true, completedAt: Date.now() }))
    pushToast("Today's saved — great work! 🌟", '🎉')
  }

  const gradeDay = (id: string, grade: number) => {
    setTodoLog((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              grade,
              gradedAt: Date.now(),
            }
          : l,
      ),
    )
    pushToast(`Graded a ${grade}/10 💗`, '⭐')
  }

  const deleteLog = (id: string) => {
    setTodoLog((prev) => prev.filter((l) => l.id !== id))
    setViewLog((v) => (v && v.id === id ? null : v))
    pushToast('Saved day deleted.', '🗑️')
  }

  const resetAll = () => {
    setTodoRoutine([])
    setTodoDay((prev) => ({
      ...prev,
      routine: {},
      extras: [],
      extraStatus: {},
      rating: 0,
      mood: '',
      completed: false,
    }))
    pushToast('To-do list cleared — start fresh.', '🧹')
  }

  const history = useMemo(
    () => [...todoLog].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [todoLog],
  )

  const openDay = (date: string) => {
    const log = history.find((h) => h.date === date)
    if (!log) {
      pushToast('No saved checklist for this day yet.', '📅')
      return
    }
    setViewLog(log)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="📝"
        title="Daily To-Do List"
        subtitle={`Your little routine for ${prettyDate(today)}.`}
      />

      {/* Day header: date + calendar on the left, live date on the right */}
      <div className="glass flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow-glow">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold text-blush-900">
              {prettyDate(today)}
            </p>
            <p className="text-xs font-bold text-blush-500">
              {WHO_NAME[as]} viewing · the checklist rolls over at midnight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (showCal) {
                suppressNextClick()
                return
              }
              setShowCal(true)
            }}
            className="btn-ghost"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </button>
          {canEdit && (
            <button
              onClick={() => {
                if (confirmReset) {
                  suppressNextClick()
                  resetAll()
                  return
                }
                setConfirmReset(true)
                window.setTimeout(() => setConfirmReset(false), 3000)
              }}
              className={`btn-ghost ${confirmReset ? '!bg-blush-500 !text-white' : ''}`}
            >
              <TrashIcon className="h-4 w-4" />
              {confirmReset ? 'Sure?' : 'Reset list'}
            </button>
          )}
          <span className="pill">
            <TodoIcon className="h-3.5 w-3.5 text-blush-500" />
            {routineDone}/{routine.length} done
          </span>
        </div>
      </div>

      {showCal && (
        <MiniCalendar
          today={today}
          completed={history.map((h) => h.date)}
          onPick={isMicah ? openDay : undefined}
          onClose={() => setShowCal(false)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Checklist */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {canEdit && (
            <div className="glass-soft p-4 text-sm font-semibold text-blush-600">
              Tap + on any section to add a task. You can edit the time later with
              the pencil. 🖊️
            </div>
          )}

          {SECTIONS.map((s) => {
            const items = todoRoutine.filter((t) => t.section === s.key)
            const done = items.filter((t) => taskStatus(t.id)).length
            return (
              <section key={s.key} className="glass p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-blush-900">
                    <span>{s.emoji}</span>
                    {s.label}
                    {items.length > 0 && (
                      <span className="pill !px-2 !py-0.5 text-[0.65rem]">
                        {done}/{items.length}
                      </span>
                    )}
                  </h3>
                  {canEdit && (
                    <button
                      onClick={() => {
                        if (addingSection === s.key) {
                          suppressNextClick()
                          setAddingSection(null)
                          return
                        }
                        setAddingSection(s.key)
                      }}
                      className="btn-ghost !px-3 !py-1.5 text-sm"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </button>
                  )}
                </div>

                {items.length === 0 && (
                  <p className="text-sm font-semibold text-blush-400">
                    Nothing here yet.
                    {canEdit ? ' Add a task for this part of the day. ↓' : ''}
                  </p>
                )}

                <RoutineSectionList
                  items={items}
                  canEdit={canEdit}
                  taskStatus={taskStatus}
                  newRoutineIds={newRoutineIds}
                  onReorder={(next) => reorderSection(s.key, next)}
                  onToggle={toggleTask}
                  onEdit={(t) => {
                    setEditing(t)
                    setEditText(t.text)
                    setEditTime(t.time)
                  }}
                  onRemove={removeTask}
                />

                {addingSection === s.key && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 bg-white/50 p-3 !rounded-2xl">
                    <input
                      className={`${inputCls} !w-auto flex-1 min-w-40`}
                      placeholder="Task…"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addTask(s.key)
                      }}
                      autoFocus
                    />
                    <input
                      className={`${inputCls} !w-32`}
                      placeholder="Time (7:30pm)"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                    <button onClick={() => addTask(s.key)} className="btn-candy">
                      <CheckIcon className="h-4 w-4" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        suppressNextClick()
                        setAddingSection(null)
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>
            )
          })}

          {as === 'ellie' || todoDay.completed ? (
            <div className="glass p-5">
              {as === 'ellie' ? (
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-blush-900">
                    <StarIcon className="h-5 w-5" />
                    How was today?
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-blush-500">
                    Rate today and leave a little mood note for Micah.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        disabled={todoDay.completed}
                        onClick={() => {
                          if (todoDay.completed && todoDay.rating === n) {
                            suppressNextClick()
                            return
                          }
                          setRating(n)
                        }}
                        className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold transition ${
                          todoDay.rating === n
                            ? 'bg-blush-500 text-white shadow'
                            : 'bg-white/70 text-blush-500 hover:bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder="What feeling are you carrying today?"
                      value={todoDay.mood}
                      onChange={(e) => setMood(e.target.value)}
                      disabled={todoDay.completed}
                      maxLength={160}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-blush-900">
                    <StarIcon className="h-5 w-5" />
                    Today's wrap-up
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-blush-500">
                    Ellie saves this here + you'll see it in the archive.
                  </p>
                  <p className="mt-4 text-lg font-extrabold text-blush-700">
                    {todoDay.rating > 0 ? `${todoDay.rating}/10` : 'Not rated yet'}
                    {todoDay.mood ? ` — “${todoDay.mood}”` : ''}
                  </p>
                </div>
              )}

              <div className="mt-5">
                {as === 'ellie' && !todoDay.completed ? (
                  <button
                    onClick={finishDay}
                    disabled={!allRoutineDone}
                    className="btn-candy w-full !py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {allRoutineDone ? "I'm Done! Save today 💗" : 'Finish the checklist to save'}
                  </button>
                ) : todoDay.completed ? (
                  <div className="rounded-2xl bg-white/60 p-4 text-center">
                    <p className="font-display text-lg font-extrabold text-blush-700">
                      🌟 Saved! Micah can see it in the archive.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Extra tasks for the day */}
          <section className="glass-soft p-5">
            <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-blush-900">
              <span>🎯</span> Extra Goals for Today
            </h3>
            <p className="mt-1 text-sm font-semibold text-blush-500">
              Something specific for {prettyDate(today).split(',')[0]}. These vanish
              at midnight.
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {todoDay.extras.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 transition"
                >
                  <button
                    role="checkbox"
                    aria-checked={extraStatus(e.id)}
                    onClick={() => toggleExtra(e.id)}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
                      extraStatus(e.id)
                        ? 'border-blush-500 bg-blush-500 text-white'
                        : 'border-blush-300 bg-white text-transparent hover:border-blush-500'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <p
                    className={`flex-1 text-sm font-bold ${
                      extraStatus(e.id)
                        ? 'text-blush-400 line-through'
                        : 'text-blush-800'
                    }`}
                  >
                    {e.text}
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => removeExtra(e.id)}
                      aria-label="Remove extra task"
                      className="grid h-8 w-8 place-items-center rounded-xl text-blush-400 transition hover:bg-blush-100 hover:text-blush-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {todoDay.extras.length === 0 && (
                <p className="text-sm font-semibold text-blush-400">
                  No extras yet. {canEdit ? 'Add one below for this day only. ↓' : 'Micah may add some.'}
                </p>
              )}
            </div>

            {canEdit && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="A special task just for today…"
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addExtra()
                  }}
                />
                <button onClick={addExtra} className="btn-candy">
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right rail: archive for Micah */}
        <div className="flex flex-col gap-5">
          {as === 'you' ? (
            <HistoryPanel
              history={history}
              onGrade={gradeDay}
              onDelete={deleteLog}
            />
          ) : (
            <div className="glass-soft p-5 text-center">
              <p className="text-3xl">🔒</p>
              <p className="mt-2 font-display font-extrabold text-blush-600">
                The archive is Micah's corner
              </p>
              <p className="mt-1 text-sm font-semibold text-blush-500">
                He can look back at every saved day, your ratings, and how you
                felt about each one.
              </p>
            </div>
          )}
        </div>
      </div>

      {viewLog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-blush-900/25 backdrop-blur-sm"
            onClick={() => setViewLog(null)}
          />
          <div className="glass relative w-full max-w-lg animate-pop !rounded-3xl p-6">
            <div className="absolute right-4 top-4 flex items-center gap-1">
              {isMicah && (
                <button
                  onClick={() => deleteLog(viewLog.id)}
                  aria-label="Delete this saved day"
                  title="Delete this saved day"
                  className="grid h-9 w-9 place-items-center rounded-full text-blush-400 transition hover:bg-white/60 hover:text-blush-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setViewLog(null)}
                className="grid h-9 w-9 place-items-center rounded-full text-blush-500 transition hover:bg-white/60"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-extrabold text-blush-900">
                {prettyDate(viewLog.date)}
              </p>
              <p className="text-xs font-bold text-blush-500">
                Saved checklist from this day
                {viewLog.grade > 0 ? ` · your grade ${viewLog.grade}/10` : ''}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {viewLog.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-white ${
                      t.done ? 'bg-blush-500' : 'bg-blush-200'
                    }`}
                  >
                    {t.done && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span
                    className={`font-bold ${
                      t.done ? 'text-blush-400 line-through' : 'text-blush-700'
                    }`}
                  >
                    {t.text}
                    {t.time ? ` · 🕒 ${t.time}` : ''}
                  </span>
                </div>
              ))}
              {viewLog.extras.length > 0 && (
                <>
                  <div className="my-1 border-t border-blush-200/70" />
                  {viewLog.extras.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-white ${
                          e.done ? 'bg-lilac-400' : 'bg-lilac-200'
                        }`}
                      >
                        {e.done && <CheckIcon className="h-3 w-3" />}
                      </span>
                      <span
                        className={`font-bold ${
                          e.done
                            ? 'text-blush-400 line-through'
                            : 'text-blush-700'
                        }`}
                      >
                        {e.text}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-blush-50/70 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-blush-500">
                Ellie said
              </p>
              <p className="mt-1 font-display text-lg font-extrabold text-blush-800">
                {viewLog.rating > 0 ? `${viewLog.rating}/10 stars` : 'No rating'}
              </p>
              {viewLog.mood && (
                <p className="mt-1 text-sm font-semibold italic text-blush-700">
                  “{viewLog.mood}”
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-blush-900/25 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          />
          <div className="glass relative w-full max-w-md animate-pop !rounded-3xl p-5">
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-xl font-extrabold text-blush-900">
                  Edit task
                </h3>
                <button
                  onClick={() => setEditing(null)}
                  className="grid h-9 w-9 place-items-center rounded-full text-blush-500 transition hover:bg-white/60"
                  aria-label="Close"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-blush-500">
                  Task
                </span>
                <input
                  className={`${inputCls}`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              </label>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-blush-500">
                  Time
                </span>
                <input
                  className={`${inputCls}`}
                  placeholder="e.g. 7:30pm"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="btn-ghost">
                  Cancel
                </button>
                <button onClick={saveEdit} className="btn-candy">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Drag-to-reorder, mirroring the sidebar. Order lives on the synced
   `todoRoutine` list, so both of you always see the same order. */
function useReorder<T extends { id: string }>(
  items: T[],
  onReorder: (next: T[]) => void,
) {
  const [drag, setDrag] = useState<{
    index: number
    overIndex: number
    startY: number
    dy: number
    rowStep: number
  } | null>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const begin = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const rowStep = (refs.current[index]?.offsetHeight ?? 48) + 8
    setDrag({ index, overIndex: index, startY: e.clientY, dy: 0, rowStep })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    setDrag((d) => {
      if (!d) return d
      const dy = e.clientY - d.startY
      const moved = Math.round(dy / d.rowStep)
      const overIndex = Math.max(0, Math.min(items.length - 1, d.index + moved))
      return { ...d, dy, overIndex }
    })
  }

  const end = () => {
    setDrag((d) => {
      if (d && d.overIndex !== d.index) {
        const next = [...items]
        const [moved] = next.splice(d.index, 1)
        next.splice(d.overIndex, 0, moved)
        onReorder(next)
      }
      return null
    })
  }

  const style = (i: number): React.CSSProperties | undefined => {
    if (!drag) return undefined
    const { index, overIndex, dy, rowStep } = drag
    if (i === index) {
      return {
        transform: `translateY(${dy}px) scale(1.03)`,
        zIndex: 20,
        position: 'relative',
      }
    }
    let slot = i
    if (index < overIndex && i > index && i <= overIndex) slot = i - 1
    else if (index > overIndex && i >= overIndex && i < index) slot = i + 1
    const off = (slot - i) * rowStep
    return off === 0 ? undefined : { transform: `translateY(${off}px)` }
  }

  return { drag, refs, begin, move, end, style }
}

function RoutineSectionList({
  items,
  canEdit,
  taskStatus,
  newRoutineIds,
  onReorder,
  onToggle,
  onEdit,
  onRemove,
}: {
  items: TodoTask[]
  canEdit: boolean
  taskStatus: (id: string) => boolean
  newRoutineIds: Set<string>
  onReorder: (next: TodoTask[]) => void
  onToggle: (id: string) => void
  onEdit: (t: TodoTask) => void
  onRemove: (id: string) => void
}) {
  const drag = useReorder(items, onReorder)
  return (
    <div className="flex flex-col gap-2">
      {items.map((t, i) => (
        <div
          key={t.id}
          ref={(el) => {
            drag.refs.current[i] = el
          }}
          style={drag.style(i)}
          className={
            drag.drag?.index === i
              ? ''
              : 'transition-transform duration-200 ease-out'
          }
        >
          <TaskRow
            task={t}
            done={taskStatus(t.id)}
            fresh={newRoutineIds.has(t.id)}
            canEdit={canEdit}
            handle={
              canEdit ? (
                <button
                  onPointerDown={(e) => drag.begin(e, i)}
                  onPointerMove={drag.move}
                  onPointerUp={drag.end}
                  onPointerCancel={drag.end}
                  aria-label={`Reorder ${t.text}`}
                  title="Drag to move"
                  className={`grid h-8 w-4 shrink-0 cursor-grab touch-none select-none place-items-center rounded-lg transition-colors ${
                    drag.drag?.index === i
                      ? 'cursor-grabbing text-blush-600'
                      : 'text-blush-300 hover:text-blush-600'
                  }`}
                >
                  <GripIcon className="h-4 w-4" />
                </button>
              ) : undefined
            }
            onToggle={() => onToggle(t.id)}
            onEdit={() => onEdit(t)}
            onRemove={() => onRemove(t.id)}
          />
        </div>
      ))}
    </div>
  )
}

function TaskRow({
  task,
  done,
  fresh,
  canEdit,
  handle,
  onToggle,
  onEdit,
  onRemove,
}: {
  task: TodoTask
  done: boolean
  fresh: boolean
  canEdit: boolean
  handle?: ReactNode
  onToggle: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 transition">
      {handle}
      <button
        role="checkbox"
        aria-checked={done}
        onClick={onToggle}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
          done
            ? 'border-blush-500 bg-blush-500 text-white'
            : 'border-blush-300 bg-white text-transparent hover:border-blush-500'
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold ${
            done ? 'text-blush-400 line-through' : 'text-blush-800'
          }`}
        >
          {task.text}
        </p>
        {task.time && (
          <p className="text-xs font-bold text-blush-400">🕒 {task.time}</p>
        )}
      </div>
      {fresh && (
        <span className="pill !px-2 !py-0.5 text-[0.6rem]">new</span>
      )}
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit task"
            className="grid h-8 w-8 place-items-center rounded-xl text-blush-400 transition hover:bg-blush-100 hover:text-blush-600"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove task"
            className="grid h-8 w-8 place-items-center rounded-xl text-blush-400 transition hover:bg-blush-100 hover:text-blush-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function HistoryPanel({
  history,
  onGrade,
  onDelete,
}: {
  history: TodoDayLog[]
  onGrade: (id: string, grade: number) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="glass p-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-blush-900">
        <StarIcon className="h-5 w-5" />
        Saved Days
      </h3>
      <p className="mt-1 text-sm font-semibold text-blush-500">
        Every checklist Ellie finishes lands here — with her rating and mood note.
        You can grade how she did.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {history.length === 0 && (
          <div className="rounded-2xl bg-white/50 p-5 text-center">
            <p className="text-2xl">🌱</p>
            <p className="mt-2 text-sm font-bold text-blush-600">
              No saved days yet. Once Ellie finishes today, it'll show up here.
            </p>
          </div>
        )}

        {history.map((h) => {
          const progress = h.tasks.filter((t) => t.done).length
          const isOpen = open === h.id
          return (
            <div key={h.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex w-full items-center gap-2">
                <button
                  onClick={() => {
                    if (isOpen) {
                      suppressNextClick()
                      setOpen(null)
                      return
                    }
                    setOpen(h.id)
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blush-200 to-lilac-200 text-sm">
                    📅
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-extrabold text-blush-800">
                      {prettyDate(h.date)}
                    </p>
                    <p className="text-xs font-bold text-blush-500">
                      {progress}/{h.tasks.length} tasks · rated{' '}
                      {h.rating > 0 ? `${h.rating}/10` : '—'}
                      {h.grade > 0 ? ` · your grade ${h.grade}/10` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-blush-400 transition ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {confirmDelete === h.id ? (
                  <button
                    onClick={() => {
                      suppressNextClick()
                      onDelete(h.id)
                      setConfirmDelete(null)
                    }}
                    className="shrink-0 rounded-xl bg-blush-500 px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-blush-600"
                  >
                    Sure?
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      suppressNextClick()
                      setConfirmDelete(h.id)
                      window.setTimeout(() => setConfirmDelete(null), 3000)
                    }}
                    aria-label="Delete saved day"
                    title={confirmDelete === h.id ? 'Click again to delete' : 'Delete saved day'}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition hover:bg-blush-100 ${
                      confirmDelete === h.id ? 'text-blush-500' : 'text-blush-300 hover:text-blush-600'
                    }`}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="mt-3 rounded-2xl bg-white/60 p-4">
                  <div className="flex flex-col gap-1.5">
                    {h.tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-white ${
                            t.done ? 'bg-blush-500' : 'bg-blush-200'
                          }`}
                        >
                          {t.done && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span
                          className={`font-bold ${
                            t.done ? 'text-blush-400 line-through' : 'text-blush-700'
                          }`}
                        >
                          {t.text}
                          {t.time ? ` · 🕒 ${t.time}` : ''}
                        </span>
                      </div>
                    ))}
                    {h.extras.length > 0 && (
                      <>
                        <div className="my-1 border-t border-blush-200/70" />
                        {h.extras.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-white ${
                                e.done ? 'bg-lilac-400' : 'bg-lilac-200'
                              }`}
                            >
                              {e.done && <CheckIcon className="h-3 w-3" />}
                            </span>
                            <span
                              className={`font-bold ${
                                e.done ? 'text-blush-400 line-through' : 'text-blush-700'
                              }`}
                            >
                              {e.text}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl bg-blush-50/70 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-blush-500">
                      Ellie said
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-blush-800">
                      {h.rating > 0 ? `${h.rating}/10 stars` : 'No rating'}
                    </p>
                    {h.mood && (
                      <p className="mt-1 text-sm font-semibold italic text-blush-700">
                        “{h.mood}”
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-blush-500">
                      Your grade (1–10)
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => onGrade(h.id, n)}
                          className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold transition ${
                            h.grade === n
                              ? 'bg-blush-500 text-white shadow'
                              : 'bg-white/80 text-blush-500 hover:bg-white'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniCalendar({
  today,
  completed,
  onPick,
  onClose,
}: {
  today: string
  completed: string[]
  onPick?: (date: string) => void
  onClose: () => void
}) {
  const [shown, setShown] = useState(() => {
    const d = new Date(`${today}T00:00:00`)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const first = new Date(shown.y, shown.m, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(shown.y, shown.m + 1, 0).getDate()
  const cell = (d: number) =>
    `${shown.y}-${String(shown.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const changeMonth = (delta: number) => {
    const nd = new Date(shown.y, shown.m + delta, 1)
    setShown({ y: nd.getFullYear(), m: nd.getMonth() })
  }

  return (
    <div className="glass max-w-md animate-pop p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="grid h-8 w-8 place-items-center rounded-xl text-blush-500 transition hover:bg-white/60"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-display text-base font-extrabold text-blush-800">
          {MONTHS[shown.m]} {shown.y}
        </p>
        <button
          onClick={() => changeMonth(1)}
          className="grid h-8 w-8 place-items-center rounded-xl text-blush-500 transition hover:bg-white/60"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span
            key={i}
            className="text-[0.65rem] font-extrabold uppercase text-blush-400"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: startWeekday }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const k = cell(d)
          const isToday = k === today
          const isDone = completed.includes(k)
          const clickable = isDone && !!onPick
          const cls = `grid h-9 w-full place-items-center rounded-xl text-sm font-extrabold transition ${
            isToday
              ? 'bg-blush-500 text-white shadow'
              : isDone
                ? 'bg-lilac-200 text-blush-700'
                : 'text-blush-600 hover:bg-white/60'
          } ${clickable ? 'cursor-pointer hover:scale-105' : ''}`
          return clickable ? (
            <button
              key={d}
              title={clickable ? `View ${prettyDate(k)}` : k}
              onClick={() => onPick!(k)}
              className={cls}
            >
              {isDone && !isToday ? '★' : d}
            </button>
          ) : (
            <span key={d} title={k} className={cls}>
              {isDone && !isToday ? '★' : d}
            </span>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-blush-500">
        <span>
          ★ = a saved day{onPick ? ' · tap a ★ to view it' : ''}
        </span>
        <button onClick={onClose} className="btn-ghost !px-3 !py-1">
          Close
        </button>
      </div>
    </div>
  )
}