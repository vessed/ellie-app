import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { usePlayer } from '../lib/player'
import { WHO_NAME, uid, type Theme } from '../lib/types'
import { daysTogether, prettyFull, readImageData, stickerCode, todayISO } from '../lib/media'
import { loadProfile, SPOTIFY_REDIRECT } from '../lib/spotify'
import { downloadBackup, restoreBackup } from '../lib/backup'
import { check } from '@tauri-apps/plugin-updater'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '../lib/platform'
import { PageHeader } from '../components/PageHeader'
import { Avatar } from '../components/Avatar'
import { Field, inputCls } from '../components/Modal'
import {
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  PhotoIcon,
  TrashIcon,
} from '../components/Icons'
import { playHeart, playPing, softClick, suppressNextClick } from '../lib/sound'
import {
  emptyCfg,
  roomKeyOK,
  suggestRoom,
  type SyncCfg,
} from '../lib/sync'

const THEMES: {
  key: Theme
  name: string
  desc: string
  swatches: string[]
}[] = [
  {
    key: 'blush',
    name: 'Blush',
    desc: 'Soft pink & lavender — the classic.',
    swatches: ['#fb62a5', '#d98cff', '#ffd0e6'],
  },
  {
    key: 'bluey',
    name: 'Blue Sky',
    desc: 'Blue heeler vibes with warm peachy pops.',
    swatches: ['#2ea3e6', '#ff9d5c', '#bde6ff'],
  },
  {
    key: 'lilac',
    name: 'Lilac Dream',
    desc: 'Cloudy purples and dreamy lavender.',
    swatches: ['#a78bfa', '#c4b5fd', '#ede9fe'],
  },
  {
    key: 'mint',
    name: 'Minty Soft',
    desc: 'Cool mint greens with baby blues.',
    swatches: ['#34c996', '#9fd8f2', '#c9f5e3'],
  },
]

/* The web/PWA build updates by deploying new files; the service worker picks
   them up. "Check for updates" asks the browser to look for a new worker and,
   if one is found, refreshes into it. */
async function checkWebUpdate(setMsg: (s: string) => void): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    setMsg("You're on the latest version ✨")
    return
  }
  setMsg('Checking for updates…')
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) {
    setMsg("You're on the latest version ✨")
    return
  }

  let found = false
  const onUpdate = () => {
    found = true
  }
  reg.addEventListener('updatefound', onUpdate)
  try {
    await reg.update()
  } catch {
    /* offline or blocked */
  }
  /* Give the browser a moment to begin installing a new worker. */
  await new Promise((r) => setTimeout(r, 2500))
  reg.removeEventListener('updatefound', onUpdate)

  if (!found && !reg.installing && !reg.waiting) {
    setMsg("You're on the latest version ✨")
    return
  }

  setMsg('New version found — refreshing…')
  if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
  let reloaded = false
  const reload = () => {
    if (reloaded) return
    reloaded = true
    location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
  /* Fallback in case controllerchange never fires. */
  setTimeout(reload, 3500)
}

export function Settings() {
  const { theme, setTheme, as, setAs, anniversary, setAnniversary, customEmojis, setCustomEmojis, setDates, setMemories, setTreats, setNotes, setSongs, setPlaylists, setPoints, pushToast, syncCfg, setSyncCfg, syncStatus, syncNow, unsync, profiles, setProfile } =
    useApp()
  const avatarRefs = useRef<Record<'you' | 'ellie', HTMLInputElement | null>>({
    you: null,
    ellie: null,
  })
  const [draft, setDraft] = useState(anniversary)
  const [conn, setConn] = useState<SyncCfg>(syncCfg)
  const emojiRef = useRef<HTMLInputElement | null>(null)
  const backupRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const { spotify, connectSpotify, disconnectSpotify } = usePlayer()
  const [clientId, setClientId] = useState(
    () => localStorage.getItem('ellie-spotify-cid') ?? loadProfile()?.clientId ?? '',
  )
  const [appVersion, setAppVersion] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  useEffect(() => {
    if (!isTauri) return
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(''))
  }, [])

  const checkForUpdates = async () => {
    setUpdating(true)
    setUpdateMsg('')
    if (!isTauri) {
      try {
        await checkWebUpdate(setUpdateMsg)
      } finally {
        setUpdating(false)
      }
      return
    }
    try {
      const update = await check()
      if (!update) {
        setUpdateMsg(`You're on the latest version (${appVersion}).`)
        pushToast(`You're up to date! 🎉`, '✅')
        return
      }
      let done = false
      await update.downloadAndInstall((e) => {
        if (done) return
        if (e.event === 'Started') {
          setUpdateMsg(`Downloading update v${update.version}…`)
        } else if (e.event === 'Finished') {
          done = true
          setUpdateMsg('Installing…')
        }
      })
      pushToast('Update installed — restarting! 🔄', '🚀')
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch {
      setUpdateMsg(`Couldn't reach the update server yet.`)
      pushToast('No update server reachable yet 🙈', '📡')
    } finally {
      setUpdating(false)
    }
  }

  const connectSpotifyNow = async () => {
    setBusy(true)
    const res = await connectSpotify(clientId)
    setBusy(false)
    if (res.ok) localStorage.setItem('ellie-spotify-cid', clientId.trim())
    pushToast(res.message, res.ok ? '🎵' : '🙈')
  }

  const importEmojis = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const next = [...customEmojis]
    for (const f of Array.from(files)) {
      if (next.length >= 30) break
      try {
        const src = await readImageData(f, 128)
        let name = stickerCode(f.name.replace(/\.[^.]+$/, ''))
        if (!name) name = 'emoji'
        const taken = new Set(next.map((e) => e.name))
        let n = name
        let i = 1
        while (taken.has(n)) {
          n = `${name}_${i++}`
        }
        next.push({ id: uid(), src, name: n })
      } catch {
        /* skip unreadable file */
      }
    }
    setCustomEmojis(next)
    setBusy(false)
    pushToast('Custom emojis added — they show as stickers! ✨', '🎨')
  }

  const removeEmoji = (id: string) => {
    setCustomEmojis(customEmojis.filter((e) => e.id !== id))
    pushToast('Emoji removed', '🗑️')
  }

  const pickProfilePic = async (who: 'you' | 'ellie', files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    try {
      const src = await readImageData(f, 256)
      setProfile(who, src)
      pushToast(`${WHO_NAME[who]}'s photo updated 📸`, '🖼️')
    } catch {
      pushToast("Couldn't read that image 🙈", '🙈')
    }
  }

  const clearProfilePic = (who: 'you' | 'ellie') => {
    setProfile(who, '')
    pushToast(`${WHO_NAME[who]}'s photo removed`, '🗑️')
  }

  const saveAnniversary = () => {
    if (!draft) {
      pushToast('Pick a date first, cutie! 📅', '🌸')
      return
    }
    if (draft > todayISO()) {
      pushToast("That's in the future... set our real start date! 🌸", '📅')
      return
    }
    setAnniversary(draft)
    pushToast('Anniversary saved for forever 💞', '💞')
  }

  const connect = () => {
    if (!conn.url.trim().startsWith('https://')) {
      pushToast('Paste your Supabase project URL first 🔗', '🙈')
      return
    }
    if (conn.key.trim().length < 20) {
      pushToast('Paste your Supabase anon key first 🔑', '🙈')
      return
    }
    if (!roomKeyOK(conn.room)) {
      pushToast(
        'Pick a room name — only letters, numbers, dashes and dots ✏️',
        '🙈',
      )
      return
    }
    setSyncCfg({
      url: conn.url.trim(),
      key: conn.key.trim(),
      room: conn.room.trim(),
    })
    pushToast('Cloud sync connected! Both PCs will match 💞', '☁️')
  }

  const disconnect = () => {
    if (
      !window.confirm(
        `Unsync this device from room “${syncCfg.room}”?\n\nYou keep all your data on this PC, but it will stop matching the other PC. You can re-connect anytime with the same room name.`,
      )
    )
      return
    unsync()
    setConn(emptyCfg)
    pushToast('Unsynced — this PC keeps its own copy 🕊️', '🔌')
  }

  const statusText: Record<string, string> = {
    off: 'Cloud sync is off — everything lives on this PC only',
    connecting: 'Connecting to our cloud…',
    synced: 'Connected — every change matches on both PCs',
    offline: 'Offline — saving locally, will sync as soon as we’re back',
  }
  const statusDot: Record<string, string> = {
    off: 'bg-blush-400',
    connecting: 'bg-amber-400 animate-pulse',
    synced: 'bg-emerald-400',
    offline: 'bg-blush-500/60',
  }

  const saveBackup = () => {
    const count = downloadBackup()
    pushToast(`Backup saved — ${count} things tucked away safely 💾`, '💾')
  }

  const loadBackup = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    try {
      const res = restoreBackup(await f.text())
      pushToast(res.message, res.ok ? '💞' : '🙈')
      if (
        res.ok &&
        res.added > 0 &&
        window.confirm('Restored! Reload now so everything shows up?')
      ) {
        window.location.reload()
      }
    } catch {
      pushToast("Couldn't read that backup file 🙈", '🙈')
    }
  }

  const reset = () => {
    const warn =
      'Reset ALL app data? This clears dates, memories, treats, notes, playlists, points and the anniversary — and cannot be undone.\n\nTip: download a backup first so you can restore it later.'
    if (!window.confirm(warn)) return
    setDates([])
    setMemories([])
    setTreats([])
    setNotes([])
    setSongs([])
    setPlaylists([])
    setPoints(0)
    setAnniversary('')
    pushToast('Everything reset — a fresh start! 🌱', '✨')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="⚙️"
        title="Settings"
        subtitle="Make Ellie feel like yours — themes and everything in between."
      />

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Theme
          </h3>
          <p className="mb-5 text-sm font-semibold text-blush-700/75">
            Pick the vibe of our whole little world.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {THEMES.map((t) => {
              const active = theme === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (theme === t.key) {
                      suppressNextClick()
                      return
                    }
                    setTheme(t.key)
                    pushToast(`${t.name} theme on! 🎨`, '✨')
                  }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-blush-300 bg-white/80 shadow-[0_14px_30px_-22px_rgba(251,98,165,0.9)]'
                      : 'border-white/60 bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-40" />
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent" />
                    <div
                      className="flex h-full w-full items-end gap-1 p-1.5"
                      style={{
                        background: `linear-gradient(135deg, ${t.swatches[0]}cc 0%, ${t.swatches[1]}cc 100%)`,
                      }}
                    >
                      {t.swatches.map((s, i) => (
                        <span
                          key={i}
                          className="h-full flex-1 rounded"
                          style={{ background: s }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-blush-900">
                      {t.name}
                    </p>
                    <p className="text-xs font-semibold text-blush-500">
                      {t.desc}
                    </p>
                  </div>
                  {active && (
                    <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush-500 text-white">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Sounds
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Preview the little sounds of our world before they go live.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                suppressNextClick()
                playPing()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-blush-300/60 bg-white/50 px-4 py-2.5 text-sm font-extrabold text-blush-700 transition hover:bg-white"
            >
              🔊 Note ping
            </button>
            <button
              onClick={() => {
                suppressNextClick()
                playHeart()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-blush-300/60 bg-white/50 px-4 py-2.5 text-sm font-extrabold text-blush-700 transition hover:bg-white"
            >
              💗 Heart chime
            </button>
            <button
              onClick={() => {
                suppressNextClick()
                softClick()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-blush-300/60 bg-white/50 px-4 py-2.5 text-sm font-extrabold text-blush-700 transition hover:bg-white"
            >
              👆 Click
            </button>
          </div>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Cloud sync ☁️
            </h3>
            <span className="flex items-center gap-2 pill">
              <span
                className={`h-2 w-2 rounded-full ${statusDot[syncStatus]}`}
              />
              <span className="text-[0.65rem] font-extrabold capitalize text-blush-500">
                {syncStatus}
              </span>
            </span>
          </div>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Our own little cloud — anything you or Ellie add shows up on the
            other PC automatically. Same room name on both, and you're matching.
          </p>

          <div className="mb-3 rounded-xl bg-white/50 p-3 text-xs font-semibold text-blush-500">
            {statusText[syncStatus]}
            {syncCfg.room ? (
              <span className="mt-1 block">
                Currently synced to room{' '}
                <span className="font-mono text-blush-700">{syncCfg.room}</span>
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Supabase project URL">
              <input
                className={inputCls}
                placeholder="https://xxxx.supabase.co"
                value={conn.url}
                onChange={(e) => setConn({ ...conn, url: e.target.value })}
              />
            </Field>
            <Field label="Supabase anon key">
              <input
                className={`${inputCls} font-mono text-[0.8rem]`}
                placeholder="eyJhbGciOi…"
                value={conn.key}
                onChange={(e) => setConn({ ...conn, key: e.target.value })}
              />
            </Field>
            <Field label="Our room name (type the same one on both PCs)">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="ellie-and-me"
                  value={conn.room}
                  onChange={(e) => setConn({ ...conn, room: e.target.value })}
                />
                <button
                  onClick={() => setConn({ ...conn, room: suggestRoom() })}
                  className="btn-ghost !px-3 text-sm"
                >
                  Surprise
                </button>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              {syncCfg.room ? (
                <button
                  onClick={disconnect}
                  className="btn-ghost text-blush-600 hover:text-blush-700"
                >
                  Unsync
                </button>
              ) : (
                <button onClick={connect} className="btn-candy">
                  <CheckIcon className="h-4.5 w-4.5" />
                  Connect to our cloud
                </button>
              )}
              <button onClick={syncNow} className="btn-ghost">
                Sync now
              </button>
            </div>
          </div>

          <details className="mt-4 rounded-xl bg-white/50 p-3">
            <summary className="cursor-pointer text-xs font-extrabold text-blush-600">
              First time? How to set this up (free, 5 minutes)
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs font-semibold text-blush-600">
              <li>
                Go to{' '}
                <span className="font-extrabold">supabase.com</span> and sign in
                with any email (free).
              </li>
              <li>
                New Project → pick a name, save the Database Password, pick a
                region close to us.
              </li>
              <li>
                In the left menu open <span className="font-extrabold">
                  SQL Editor
                </span>{' '}
                → New query, paste the snippet below, press Run.
              </li>
              <li>
                Settings → API (or Project Settings → API). Copy the{' '}
                <span className="font-extrabold">Project URL</span> and the{' '}
                <span className="font-extrabold">anon</span> key.
              </li>
              <li>
                Paste both here, pick a room name, press Connect — do the exact
                same (same room name) on the other PC.
              </li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 text-[10px] leading-relaxed text-blush-700">
{`create table public.rooms (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.rooms replica identity full;
alter table public.rooms enable row level security;
create policy "select" on public.rooms
  for select using (true);
create policy "insert" on public.rooms
  for insert with check (true);
create policy "update" on public.rooms
  for update using (true) with check (true);`}
            </pre>
          </details>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Custom emojis
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Import cute little images to use as stickers in Love Notes — tap a
            sticker in a note to drop it in your message.
          </p>

          <div>
            <button
              onClick={() => emojiRef.current?.click()}
              disabled={busy}
              className="btn-candy"
            >
              <PhotoIcon className="h-4.5 w-4.5" />
              {busy ? 'Reading…' : 'Import emojis'}
            </button>
            <p className="mt-2 text-xs font-bold text-blush-500">
              PNG, JPG or GIF — up to 30 stickers.
            </p>
          </div>
          <input
            ref={emojiRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void importEmojis(e.target.files)
              e.target.value = ''
            }}
          />

          {customEmojis.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {customEmojis.map((e) => (
                <div
                  key={e.id}
                  className="group relative grid h-14 w-14 place-items-center rounded-2xl bg-white/70 p-1.5"
                >
                  <img
                    src={e.src}
                    alt={e.name}
                    className="h-8 w-8 object-contain"
                  />
                  <button
                    onClick={() => removeEmoji(e.id)}
                    aria-label={`Remove ${e.name}`}
                    className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-blush-500 text-white opacity-0 shadow transition group-hover:opacity-100"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-1.5 text-[0.55rem] font-extrabold text-blush-600 shadow">
                    :{e.name}:
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Spotify streaming 🎵
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Stream Spotify right inside the app. It needs a{' '}
            <b>Premium</b> account — use yours on both PCs so you both get
            in-app playback.
          </p>

          {spotify.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className={`pill ${spotify.premium ? '' : '!bg-white/60'}`}>
                {spotify.premium ? 'Premium ✓' : 'Free plan'}
              </span>
              <span className="text-sm font-extrabold text-blush-700">
                {spotify.account}
              </span>
              <button
                onClick={() => void connectSpotifyNow()}
                disabled={busy}
                className="btn-ghost !px-3 !py-2 text-sm"
              >
                {busy ? 'Reconnecting…' : 'Reconnect'}
              </button>
              <button
                onClick={() => {
                  disconnectSpotify()
                  pushToast('Spotify disconnected', '🔌')
                }}
                className="btn-ghost !px-3 !py-2 text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <Field label="Spotify Client ID">
                <input
                  className={inputCls}
                  placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </Field>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void connectSpotifyNow()}
                  disabled={busy || !clientId.trim()}
                  className="btn-candy"
                >
                  {busy ? 'Connecting…' : 'Connect Spotify'}
                </button>
                <span className="text-xs font-semibold text-blush-500">
                  Opens Spotify's login page in your browser.
                </span>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-extrabold text-blush-500">
                  First time? How to connect
                </summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs font-semibold text-blush-600">
                  <li>
                    Go to <code>developer.spotify.com/dashboard</code>, log in
                    (free) and click *Create app*.
                  </li>
                  <li>Copy the <b>Client ID</b> shown there.</li>
                  <li>
                    In the same app settings, add this exact Redirect URI:{' '}
                    <code className="break-all text-blush-800">{SPOTIFY_REDIRECT}</code>
                  </li>
                  <li>Paste the Client ID above and press <b>Connect Spotify</b>.</li>
                  <li>
                    Playback needs a <b>Premium</b> account. To stream on both
                    PCs, log in here with your Premium account on each one.
                  </li>
                </ol>
              </details>
            </>
          )}

          {spotify.connected && !spotify.premium && (
            <p className="mt-3 rounded-xl bg-white/50 p-3 text-xs font-semibold text-blush-500">
              This Spotify account isn't Premium, so in-app streaming is off —
              songs fall back to *Open in Spotify*. Log in with your Premium
              account here to unlock streaming.
            </p>
          )}
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Our anniversary
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Set the day we became us — this powers the days-together counter
            on Home.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Anniversary date">
              <input
                type="date"
                value={draft}
                max={todayISO()}
                onChange={(e) => setDraft(e.target.value)}
                className={`${inputCls} w-52`}
              />
            </Field>
            <button onClick={saveAnniversary} className="btn-candy">
              <CalendarIcon className="h-4.5 w-4.5" />
              Save
            </button>
          </div>
          {anniversary && (
            <p className="mt-3 text-sm font-semibold text-blush-700/80">
              {prettyFull(anniversary)} — that's{' '}
              <span className="font-extrabold text-blush-600">
                {daysTogether(anniversary).toLocaleString()}
              </span>{' '}
              sweet days together! 💞
            </p>
          )}
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Profile pictures
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Add a photo for each of you — it shows up in your avatar around the
            app and next to your name.
          </p>
          <div className="flex flex-wrap gap-4">
            {(['you', 'ellie'] as const).map((w) => (
              <div
                key={w}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 p-3"
              >
                <Avatar who={w} size={56} />
                <div className="flex flex-col gap-2">
                  <span className="font-display font-extrabold text-blush-900">
                    {WHO_NAME[w]}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => avatarRefs.current[w]?.click()}
                      className="btn-ghost text-sm"
                    >
                      <PhotoIcon className="h-4 w-4" />
                      {profiles[w]?.src ? 'Change' : 'Upload'}
                    </button>
                    {profiles[w]?.src && (
                      <button
                        onClick={() => clearProfilePic(w)}
                        className="btn-ghost text-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={(el) => {
                    avatarRefs.current[w] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void pickProfilePic(w, e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            Who are you
          </h3>
          <p className="mb-4 text-sm font-semibold text-blush-700/75">
            Tap to flip who's using the app right now — this also switches who
            gets pinged about love notes.
          </p>
          <div className="flex gap-3">
            {(['you', 'ellie'] as const).map((w) => (
              <button
                key={w}
                onClick={() => {
                  if (as === w) {
                    suppressNextClick()
                    return
                  }
                  setAs(w)
                  pushToast(`Now viewing as ${WHO_NAME[w]}`, '🌸')
                }}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-3 transition ${
                  as === w
                    ? 'border-blush-300 bg-white/85 shadow-[0_14px_30px_-22px_rgba(251,98,165,0.9)]'
                    : 'border-white/60 bg-white/40 hover:bg-white/60'
                }`}
              >
                <Avatar who={w} size={40} />
                <span className="font-display font-extrabold text-blush-900">
                  {WHO_NAME[w]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              App updates
            </h3>
            <p className="text-sm font-semibold text-blush-700/75">
              {isTauri
                ? appVersion
                  ? `You're on version ${appVersion}.`
                  : 'Check for a new version.'
                : 'The web app keeps itself up to date — check for a new version anytime.'}
              {updateMsg && (
                <span className="mt-0.5 block text-xs font-bold text-blush-500">
                  {updateMsg}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => void checkForUpdates()}
            disabled={updating}
            className="btn-candy disabled:opacity-60"
          >
            {updating ? '…' : 'Check for updates'}
          </button>
        </div>
      </section>

      <section className="glass p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-md min-w-0">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Backup &amp; restore 💾
            </h3>
            <p className="text-sm font-semibold text-blush-700/75">
              Save a copy of everything — checklist, dates, wishlist, memories,
              treat jar points, notes and more. Restoring only ever{' '}
              <b>adds</b> things back; it never deletes what you already have.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={saveBackup} className="btn-candy">
              Download backup
            </button>
            <button
              onClick={() => backupRef.current?.click()}
              className="btn-ghost"
            >
              Restore backup
            </button>
          </div>
        </div>
        <input
          ref={backupRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void loadBackup(e.target.files)
            e.target.value = ''
          }}
        />
      </section>

      <section className="glass p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Reset everything
            </h3>
            <p className="text-sm font-semibold text-blush-700/75">
              Clears all dates, memories, treats, notes, playlists, points &
              the anniversary.
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-full border border-blush-300/70 bg-white/50 px-5 py-2.5 text-sm font-extrabold text-blush-600 transition hover:bg-white hover:text-blush-700"
          >
            Reset app
          </button>
        </div>
      </section>

      <footer className="flex items-center justify-center gap-2 pb-2 text-center text-xs font-bold text-blush-500">
        <HeartIcon className="h-3.5 w-3.5" />
        For Ellie, Micah loves you lots like polka dots!
      </footer>
    </div>
  )
}