import { useMemo, useState } from 'react'
import { useApp } from '../lib/store'
import { relativeTime } from '../lib/media'
import { uid, WHO_NAME, type CustomEmoji, type NoteItem } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { Avatar } from '../components/Avatar'
import {
  BookmarkIcon,
  CheckIcon,
  HeartIcon,
  NoteIcon,
  SendIcon,
} from '../components/Icons'
import { inputCls } from '../components/Modal'
import { suppressNextClick } from '../lib/sound'

const MOODS = [
  { emoji: '💗', label: 'love' },
  { emoji: '😘', label: 'smooch' },
  { emoji: '🌙', label: 'cozy' },
  { emoji: '🌈', label: 'sunny' },
  { emoji: '🫶', label: 'hugs' },
  { emoji: '🐣', label: 'silly' },
]

type View = 'all' | 'saved'

export function Notes() {
  const { notes, setNotes, as, pushToast, customEmojis } = useApp()
  const [body, setBody] = useState('')
  const [mood, setMood] = useState('💗')
  const [view, setView] = useState<View>('all')

  const otherName = WHO_NAME[as === 'you' ? 'ellie' : 'you']
  /* treat updates & other app notices live only in Notifications, not here */
  const loveNotes = notes.filter((n) => n.kind !== 'system')
  const unread = loveNotes.filter((n) => n.to === as && !n.read).length

  const sorted = useMemo(
    () =>
      notes
        .filter((n) => n.kind !== 'system')
        .sort((a, b) => b.createdAt - a.createdAt),
    [notes],
  )
  const visible =
    view === 'saved'
      ? sorted.filter((n) => n.savedBy?.[as] || n.saved)
      : sorted

  const send = () => {
    if (!body.trim()) {
      pushToast('Write something sweet first! 🙈', '💌')
      return
    }
    const to = as === 'you' ? 'ellie' : 'you'
    const note: NoteItem = {
      id: uid(),
      body: body.trim(),
      from: as,
      to,
      createdAt: Date.now(),
      read: false,
      savedBy: {},
      likes: [],
    }
    setNotes((prev) => [note, ...prev])
    pushToast(
      `Note sent to ${WHO_NAME[to]} — they'll get a ping! 💌`,
      '💌',
    )
    setBody('')
  }

  const markRead = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAll = () => {
    setNotes((prev) =>
      prev.map((n) =>
        n.to === as && !n.read && n.kind !== 'system'
          ? { ...n, read: true }
          : n,
      ),
    )
    pushToast('All notes read 💗', '✅')
  }

  const toggleSave = (id: string) => {
    const target = notes.find((n) => n.id === id)
    const nowSaved = !(target?.savedBy?.[as] || target?.saved)
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              savedBy: { ...(n.savedBy ?? {}), [as]: !(n.savedBy?.[as] || n.saved) },
              saved: false,
            }
          : n,
      ),
    )
    pushToast(
      nowSaved ? 'Note saved forever 💾' : 'Note unsaved — it can vanish in 24h',
      nowSaved ? '💾' : '📭',
    )
  }

  const toggleLike = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const likes = n.likes ?? []
        const mine = likes.some((l) => l.by === as)
        return {
          ...n,
          likes: mine
            ? likes.filter((l) => l.by !== as)
            : [...likes, { by: as, ts: Date.now() }],
        }
      }),
    )
  }

  const inbox = visible.filter((n) => n.to === as)
  const sentById = visible.filter((n) => n.to !== as)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="💌"
        title="Love Notes"
        subtitle={`Write to each other — whoever isn't in here gets a soft ping.`}
        action={
          unread > 0 ? (
            <button onClick={markAll} className="btn-ghost">
              <CheckIcon className="h-4 w-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="glass p-6">
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Write to {otherName}
            </h3>
            <span className="pill">
              <NoteIcon className="h-3.5 w-3.5 text-blush-500" />
              viewing as {WHO_NAME[as]}
            </span>
          </div>

          <textarea
            className={`${inputCls} min-h-28 resize-none`}
            placeholder={`A little note for ${otherName}...`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => {
                  if (mood === m.emoji) {
                    suppressNextClick()
                    return
                  }
                  setMood(m.emoji)
                }}
                title={m.label}
                className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                  mood === m.emoji
                    ? 'bg-blush-300 shadow'
                    : 'bg-white/70 hover:bg-white'
                }`}
              >
                {m.emoji}
              </button>
            ))}
            {customEmojis.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {customEmojis.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setBody((b) => `${b} :${e.name}:`)}
                    title={`Sticker: ${e.name}`}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 p-1 transition hover:bg-white"
                  >
                    <img
                      src={e.src}
                      alt={e.name}
                      className="h-6 w-6 object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
            <button onClick={send} className="btn-candy ml-auto">
              <SendIcon className="h-4 w-4" />
              Send note
            </button>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blush-500">
            💡 Notes quietly disappear after 24 hours — tap the bookmark to save
            one forever.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'saved'] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              if (view === v) {
                suppressNextClick()
                return
              }
              setView(v)
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold transition ${
              view === v
                ? 'bg-blush-500 text-white shadow'
                : 'bg-white/50 text-blush-600 hover:bg-white/80'
            }`}
          >
            {v === 'saved' && <BookmarkIcon className="h-3.5 w-3.5" />}
            {v === 'all' ? 'All notes' : 'Saved only'}
          </button>
        ))}
        <p className="ml-auto text-xs font-bold text-blush-500">
          {visible.length} note{visible.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="mb-3 font-display text-lg font-extrabold text-blush-900">
            For you {unread > 0 && <span className="pill"> {unread} new</span>}
          </h3>
          {inbox.length === 0 ? (
            <div className="glass flex flex-col items-center justify-center p-8 text-center">
              <span className="text-3xl">🕊️</span>
              <p className="mt-2 font-display font-extrabold text-blush-700">
                {view === 'saved' ? 'No saved notes here yet' : 'Nothing in your inbox yet'}
              </p>
              <p className="mt-1 max-w-xs text-sm font-semibold text-blush-500">
                {view === 'saved'
                  ? 'Notes you bookmark will be kept safe forever.'
                  : 'Notes sent to you will land here (and ping you!).'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {inbox.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  emojis={customEmojis}
                  saved={!!(n.savedBy?.[as] || n.saved)}
                  likedByMe={!!n.likes?.some((l) => l.by === as)}
                  likeCount={n.likes?.length ?? 0}
                  onClick={() => markRead(n.id)}
                  onSave={() => toggleSave(n.id)}
                  onLike={() => toggleLike(n.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-3 font-display text-lg font-extrabold text-blush-900">
            {view === 'saved' ? 'Saved' : 'Sent'}
          </h3>
          {sentById.length === 0 ? (
            <div className="glass-soft flex flex-col items-center justify-center p-8 text-center">
              <span className="text-3xl">💌</span>
              <p className="mt-2 text-sm font-bold text-blush-600">
                {view === 'saved'
                  ? 'Bookmark the notes you want to keep forever.'
                  : 'Notes you send will show up here.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sentById.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  emojis={customEmojis}
                  sent
                  saved={!!(n.savedBy?.[as] || n.saved)}
                  likedByMe={!!n.likes?.some((l) => l.by === as)}
                  likeCount={n.likes?.length ?? 0}
                  onSave={() => toggleSave(n.id)}
                  onLike={() => toggleLike(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fullStamp(ts: number) {
  const d = new Date(ts)
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${date} at ${time}`
}

function NoteCard({
  note,
  emojis,
  onClick,
  onSave,
  onLike,
  saved,
  likedByMe,
  likeCount,
  sent,
}: {
  note: NoteItem
  emojis: CustomEmoji[]
  onClick?: () => void
  onSave: () => void
  onLike: () => void
  saved: boolean
  likedByMe: boolean
  likeCount: number
  sent?: boolean
}) {
  const fresh = !note.read && !sent
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`glass w-full p-4 text-left transition ${
        fresh ? 'ring-2 ring-blush-300' : ''
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Avatar who={note.from} size={32} />
          <p className="text-sm font-extrabold text-blush-800">
            {WHO_NAME[note.from]} → {WHO_NAME[note.to]}
          </p>
          {fresh && (
            <span className="pill !px-2 !py-0.5 text-[0.6rem]">new 💌</span>
          )}
          {saved && (
            <span className="pill !px-2 !py-0.5 text-[0.6rem]">saved 💾</span>
          )}
        </div>
        <p className="mt-1 text-[0.7rem] font-bold text-blush-400">
          {fullStamp(note.createdAt)} · {relativeTime(note.createdAt)}
        </p>
        <p className="mt-2.5 text-sm font-semibold leading-relaxed text-blush-800/90">
          <StickerText text={note.body} emojis={emojis} />
        </p>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
            aria-label={likedByMe ? 'Remove your heart' : 'Heart this note'}
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-sm font-extrabold transition ${
              likedByMe
                ? 'bg-blush-500 text-white shadow'
                : 'bg-white/70 text-blush-500 hover:bg-white hover:text-blush-600'
            }`}
          >
            <HeartIcon className="h-4 w-4" />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            aria-label={saved ? 'Unsave note' : 'Save note'}
            className={`grid h-8 w-8 place-items-center rounded-xl transition ${
              saved
                ? 'bg-blush-500 text-white shadow'
                : 'bg-white/70 text-blush-500 hover:bg-white hover:text-blush-600'
            }`}
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StickerText({
  text,
  emojis,
}: {
  text: string
  emojis: CustomEmoji[]
}) {
  const parts = text.split(/:([a-z0-9_]+):/g)
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 1) {
          const e = emojis.find((x) => x.name === p)
          if (e) {
            return (
              <img
                key={i}
                src={e.src}
                alt={e.name}
                className="inline h-[1.2em] w-[1.2em] object-contain align-[-0.25em]"
              />
            )
          }
          return `:${p}:`
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}