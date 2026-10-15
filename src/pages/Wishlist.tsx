import { useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { readImageData } from '../lib/media'
import { uid, WHO_NAME, type WishItem } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import {
  CheckIcon,
  LinkIcon,
  PlusIcon,
  PlusCircleIcon,
  TrashIcon,
} from '../components/Icons'
import { Field, Modal, inputCls } from '../components/Modal'

const WISH_EMOJIS = [
  '🎀',
  '💖',
  '🧸',
  '👜',
  '👗',
  '💄',
  '🛍️',
  '🌸',
  '🎧',
  '👟',
  '📱',
  '📚',
  '☕',
  '🌷',
]

const blank: WishItem = {
  id: '',
  title: '',
  detail: '',
  link: '',
  src: '',
  emoji: '🎀',
  createdAt: Date.now(),
}

export function Wishlist() {
  const { wishes, setWishes, as, pushToast } = useApp()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<WishItem>(blank)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const isEllie = as === 'ellie'

  const newWish = () => {
    setDraft({ ...blank, createdAt: Date.now() })
    setOpen(true)
  }

  const save = async () => {
    if (!draft.title.trim()) {
      pushToast('Give the wish a name 🎀', '🙈')
      return
    }
    if (draft.link && !/^https?:\/\//i.test(draft.link)) {
      pushToast('The link needs to start with https://', '🙈')
      return
    }
    setWishes((prev) => [{ ...draft, id: uid() }, ...prev])
    pushToast('Wishlist updated! 🎀', '✨')
    setOpen(false)
  }

  const remove = (id: string) => {
    const wish = wishes.find((w) => w.id === id)
    if (!window.confirm(`Remove "${wish?.title ?? 'this wish'}" from the wishlist?`))
      return
    setWishes((prev) => prev.filter((w) => w.id !== id))
    pushToast('Removed from the wishlist', '🗑️')
  }

  /* Micah ticking a wish off = he fulfilled it; confirm so a stray tap can't wipe it. */
  const complete = (id: string) => {
    const wish = wishes.find((w) => w.id === id)
    if (
      !window.confirm(
        `Mark "${wish?.title ?? 'this wish'}" as fulfilled? It leaves the wishlist.`,
      )
    )
      return
    setWishes((prev) => prev.filter((w) => w.id !== id))
    pushToast(`You fulfilled "${wish?.title ?? 'a wish'}"! 💖`, '💖')
  }

  const onFile = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try {
      const src = await readImageData(f, 640)
      setDraft((d) => ({ ...d, src }))
      pushToast('Picture added! 📸', '✨')
    } catch {
      pushToast('Could not read that image', '🙈')
    } finally {
      setBusy(false)
    }
  }

  const sorted = [...wishes].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🎀"
        title="Ellie's Wishlist"
        subtitle={
          isEllie
            ? 'Dream loud, cutie — things you wish for, as little treats or just because.'
            : 'A peek at exactly what Ellie is wishing for. Watch and admire. 😌'
        }
        action={
          isEllie ? (
            <button onClick={newWish} className="btn-candy" disabled={busy}>
              <PlusIcon className="h-4.5 w-4.5" />
              Add a wish
            </button>
          ) : undefined
        }
      />

      {sorted.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center p-10 text-center">
          <span className="text-4xl">{isEllie ? '🎀' : '🌙'}</span>
          <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
            {isEllie ? 'Your wishlist is empty' : 'Nothing to peek at yet'}
          </p>
          <p className="mt-1 max-w-sm text-sm font-semibold text-blush-500">
            {isEllie
              ? 'Add the little things you are dreaming about.'
              : 'When Ellie adds wishes, they will show up right here for you.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((w) => (
            <article key={w.id} className="glass group overflow-hidden">
              <div className="relative z-10 aspect-[4/3] w-full overflow-hidden">
                {w.src ? (
                  <img
                    src={w.src}
                    alt={w.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blush-200 via-lilac-200 to-butter-200 text-6xl">
                    <span className="drop-shadow-sm">{w.emoji}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-extrabold leading-tight text-blush-900">
                    {w.title}
                  </h3>
                  {isEllie ? (
                    <button
                      onClick={() => remove(w.id)}
                      aria-label={`Remove ${w.title}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-white hover:text-blush-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => complete(w.id)}
                      aria-label={`Mark ${w.title} fulfilled`}
                      title="Mark as fulfilled"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-blush-500 hover:text-white"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {w.detail && (
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-blush-700/80">
                    {w.detail}
                  </p>
                )}
                {w.link && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={w.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-3.5 py-1.5 text-xs font-extrabold text-white shadow transition hover:scale-105"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      View link
                    </a>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(w.link)
                        pushToast('Link copied! 📋', '✨')
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-extrabold text-blush-600 transition hover:bg-white"
                    >
                      Copy link
                    </button>
                  </div>
                )}
                <p className="mt-3 text-[0.65rem] font-bold text-blush-400">
                  wished by {WHO_NAME['ellie']} ·{' '}
                  {new Date(w.createdAt).toLocaleDateString()}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Add a wish" emoji="🎀" onClose={() => setOpen(false)}>
          <Field label="Wish name">
            <input
              autoFocus
              className={inputCls}
              placeholder="That super soft sweater"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="What you want to say">
            <textarea
              className={`${inputCls} min-h-20 resize-none`}
              placeholder="Describe it in your own words…"
              value={draft.detail}
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            />
          </Field>
          <Field label="Link (optional)">
            <input
              className={inputCls}
              placeholder="https://…"
              value={draft.link}
              onChange={(e) => setDraft({ ...draft, link: e.target.value })}
            />
          </Field>
          <Field label="Picture (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              className="flex h-24 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blush-300/70 bg-white/50 transition hover:bg-white/70"
            >
              {draft.src ? (
                <img
                  src={draft.src}
                  alt="Wish preview"
                  className="h-full rounded-xl object-contain p-1"
                />
              ) : (
                <span className="flex items-center gap-2 text-sm font-bold text-blush-500">
                  <PlusCircleIcon className="h-6 w-6" />
                  {busy ? 'Reading picture…' : 'Add a picture'}
                </span>
              )}
            </div>
          </Field>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <Field label="Pick a sticker">
            <div className="flex flex-wrap gap-2">
              {WISH_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft({ ...draft, emoji: e })}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                    draft.emoji === e
                      ? 'bg-blush-300 shadow'
                      : 'bg-white/70 hover:bg-white'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-4 flex gap-3">
            <button onClick={() => void save()} className="btn-candy flex-1">
              Add wish
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