import { useRef, useState, type DragEvent } from 'react'
import { useApp } from '../lib/store'
import { prettyDate } from '../lib/media'
import { uid, type MemoryItem } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { PhotoIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { Field, Modal, inputCls } from '../components/Modal'

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 1000
        let w = img.width
        let h = img.height
        if (w > max || h > max) {
          const scale = Math.min(max / w, max / h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => resolve(reader.result as string)
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Memories() {
  const { memories, setMemories, pushToast } = useApp()
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState('')
  const [caption, setCaption] = useState('')
  const [emoji, setEmoji] = useState('🌸')
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const pickFile = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      pushToast('That file is not a photo 🙈', '🖼️')
      return
    }
    setBusy(true)
    try {
      const data = await readImage(file)
      setSrc(data)
      if (!caption) setCaption(file.name.replace(/\.[^.]+$/, ''))
    } catch {
      pushToast('Could not read that image', '🙈')
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void pickFile(f)
  }

  const save = () => {
    const item: MemoryItem = {
      id: uid(),
      caption: caption.trim() || 'A cute moment',
      src,
      date: new Date().toISOString().slice(0, 10),
      emoji,
    }
    setMemories((prev) => [item, ...prev])
    pushToast('Memory saved to your wall 📸', '💗')
    setOpen(false)
    setSrc('')
    setCaption('')
    setEmoji('🌸')
  }

  const remove = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
    pushToast('Memory removed', '🗑️')
  }

  const openNew = () => {
    setSrc('')
    setCaption('')
    setEmoji('🌸')
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="📸"
        title="Our Memories"
        subtitle="Post cute photos and screenshots of the little things we never want to forget."
        action={
          <button onClick={openNew} className="btn-candy">
            <PlusIcon className="h-4.5 w-4.5" />
            Add memory
          </button>
        }
      />

      {memories.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center p-10 text-center">
          <span className="text-4xl">🖼️</span>
          <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
            Your wall is empty
          </p>
          <p className="mt-1 max-w-sm text-sm font-semibold text-blush-500">
            Add your first photo or screenshot to start the collection.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {memories.map((m) => (
            <article key={m.id} className="glass overflow-hidden p-0">
              <div className="relative z-10">
                <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blush-100 to-lilac-100">
                  {m.src ? (
                    <img
                      src={m.src}
                      alt={m.caption}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-5xl">
                      {m.emoji}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-extrabold text-blush-900">
                      {m.caption}
                    </p>
                    <p className="text-xs font-bold text-blush-500">
                      {prettyDate(m.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    aria-label="Delete memory"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/70 text-blush-500 transition hover:bg-white hover:text-blush-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal
          title="New memory"
          emoji="📸"
          onClose={() => setOpen(false)}
        >
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`mb-3 grid h-40 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition ${
              drag
                ? 'border-blush-400 bg-white/80'
                : 'border-blush-300/70 bg-white/50 hover:bg-white/70'
            }`}
          >
            {src ? (
              <img
                src={src}
                alt="preview"
                className="h-full max-h-36 rounded-xl object-cover"
              />
            ) : (
              <div>
                <PhotoIcon className="mx-auto h-8 w-8 text-blush-400" />
                <p className="mt-2 text-sm font-bold text-blush-600">
                  {busy ? 'Loading…' : 'Drop a photo or click to browse'}
                </p>
                <p className="text-xs font-semibold text-blush-400">
                  PNG, JPG or a cute screenshot
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />

          <Field label="Caption">
            <input
              className={inputCls}
              placeholder="That tiny bakery with the pink door"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </Field>
          <Field label="If you have no photo, pick a sticker">
            <div className="flex flex-wrap gap-2">
              {['🌸', '🧁', '🐾', '💞', '🍦', '🎡', '☀️', '🧸'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                    emoji === e
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
              Save memory
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