import { useRef, useState, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import { uid, type TreatItem, type TreatRequest } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  GiftIcon,
  LinkIcon,
  MinusIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
} from '../components/Icons'
import { Field, Modal, inputCls } from '../components/Modal'

const EMOJIS = ['🎁', '🍩', '🎮', '🍿', '🛍️', '🌸', '🎨', '☕', '🧸', '🍜', '💅', '🍦']

const blank: TreatItem = {
  id: '',
  title: '',
  detail: '',
  cost: 10,
  emoji: '🍩',
  earned: 0,
  redeemed: false,
}

function spent(treats: TreatItem[]) {
  return treats.reduce((sum, t) => sum + (t.redeemed ? t.cost : 0), 0)
}

function total(treats: TreatItem[]) {
  return treats.reduce((sum, t) => sum + t.cost, 0)
}

function safeLink(url: string) {
  const u = url.trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

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

const reqBlank = {
  title: '',
  detail: '',
  link: '',
  src: '',
  emoji: '🎁',
  price: '',
}

export function Treats() {
  const {
    as,
    treats,
    setTreats,
    treatRequests,
    setTreatRequests,
    points,
    setPoints,
    sendAlert,
    pushToast,
  } = useApp()
  const isMicah = as === 'you'

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TreatItem>(blank)
  const [editing, setEditing] = useState(false)
  const [custom, setCustom] = useState('')

  const [reqOpen, setReqOpen] = useState(false)
  const [req, setReq] = useState(reqBlank)
  const [reqBusy, setReqBusy] = useState(false)
  const reqFileRef = useRef<HTMLInputElement | null>(null)

  const [approveOf, setApproveOf] = useState<TreatRequest | null>(null)
  const [approveCost, setApproveCost] = useState('10')
  const [denyId, setDenyId] = useState<string | null>(null)

  const pending = treatRequests.filter((r) => r.status === 'pending')
  const approved = treatRequests.filter((r) => r.status === 'approved')
  const denied = treatRequests.filter((r) => r.status === 'denied')

  const startNew = () => {
    setDraft(blank)
    setEditing(false)
    setOpen(true)
  }

  const startEdit = (t: TreatItem) => {
    setDraft(t)
    setEditing(true)
    setOpen(true)
  }

  const save = () => {
    if (!draft.title.trim()) {
      pushToast('Give your treat a cute name 💕', '🙈')
      return
    }
    if (editing) {
      setTreats((prev) => prev.map((t) => (t.id === draft.id ? draft : t)))
      pushToast('Treat updated ✨', '✅')
    } else {
      setTreats((prev) => [{ ...draft, id: uid() }, ...prev])
      pushToast('A new treat to work towards!', '🍬')
    }
    setOpen(false)
  }

  const remove = (id: string) => {
    setTreats((prev) => prev.filter((t) => t.id !== id))
    pushToast('Treat removed', '🗑️')
  }

  const earn = (amt: number) => {
    setPoints((p) => p + amt)
    pushToast(`+${amt} good behavior points! 🎀`, '⭐')
  }

  const take = (amt: number) => {
    setPoints((p) => Math.max(0, p - amt))
    pushToast(`-${amt} points removed`, '📉')
  }

  const redeem = (t: TreatItem) => {
    setTreats((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, redeemed: true } : x)),
    )
    pushToast(`You redeemed “${t.title}”! 🎉`, '🎊')
  }

  const adjustCustom = (dir: 1 | -1) => {
    const v = Math.floor(Number(custom))
    if (!v || v <= 0) {
      pushToast('Type a number above 0 first 🎀', '🙈')
      return
    }
    if (dir === 1) {
      setPoints((p) => p + v)
      pushToast(`+${v} points added! 🎀`, '⭐')
    } else {
      setPoints((p) => Math.max(0, p - v))
      pushToast(`-${v} points removed`, '📉')
    }
    setCustom('')
  }

  const resetPoints = () => {
    if (!window.confirm('Reset the points bank to 0?')) return
    setPoints(0)
    pushToast('Points reset to 0', '🧹')
  }

  const removeRequest = (id: string) => {
    setTreatRequests((prev) => prev.filter((r) => r.id !== id))
    pushToast('Wish removed', '🗑️')
  }

  const startApprove = (r: TreatRequest) => {
    setDenyId(null)
    setApproveOf(r)
    setApproveCost(String(r.price ?? 10))
  }

  const confirmApprove = () => {
    if (!approveOf) return
    const cost = Math.floor(Number(approveCost))
    if (!cost || cost <= 0) {
      pushToast('Set a fair price first 🎀', '🙈')
      return
    }
    const r = approveOf
    setTreats((prev) => [
      {
        id: uid(),
        title: r.title,
        detail: r.detail,
        cost,
        emoji: r.emoji || '🎁',
        earned: 0,
        redeemed: false,
      },
      ...prev,
    ])
    setTreatRequests((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, status: 'approved', decidedAt: Date.now(), decidedCost: cost }
          : x,
      ),
    )
    sendAlert(
      'ellie',
      `🎉 Your treat request “${r.title}” was approved for ${cost} pts! Go treat yourself, puppy 💗`,
    )
    pushToast('Approved — Ellie just got a notification 🎉', '✅')
    setApproveOf(null)
  }

  const confirmDeny = (r: TreatRequest) => {
    setApproveOf(null)
    if (denyId !== r.id) {
      setDenyId(r.id)
      return
    }
    setTreatRequests((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: 'denied', decidedAt: Date.now() } : x,
      ),
    )
    sendAlert(
      'ellie',
      `💌 Daddy said not this time for “${r.title}” — want to pick something else, baby?`,
    )
    pushToast('Denied — Ellie just got a notification 💌', '💌')
    setDenyId(null)
  }

  const onPickReqImage = async (file?: File) => {
    if (!file) return
    setReqBusy(true)
    try {
      const src = await readImage(file)
      setReq((d) => ({ ...d, src }))
    } catch {
      pushToast('That picture did not want to load 🥺', '🖼️')
    } finally {
      setReqBusy(false)
    }
  }

  const submitRequest = () => {
    if (!req.title.trim()) {
      pushToast('Tell Daddy what you are hoping for 💗', '🎁')
      return
    }
    const priceNum = req.price.trim()
      ? Math.max(1, Math.floor(Number(req.price) || 0))
      : null
    setTreatRequests((prev) => [
      {
        id: uid(),
        title: req.title.trim(),
        detail: req.detail.trim(),
        link: req.link.trim(),
        src: req.src,
        emoji: req.emoji,
        price: priceNum,
        status: 'pending',
        createdAt: Date.now(),
      },
      ...prev,
    ])
    pushToast('Your treat wish flew off to Daddy! 💌', '✨')
    setReq(reqBlank)
    setReqOpen(false)
  }

  const avail = points - spent(treats)
  const progress = total(treats) > 0 ? (spent(treats) / total(treats)) * 100 : 0

  const requestCard = (
    r: TreatRequest,
    opts: { pending?: boolean; deletable?: boolean } = {},
  ) => (
    <div key={r.id} className="rounded-3xl bg-white/60 p-4">
      <div className="flex gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-butter-200 to-blush-200 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {r.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              {r.title}
            </h3>
            {!opts.pending && (
              <span
                className={`pill text-[0.65rem] ${
                  r.status === 'approved'
                    ? 'text-blush-600'
                    : 'text-blush-400'
                }`}
              >
                {r.status === 'approved' ? 'approved ✓' : 'not this time 💗'}
              </span>
            )}
          </div>
          {r.detail && (
            <p className="mt-1 text-sm font-semibold text-blush-700/75">
              {r.detail}
            </p>
          )}
          {r.src && (
            <img
              src={r.src}
              alt={r.title}
              className="mt-2 max-h-52 w-full rounded-2xl object-cover"
            />
          )}
          {r.link && (
            <a
              href={safeLink(r.link)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm font-extrabold text-blush-600 underline decoration-blush-300 hover:text-blush-700"
            >
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{r.link}</span>
            </a>
          )}
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-blush-400">
            {r.price
              ? `she's hoping for ${r.price} pts`
              : 'price — leave it to Daddy 🥰'}
          </p>
        </div>
      </div>

      {opts.pending && isMicah && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => startApprove(r)}
            className="btn-candy !py-2 flex-1"
          >
            <CheckIcon className="h-4 w-4" />
            Accept
          </button>
          <button
            onClick={() => confirmDeny(r)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
              denyId === r.id
                ? 'border-blush-400 bg-blush-500 text-white'
                : 'border-blush-300/60 bg-white/60 text-blush-600 hover:bg-white'
            }`}
          >
            <CloseIcon className="h-4 w-4" />
            {denyId === r.id ? 'Tap again' : 'Deny'}
          </button>
        </div>
      )}

      {opts.deletable && isMicah && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => removeRequest(r.id)}
            aria-label={`Delete ${r.title}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-blush-300/60 bg-white/60 px-4 py-2 text-sm font-extrabold text-blush-600 transition hover:bg-white"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🍬"
        title="Treat Jar"
        subtitle={
          isMicah
            ? 'Good behaviors become little rewards Ellie can work towards. Fill the jar and review her wishes.'
            : 'Your treat jar — see your points and ask Daddy for something special! 🎀'
        }
        action={
          isMicah ? (
            <button onClick={startNew} className="btn-candy">
              <PlusIcon className="h-4.5 w-4.5" />
              New treat
            </button>
          ) : (
            <button onClick={() => setReqOpen(true)} className="btn-candy">
              <GiftIcon className="h-4.5 w-4.5" />
              Ask for a treat
            </button>
          )
        }
      />

      {isMicah ? (
        <div className="glass p-6">
          <div className="relative z-10 flex flex-wrap items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-butter-200 to-blush-200 text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              🏆
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
                good behavior bank
              </p>
              <p className="font-display text-4xl font-extrabold text-candy leading-none">
                {avail} <span className="text-lg">pts</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-blush-700/70">
                Earn points for being cute &amp; good, then trade them in for
                treats.
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blush-300 via-blush-400 to-lilac-300 transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-blush-500">
            {points} earned · {spent(treats)} spent on treats
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-extrabold uppercase tracking-wider text-blush-400">
              remove
            </span>
            {[1, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => take(n)}
                className="flex items-center gap-1 rounded-full border border-blush-300/60 bg-white/50 px-3 py-1.5 text-sm font-extrabold text-blush-600 transition hover:bg-white"
              >
                <MinusIcon className="h-3.5 w-3.5" /> {n}
              </button>
            ))}
            <span className="mx-2 h-5 w-px bg-white/70" />
            <span className="mr-1 text-xs font-extrabold uppercase tracking-wider text-blush-400">
              add
            </span>
            {[1, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => earn(n)}
                className="flex items-center gap-1 rounded-full bg-blush-500 px-3 py-1.5 text-sm font-extrabold text-white shadow transition hover:scale-105"
              >
                +{n}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <span className="mb-1 block text-[0.6rem] font-extrabold uppercase tracking-wider text-blush-400">
                custom amount
              </span>
              <input
                type="number"
                min={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') adjustCustom(1)
                }}
                placeholder="0"
                className={`${inputCls} w-24 !py-2`}
              />
            </div>
            <button
              onClick={() => adjustCustom(1)}
              className="btn-ghost !px-3 !py-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
            <button
              onClick={() => adjustCustom(-1)}
              className="btn-ghost !px-3 !py-2 text-sm"
            >
              <MinusIcon className="h-4 w-4" />
              Remove
            </button>
            <button
              onClick={resetPoints}
              disabled={points === 0}
              className="mr-0 ml-auto inline-flex items-center gap-1.5 rounded-full border border-blush-300/60 bg-white/50 px-4 py-2 text-sm font-extrabold text-blush-600 transition hover:bg-white disabled:opacity-40"
            >
              <SparkleIcon className="h-4 w-4" />
              Reset to 0
            </button>
          </div>
        </div>
      ) : (
        <div className="glass relative overflow-hidden p-6">
          <span className="pointer-events-none absolute -right-2 -top-4 select-none text-6xl opacity-20">
            🌷
          </span>
          <span className="pointer-events-none absolute right-16 top-6 select-none text-2xl opacity-30">
            ✨
          </span>
          <span className="pointer-events-none absolute bottom-2 right-6 select-none text-3xl opacity-20">
            🎀
          </span>
          <div className="relative z-10 flex flex-wrap items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-butter-200 to-blush-200 text-4xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              🏆
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
                your good behavior points
              </p>
              <p className="font-display text-5xl font-extrabold text-candy leading-none">
                {avail} <span className="text-xl">pts</span>
              </p>
              <p className="mt-1 max-w-md text-sm font-semibold text-blush-700/70">
                You have earned {points} and spent {spent(treats)} on treats.
                Keep being your cute self, puppy! 🐶
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blush-300 via-blush-400 to-lilac-300 transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-blush-500">
            Only Daddy can add or take away points — but the treats below are
            yours to spend them on! 🥰
          </p>
        </div>
      )}

      {isMicah && (
        <section className="glass p-6">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <GiftIcon className="h-5 w-5 text-blush-500" />
              <h2 className="font-display text-xl font-extrabold text-blush-900">
                Treat requests
              </h2>
              {pending.length > 0 && (
                <span className="pill text-[0.65rem]">
                  {pending.length} waiting 💌
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <p className="text-sm font-semibold text-blush-500">
                No new wishes right now. When Ellie asks for a treat, it lands
                here for you to accept or deny. 🎀
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {pending.map((r) =>
                  requestCard(r, { pending: true, deletable: true }),
                )}
              </div>
            )}
            {(approved.length > 0 || denied.length > 0) && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wider text-blush-400">
                  Past wishes
                </summary>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {[...approved, ...denied]
                    .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))
                    .map((r) => requestCard(r, { deletable: true }))}
                </div>
              </details>
            )}
          </div>
        </section>
      )}

      {!isMicah && (
        <section className="glass p-6">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <GiftIcon className="h-5 w-5 text-blush-500" />
              <h2 className="font-display text-xl font-extrabold text-blush-900">
                My treat wishes
              </h2>
            </div>
            {treatRequests.length === 0 ? (
              <p className="text-sm font-semibold text-blush-500">
                You have not wished for anything yet. Tap “Ask for a treat” to
                tell Daddy what sounds nice! 🎀
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {[...treatRequests]
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((r) => (
                    <div key={r.id}>
                      {requestCard(r)}
                      <p className="mt-1.5 text-center text-xs font-extrabold text-blush-400">
                        {r.status === 'pending'
                          ? 'waiting for Daddy 💌'
                          : r.status === 'approved'
                            ? `Daddy said yes for ${r.decidedCost} pts! 🎉`
                            : 'maybe next time, baby 💗'}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {treats.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center p-10 text-center">
          <span className="text-4xl">🍩</span>
          <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
            No treats yet
          </p>
          <p className="mt-1 max-w-sm text-sm font-semibold text-blush-500">
            {isMicah
              ? 'Add rewards Ellie can work towards — little things that make her feel extra loved.'
              : 'Once Daddy fills the jar, your treats will show up here! 🍬'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {treats.map((t) => (
            <div
              key={t.id}
              className={`glass p-5 ${t.redeemed ? 'opacity-70' : ''}`}
            >
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-butter-200 to-blush-200 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    {t.redeemed ? '🎉' : t.emoji}
                  </div>
                  <div className="flex gap-1">
                    {isMicah && (
                      <IconBtn label="Edit" onClick={() => startEdit(t)}>
                        <EditIcon className="h-4 w-4" />
                      </IconBtn>
                    )}
                    <IconBtn label="Delete" onClick={() => remove(t.id)}>
                      <TrashIcon className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-extrabold text-blush-900">
                    {t.title}
                  </h3>
                  {t.redeemed && (
                    <span className="pill text-[0.65rem]">redeemed ✓</span>
                  )}
                </div>
                {t.detail && (
                  <p className="mt-1 text-sm font-semibold text-blush-700/75">
                    {t.detail}
                  </p>
                )}

                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-blush-400">
                      costs
                    </p>
                    <p className="font-display text-2xl font-extrabold text-blush-700">
                      {t.cost} <span className="text-xs">pts</span>
                    </p>
                  </div>
                  {isMicah ? (
                    <span className="rounded-full bg-white/50 px-4 py-2 text-sm font-extrabold text-blush-500">
                      {t.redeemed
                        ? 'redeemed 🎉'
                        : avail >= t.cost
                          ? 'Ellie can redeem 🎀'
                          : `Need ${t.cost - avail} more`}
                    </span>
                  ) : (
                    <button
                      disabled={t.redeemed || avail < t.cost}
                      onClick={() => redeem(t)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                        t.redeemed
                          ? 'bg-white/40 text-blush-400'
                          : avail >= t.cost
                            ? 'btn-candy !py-2'
                            : 'bg-white/50 text-blush-400'
                      }`}
                    >
                      {t.redeemed
                        ? 'Redeemed'
                        : avail >= t.cost
                          ? 'Redeem'
                          : `Need ${t.cost - avail} more`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal
          title={editing ? 'Edit treat' : 'Add a treat'}
          emoji="🍬"
          onClose={() => setOpen(false)}
        >
          <Field label="Treat name">
            <input
              autoFocus
              className={inputCls}
              placeholder="Extra screen time"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="What's the reward?">
            <textarea
              className={`${inputCls} min-h-20 resize-none`}
              placeholder="One whole cozy hour, guilt-free."
              value={draft.detail}
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            />
          </Field>
          <Field label="Cost in points">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={draft.cost}
              onChange={(e) =>
                setDraft({ ...draft, cost: Math.max(1, Number(e.target.value)) })
              }
            />
          </Field>
          <Field label="Pick a sticker">
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
              {editing ? 'Save changes' : 'Add treat'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {reqOpen && (
        <Modal
          title="Ask for a treat"
          emoji="🎁"
          onClose={() => setReqOpen(false)}
        >
          <p className="-mt-1 mb-3 text-sm font-semibold text-blush-600">
            Tell Daddy what you are hoping for. Add a picture, a note, or a link
            — anything you like! 🥰
          </p>
          <Field label="What do you want?">
            <input
              autoFocus
              className={inputCls}
              placeholder="A cozy movie night"
              value={req.title}
              onChange={(e) => setReq({ ...req, title: e.target.value })}
            />
          </Field>
          <Field label="Tell Daddy more (optional)">
            <textarea
              className={`${inputCls} min-h-20 resize-none`}
              placeholder="And maybe some snacks too… 🍿"
              value={req.detail}
              onChange={(e) => setReq({ ...req, detail: e.target.value })}
            />
          </Field>
          <Field label="A link (optional)">
            <input
              className={inputCls}
              placeholder="https://…"
              value={req.link}
              onChange={(e) => setReq({ ...req, link: e.target.value })}
            />
          </Field>
          <Field label="A picture (optional)">
            <div className="flex items-center gap-3">
              <input
                ref={reqFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickReqImage(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => reqFileRef.current?.click()}
                className="btn-ghost !px-3 !py-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                {reqBusy ? 'Loading…' : req.src ? 'Change picture' : 'Add picture'}
              </button>
              {req.src && (
                <div className="relative">
                  <img
                    src={req.src}
                    alt="preview"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setReq({ ...req, src: '' })}
                    aria-label="Remove picture"
                    className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-blush-500 text-white shadow"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </Field>
          <Field label="Price (optional)">
            <input
              type="number"
              min={1}
              className={inputCls}
              placeholder="Leave blank and Daddy will pick 🥰"
              value={req.price}
              onChange={(e) => setReq({ ...req, price: e.target.value })}
            />
            <p className="mt-1 text-xs font-semibold text-blush-400">
              Not sure? Just leave it empty — Daddy will choose a fair price.
            </p>
          </Field>
          <Field label="Pick a sticker">
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setReq({ ...req, emoji: e })}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                    req.emoji === e
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
            <button onClick={submitRequest} className="btn-candy flex-1">
              <GiftIcon className="h-4 w-4" />
              Send to Daddy
            </button>
            <button onClick={() => setReqOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {approveOf && (
        <Modal
          title="Approve treat request"
          emoji="🎉"
          onClose={() => setApproveOf(null)}
        >
          <p className="-mt-1 mb-3 text-sm font-semibold text-blush-600">
            “{approveOf.title}” — set the price and it will be added to the jar.
            Ellie gets a notification too. 💗
          </p>
          {approveOf.price != null && (
            <p className="mb-3 text-xs font-extrabold text-blush-400">
              She suggested {approveOf.price} pts.
            </p>
          )}
          <Field label="Price in points">
            <input
              autoFocus
              type="number"
              min={1}
              className={inputCls}
              value={approveCost}
              onChange={(e) => setApproveCost(e.target.value)}
            />
          </Field>
          <div className="mt-4 flex gap-3">
            <button onClick={confirmApprove} className="btn-candy flex-1">
              <CheckIcon className="h-4 w-4" />
              Approve &amp; add
            </button>
            <button onClick={() => setApproveOf(null)} className="btn-ghost">
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
