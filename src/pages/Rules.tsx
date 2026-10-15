import { useState } from 'react'
import { useApp } from '../lib/store'
import { uid, type RuleItem } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { inputCls } from '../components/Modal'
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from '../components/Icons'

type ListKey = 'rules' | 'reminders'

function ListCard({
  listKey,
  title,
  emoji,
  ordered,
  emptyText,
  addLabel,
}: {
  listKey: ListKey
  title: string
  emoji: string
  ordered: boolean
  emptyText: string
  addLabel: string
}) {
  const { as, rules, setRules, reminders, setReminders, pushToast } = useApp()
  const canEdit = as === 'you'
  const items = listKey === 'rules' ? rules : reminders
  const setItems = listKey === 'rules' ? setRules : setReminders

  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const add = () => {
    if (!newText.trim()) {
      pushToast('Write it first! ✍️', '📝')
      return
    }
    setItems((prev) => [...prev, { id: uid(), text: newText.trim() }])
    setNewText('')
    setAdding(false)
  }

  const startEdit = (item: RuleItem) => {
    setEditingId(item.id)
    setEditText(item.text)
    setConfirmId(null)
  }

  const saveEdit = () => {
    if (!editingId) return
    if (!editText.trim()) {
      pushToast('The words went missing! ✍️', '📝')
      return
    }
    setItems((prev) =>
      prev.map((it) => (it.id === editingId ? { ...it, text: editText.trim() } : it)),
    )
    setEditingId(null)
    setEditText('')
  }

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== id))
    setConfirmId(null)
  }

  return (
    <div className="glass-soft flex flex-col gap-4 rounded-3xl p-6 text-left">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold text-blush-900">
          {emoji} {title}
        </h2>
        <span className="pill">{items.length}</span>
      </div>

      {items.length === 0 && (
        <p className="text-sm font-semibold text-blush-500">{emptyText}</p>
      )}

      <ol
        className={`space-y-2 text-sm font-semibold text-blush-800 ${
          ordered ? 'list-decimal pl-5' : 'list-disc pl-5'
        }`}
      >
        {items.map((item) => (
          <li key={item.id} className="group">
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
                <span className="flex-1">{item.text}</span>
                {canEdit && (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      aria-label="Edit"
                      className="grid h-7 w-7 place-items-center rounded-lg text-blush-400 transition hover:bg-white/60 hover:text-blush-600"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
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
                )}
              </div>
            )}
            {canEdit && confirmId === item.id && (
              <p className="mt-1 text-xs font-bold text-red-500">
                Tap again to delete
              </p>
            )}
          </li>
        ))}
      </ol>

      {canEdit &&
        (adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
                if (e.key === 'Escape') {
                  setAdding(false)
                  setNewText('')
                }
              }}
              placeholder={addLabel}
              className={inputCls}
            />
            <button
              onClick={add}
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
            <PlusIcon className="h-4 w-4" /> {addLabel}
          </button>
        ))}
    </div>
  )
}

export function Rules() {
  const { as } = useApp()
  const canEdit = as === 'you'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="📖"
        title="Rulebook"
        subtitle={
          canEdit
            ? 'Rules for my little girl ♡ — only you can change these'
            : 'Rules for my little girl ♡'
        }
      />
      <ListCard
        listKey="rules"
        title="Rules for my little girl ♡"
        emoji="📏"
        ordered
        emptyText="No rules yet — daddy can add them here."
        addLabel="Add a rule"
      />
      <ListCard
        listKey="reminders"
        title="Reminders"
        emoji="🎀"
        ordered={false}
        emptyText="No reminders yet — daddy can add them here."
        addLabel="Add a reminder"
      />
    </div>
  )
}
