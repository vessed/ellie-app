# 💗 Ellie App

A private, offline-first companion desktop app for **Micah & Ellie** — a cozy
little shared world with a daily page, mood board, memories, a treat jar, love
notes, a wishlist, a to‑do list, an editable rulebook, a music player, a
playroom of mini‑games, a virtual pup, and a little garden.

Everything works **fully offline** by default and saves to the local device. If
you want, you can connect your **own Supabase project** so both PCs stay in
sync automatically.

> This is a personal project built for two people — not a public/store app.
> Your data lives on your own PCs and (optionally) in your own Supabase project.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [npm scripts](#npm-scripts)
- [Building the Windows installer](#building-the-windows-installer)
- [Cloud sync setup](#cloud-sync-setup)
- [How sync behaves](#how-sync-behaves)
- [Where data is stored](#where-data-is-stored)
- [Project structure](#project-structure)
- [Auto‑updates & releases](#auto-updates--releases)
- [Notes & security](#notes--security)

---

## Features

**Pages**

| Page | What it does |
| --- | --- |
| **Home** | A friendly landing dashboard linking to everything, plus days-together. |
| **Daily** | A "puppy of the day" photo, a sweet quote, and a personal daily reminder. |
| **Our Moods** | A board of how each of you is feeling; moods fade after 24h and notify the other. |
| **Checklist** | A daily to-do list with a routine, a saved log of past days, and a star/mood rating. |
| **Playroom** | Nine mini‑games with high scores and a rotating daily challenge. |
| **Dates** | Plan, edit and keep all your date ideas in one place. |
| **Memories** | Photo/quote cards of the little things you never want to forget. |
| **Treat Jar** | A points balance (edited by Micah) plus treat requests you can approve/deny. |
| **Wishlist** | Ellie's wishlist of things to look forward to. |
| **Music** | Build playlists from local files, YouTube links, or Spotify. |
| **Love Notes** | Notes to each other with importable custom-emoji stickers. |
| **Rulebook** | The editable "rules for my little girl" plus reminders. |
| **Settings** | Themes, anniversary, cloud sync, custom emojis, Spotify, updates, reset. |

**Playroom (9 games)**

- 🃏 **Memory Match** — find every matching pair.
- 🐹 **Whack‑a‑Pup** — tap the pup before it hides (three misses ends it).
- 💗 **Catch the Hearts** — slide the basket to catch falling hearts and stars.
- 🎵 **Simon Says** — repeat the growing colour/sound pattern.
- 🎀 **Hangman** — guess the hidden romantic word, letter by letter.
- 🐍 **Snake** — guide the snake to every blossom without biting yourself.
- 🧱 **Block Drop** — stack blocks and clear complete rows.
- 🐶 **Virtual Pup** _(care)_ — feed, brush, walk, cuddle and treat your pup.
- 🌷 **Little Garden** _(care)_ — water your seed daily and watch it bloom.

**Other touches**

- 🎨 Multiple pastel themes and a themable "our little world" layout.
- 🎵 A music player with **repeat** (off / all / one) and **shuffle**, plus a
  Spotify connect flow.
- 🔔 An in-app notification centre, toasts, and gentle sound effects.
- 🧷 Reorderable sidebar, per-device last-viewed page and role, error boundary,
  and automatic updates.

---

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (dev server + build)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Tauri 2** (Rust) — desktop shell, installer, auto‑updater
- **Supabase** (`@supabase/supabase-js`) — optional cloud sync

---

## Requirements

- **Node.js 20+** (developed on Node 24) and npm
- **Rust** toolchain (`rustup`, `cargo`) for the desktop builds
- **Windows**: WebView2 (bundled with Windows 11; installable on 10) and NSIS
  (Tauri downloads what it needs)
- For cloud sync: a free [Supabase](https://supabase.com) account

---

## Getting started

```powershell
# 1. install dependencies
npm install

# 2. run the desktop app with hot-reload
npm run app:dev
```

Or use the helper script (adds Cargo to PATH and runs Tauri):

```powershell
pwsh -File dev.ps1
```

Prefer the browser instead of Tauri? Run the web dev server:

```powershell
npm run dev   # http://localhost:1420
```

The app auto-plays a built-in playlist on launch (a user gesture isn't needed
once a song has been played before).

---

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite web dev server (HMR) on port `1420`. |
| `npm run app:dev` | Tauri desktop dev window (hot-reload). |
| `npm run build` | Type-check (`tsc -b`) + production web build to `dist/`. |
| `npm run app:build` | Build the Windows installer via Tauri. |
| `npm run preview` | Preview the production web build. |
| `npm run lint` | Run **oxlint**. |
| `npm run tauri` | Raw Tauri CLI passthrough. |

> The repo currently reports **0 lint errors** with a small number of known
> warnings (`react(purity)` / `react(refs)` advisories in a few files). These
> are benign and non-blocking.

---

## Building the Windows installer

```powershell
npm run app:build
# or
pwsh -File rebuild.ps1
```

Output (NSIS installer):

```
src-tauri\target\release\bundle\nsis\Ellie App_0.1.0_x64-setup.exe
```

---

## Cloud sync setup

Sync is **optional**. When it's off, the app is fully local. When it's on, both
PCs share the same room and changes show up on the other PC automatically.

1. Go to **supabase.com**, sign in with any email (free).
2. **New Project** → pick a name, save the database password, choose a region
   close to you.
3. In the left menu open **SQL Editor → New query**, paste the snippet below,
   and press **Run**:

   ```sql
   create table public.rooms (
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
     for update using (true) with check (true);
   ```

4. **Project Settings → API**: copy the **Project URL** and the **anon** key.
5. In the app: **Settings → Cloud sync ☁️** → paste both, choose a **room name**
   (only letters, numbers, dashes and dots), and press **Connect**.
6. Do the **exact same** steps on the other PC, using the **same room name**.

You'll see a live status dot: `off` / `connecting` / `synced` / `offline`, and
the room you're currently synced to. Use **Sync now** to force an immediate
round-trip, or **Unsync** to detach this device (see below).

---

## How sync behaves

- **It reconnects automatically.** The connection details are saved locally
  (`ellie-sync`) and reload on every launch — no need to re-press Connect after
  a restart, shutdown, or closing the app. There's no login token to expire.
- **Offline-first.** Edits are always written locally first. While a PC is off,
  it simply isn't syncing; on next launch it does an immediate poll, merges, and
  pushes anything new.
- **Merges, not clobbers.** List-style data (dates, notes, songs, etc.) is
  merged by id, with per-id tombstones so deletions stick. A few keys get
  purpose-built merges so nothing is lost:
  - **play** — high scores per game/player `max`, streak `max`, latest challenge day.
  - **care** — garden/pup merged (growth & streaks `max`, water-days unioned,
    pup bond `max`, adopt date earliest).
  - **hearts** — `max`.
  - **points** — newer value wins (it's a spendable balance, so it can go down).
- **~5 second cadence.** The app polls every 5s while open and pushes changes
  (debounced) as you make them. There is no background service.
- **Unsync** (Settings → Cloud sync) stops all polling/pushing and removes the
  credentials from this device. Your **local data is kept**. Re-connecting to
  the same room later still treats your unsynced local edits as the newer
  version, so they aren't overwritten.

### ⚠️ Free Supabase projects can pause

Supabase pauses **free-plan** projects that have **low database activity over a
7-day window**. Since the app pings the database while it's open, opening the app
occasionally (or visiting the project in the Supabase dashboard) is enough to
keep it alive. If it does pause:

- You'll get a warning email ~a week before, then a confirmation email.
- While paused the app just shows `offline`/`off`; **nothing is lost**.
- Restore with **Dashboard → project → Resume project** (data intact; 1-year
  restore window).

To avoid pausing entirely, either keep up light activity, set up a scheduled
heartbeat, or move to a paid plan (paid projects can't be paused).

---

## Where data is stored

- **`localStorage`** — all app data and preferences. Key examples:
  - `ellie-sync` (cloud connection), `ellie-sync-meta` (per-key sync timestamps)
  - `ellie-route` / `ellie-as` (last-viewed page + role, per device)
  - `ellie-theme`, `ellie-anniversary`, `ellie-points`, `ellie-play`,
    `ellie-care`, `ellie-volume`, `ellie-repeat`, `ellie-shuffle`, etc.
- **IndexedDB** (`ellie-audio`) — imported **local music files** are stored as
  blobs keyed by song id, so they persist across restarts on the device that
  imported them. They aren't synced (a local file only exists on that PC).

On Windows the desktop app stores web storage under:

```
%LOCALAPPDATA%\com.ellie.app\EBWebView\Default\Local Storage\leveldb
```

---

## Project structure

```
ellie-app/
├─ src/
│  ├─ App.tsx                 # providers + route switch
│  ├─ main.tsx
│  ├─ index.css               # Tailwind + theme tokens & utilities
│  ├─ components/             # Sidebar, TopBar, Background, Toasts, Icons, …
│  │  └─ games/               # the 9 mini-games + care checklist
│  ├─ lib/
│  │  ├─ store.tsx            # app state, persistence, sync engine
│  │  ├─ sync.ts              # Supabase client, merge logic, push/fetch
│  │  ├─ types.ts             # shared types, defaults, normalizeCare
│  │  ├─ play.ts / care.ts    # playroom + pup/garden state
│  │  ├─ player.tsx           # audio/YouTube/Spotify engine (repeat, shuffle)
│  │  ├─ localAudio.ts        # IndexedDB store for imported local audio
│  │  ├─ media.ts / sound.ts  # helpers
│  │  └─ games.ts             # game registry + daily challenge
│  └─ pages/                  # Home, Daily, Dates, Memories, Treats, Notes,
│                             # Music, Wishlist, Mood, Todo, Rules, Playroom,
│                             # Settings
├─ src-tauri/                 # Rust/Tauri shell, tauri.conf.json, icons
├─ public/                    # built-in mp3s, favicon, icons
├─ dev.ps1                    # run desktop dev
└─ rebuild.ps1                # build the Windows installer
```

---

## Auto-updates & releases

The app uses Tauri's updater plugin, pointed at:

```
https://github.com/vessed/ellie-app/releases/latest/download/latest.json
```

When publishing a build, the updater artifacts are signed with the private key
in `tauri-updater-private.key`:

- Set `TAURI_SIGNING_PRIVATE_KEY` to the contents of that key file (and the key
  password if one is set) before running `npm run app:build`.
- The build produces a `.sig` file next to the installer; paste its contents
  into the `latest.json` you upload with the new release.
- Bump `version` in `src-tauri/tauri.conf.json` (currently `0.1.0`) and in
  `package.json` for each release.

---

## Notes & security

- **Keep `tauri-updater-private.key` secret.** Anyone with it can sign updates
  that your installations will trust. Never commit it publicly.
- The Supabase **anon** key is safe to paste into the app; the sync table uses
  permissive policies intended for two trusted devices. If you ever share the
  project, change the room name so others can't read your room.
- Deleting a local song removes it from the playlist but its audio blob may
  remain in IndexedDB; clearing the app's site data removes it.
- The Rulebook and reminder text are personal content meant for this app only.
