import { useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { formatTime, usePlayer } from '../lib/player'
import { looksSpotify, looksYoutube, openExternal, spotifyDeep, spotifyEmbed, youtubeEmbed, youtubeId } from '../lib/media'
import { saveAudio } from '../lib/localAudio'

import {
  uid,
  type Playlist,
  type Song,
  type SongKind,
} from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import {
  ImportIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReplayIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  SpotifyIcon,
  SkipNextIcon,
  SkipPrevIcon,
  TrashIcon,
  VolumeIcon,
  YoutubeIcon,
} from '../components/Icons'
import { Field, Modal, inputCls } from '../components/Modal'

const PLAYLIST_EMOJIS = ['🎧', '🌙', '🌈', '🏖️', '🎶', '💃', '🪐', '☕']

export function Music() {
  const { songs, setSongs, playlists, setPlaylists, pushToast } = useApp()
  const player = usePlayer()
  const { song, playing, time, duration, volume, isExternal } = player

  const [activeId, setActiveId] = useState<string>(
    playlists[0]?.id ?? '',
  )
  const [showImport, setShowImport] = useState(false)
  const [showImportPlaylist, setShowImportPlaylist] = useState(false)
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)

  const active: Playlist | undefined = playlists.find(
    (p) => p.id === activeId,
  )
  const activeSongs = active
    ? active.songIds
        .map((id) => songs.find((s) => s.id === id))
        .filter((s): s is Song => Boolean(s))
    : []

  const playPlaylist = (id: string) => {
    const pl = playlists.find((p) => p.id === id)
    if (!pl) return
    const list = pl.songIds
      .map((sid) => songs.find((s) => s.id === sid))
      .filter((s): s is Song => Boolean(s))
    if (list.length === 0) {
      pushToast('This playlist is empty — import a song! 🎵', '🙈')
      return
    }
    if (list.every((s) => s.kind === 'spotify')) {
      if (player.spotify.connected && player.spotify.premium) {
        player.playQueue(list, 0)
        pushToast(`Now playing “${pl.name}” 🎶`, '🎧')
      } else {
        void openExternal(spotifyDeep(list[0].url || ''))
        pushToast(`Opening “${pl.name}” in Spotify 🎧`, '🎧')
      }
      return
    }
    player.playQueue(list, 0)
    pushToast(`Now playing “${pl.name}” 🎶`, '🎧')
  }

  const removeSong = (playlistId: string, songId: string) => {
    setPlaylists(
      playlists.map((p) =>
        p.id === playlistId
          ? { ...p, songIds: p.songIds.filter((x) => x !== songId) }
          : p,
      ),
    )
  }

  const deletePlaylist = (id: string) => {
    const rest = playlists.filter((p) => p.id !== id)
    setPlaylists(rest)
    if (activeId === id) setActiveId(rest[0]?.id ?? '')
    pushToast('Playlist deleted', '🗑️')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🎧"
        title="Our Music"
        subtitle="Make playlists just for us — from local songs, YouTube, or Spotify."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportPlaylist(true)}
              className="btn-ghost"
            >
              <PlusIcon className="h-4.5 w-4.5" />
              Import playlist
            </button>
            <button onClick={() => setShowImport(true)} className="btn-candy">
              <ImportIcon className="h-4.5 w-4.5" />
              Import songs
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <NowPlaying
          song={song}
          playing={playing}
          time={time}
          duration={duration}
          volume={volume}
          isExternal={isExternal}
        />

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-blush-900">
              Playlists
            </h3>
            <button
              onClick={() => setShowNewPlaylist(true)}
              className="btn-ghost !px-3 !py-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              New
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="glass-soft flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <span className="text-3xl">🎶</span>
              <p className="mt-2 text-sm font-bold text-blush-600">
                No playlists yet — make your first one!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    activeId === p.id
                      ? 'border-blush-300 bg-white/80 shadow-[0_14px_30px_-22px_rgba(251,98,165,0.9)]'
                      : 'border-white/60 bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blush-200 to-lilac-200 text-xl">
                    {p.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-extrabold text-blush-900">
                      {p.name}
                    </span>
                    <span className="block text-xs font-bold text-blush-500">
                      {p.embedUrl ? 'External playlist' : `${p.songIds.length} songs`}
                    </span>
                  </span>
                  {p.embedUrl ? (
                    <span className="pill shrink-0 !px-2 !py-1 text-[0.65rem]">
                      🎧 live
                    </span>
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        void playPlaylist(p.id)
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full bg-blush-500 text-white shadow transition hover:scale-105"
                      role="button"
                      aria-label={`Play ${p.name}`}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </span>
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePlaylist(p.id)
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full text-blush-400 transition hover:bg-white/70 hover:text-blush-600"
                    role="button"
                    aria-label={`Delete ${p.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            {active ? `${active.emoji} ${active.name}` : 'Songs'}
          </h3>
          <span className="pill">
            {activeSongs.length} songs
          </span>
        </div>

        {!active ? (
          <div className="glass flex flex-col items-center justify-center p-10 text-center">
            <span className="text-4xl">🎵</span>
            <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
              No playlist selected
            </p>
            <p className="mt-1 max-w-md text-sm font-semibold text-blush-500">
              Pick one of our playlists on the left, or import songs from your
              device, YouTube or Spotify.
            </p>
          </div>
        ) : active.embedUrl ? (
          <div className="glass overflow-hidden p-4">
            <iframe
              className="h-[400px] w-full rounded-xl border-0"
              src={active.embedUrl}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              title={active.name}
            />
            <p className="mt-3 text-center text-xs font-semibold text-blush-500">
              This whole playlist is embedded — press play inside and enjoy. It
              streams straight from the source, so it needs internet.
            </p>
          </div>
        ) : activeSongs.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center p-10 text-center">
            <span className="text-4xl">🎵</span>
            <p className="mt-3 font-display text-xl font-extrabold text-blush-800">
              This playlist is waiting
            </p>
            <p className="mt-1 max-w-md text-sm font-semibold text-blush-500">
              Import songs from your device, YouTube or Spotify to fill it with
              our music.
            </p>
          </div>
        ) : (
          <div className="glass overflow-hidden p-2">
            <div className="relative z-10 flex flex-col gap-1">
              {activeSongs.map((s, i) => {
                const nowNowPlaying = song?.id === s.id
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-2xl p-2.5 transition ${
                      nowNowPlaying ? 'bg-white/80' : 'hover:bg-white/50'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (
                          s.kind === 'spotify' &&
                          !(player.spotify.connected && player.spotify.premium)
                        ) {
                          void openExternal(spotifyDeep(s.url || ''))
                          pushToast(`Opening “${s.title}” in Spotify 🎧`, '🎧')
                          return
                        }
                        if (nowNowPlaying) {
                          player.toggle()
                        } else {
                          player.playQueue(activeSongs, i)
                        }
                      }}
                      aria-label={
                        nowNowPlaying && playing ? 'Pause' : 'Play'
                      }
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush-500 text-white shadow transition hover:scale-105"
                    >
                      {nowNowPlaying && playing ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>

                    <span className="grid h-8 w-8 shrink-0 place-items-center text-blush-400">
                      {s.kind === 'spotify' ? (
                        <SpotifyIcon className="h-5 w-5" />
                      ) : s.kind === 'youtube' ? (
                        <YoutubeIcon className="h-5 w-5" />
                      ) : (
                        <MusicIcon className="h-5 w-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-blush-900">
                        {s.title}
                      </p>
                      <p className="truncate text-xs font-bold text-blush-500">
                        {s.artist || '—'}
                      </p>
                    </div>

                    {nowNowPlaying && (
                      <span className="pill text-[0.65rem] text-blush-500">
                        {player.isExternal ? 'in Spotify ♪' : 'playing ♪'}
                      </span>
                    )}

                    <button
                      onClick={() => removeSong(active.id, s.id)}
                      aria-label={`Remove ${s.title}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-blush-400 transition hover:bg-white/70 hover:text-blush-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {showImport && (
        <ImportModal
          playlists={playlists}
          onClose={() => setShowImport(false)}
          onImport={(song, playlistId) => {
            setSongs([...songs, song])
            setPlaylists(
              playlists.map((p) =>
                p.id === playlistId
                  ? { ...p, songIds: [...p.songIds, song.id] }
                  : p,
              ),
            )
            if (!playlists.some((p) => p.id === playlistId)) {
              setActiveId(playlistId)
            }
            pushToast(`Added “${song.title}” to your playlist 🎵`, '🎶')
          }}
        />
      )}

      {showImportPlaylist && (
        <ImportPlaylistModal
          onClose={() => setShowImportPlaylist(false)}
          onSave={(name, emoji, embedUrl) => {
            const pl: Playlist = {
              id: uid(),
              name,
              emoji,
              songIds: [],
              embedUrl,
            }
            setPlaylists([...playlists, pl])
            setActiveId(pl.id)
            pushToast(`Playlist “${name}” imported ✨`, '🎧')
          }}
        />
      )}

      {showNewPlaylist && (
        <NewPlaylistModal
          onClose={() => setShowNewPlaylist(false)}
          onSave={(name, emoji) => {
            const pl = { id: uid(), name, emoji, songIds: [] as string[] }
            setPlaylists([...playlists, pl])
            setActiveId(pl.id)
            pushToast(`Playlist “${name}” created ✨`, '🎧')
          }}
        />
      )}
    </div>
  )
}

function NowPlaying({
  song,
  playing,
  time,
  duration,
  volume,
  isExternal,
}: {
  song: Song | null
  playing: boolean
  time: number
  duration: number
  volume: number
  isExternal: boolean
}) {
  const player = usePlayer()
  const { pushToast } = useApp()
  const embed = isExternal ? spotifyEmbed(song?.url || '') : null

  return (
    <div className="glass p-6 lg:col-span-3">
      <div className="relative z-10">
        <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-blush-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blush-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blush-500" />
          </span>
          now playing
        </div>

        {!song ? (
          <div className="flex h-[11rem] flex-col items-center justify-center text-center">
            <MusicIcon className="h-10 w-10 text-blush-300" />
            <p className="mt-3 font-display text-lg font-extrabold text-blush-600">
              Nothing playing yet
            </p>
            <p className="text-sm font-semibold text-blush-400">
              Pick a playlist or a song to start the vibes.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blush-300 to-lilac-300 text-3xl text-white shadow-glow">
              {isExternal ? '🎧' : '🎵'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-extrabold text-blush-900">
                {song.title}
              </p>
              <p className="truncate text-sm font-bold text-blush-500">
                {song.artist || '—'}
                {song.kind === 'youtube' && (
                  <span className="ml-2 pill !px-2 !py-0.5 text-[0.6rem]">
                    YouTube
                  </span>
                )}
                {song.kind === 'spotify' && (
                  <span className="ml-2 pill !px-2 !py-0.5 text-[0.6rem]">
                    Spotify
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {song && !isExternal && (
          <>
            <div className="mt-5 flex items-center gap-2">
              <span className="w-9 text-right text-xs font-bold text-blush-400">
                {formatTime(time)}
              </span>
              <input
                type="range"
                className="slider flex-1"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(time, duration || 0)}
                onChange={(e) => player.seek(Number(e.target.value))}
                aria-label="Seek"
              />
              <span className="w-9 text-xs font-bold text-blush-400">
                {formatTime(duration)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={player.toggleShuffle}
                aria-label={player.shuffle ? 'Shuffle on' : 'Shuffle off'}
                title={player.shuffle ? 'Shuffle: on' : 'Shuffle: off'}
                className={`ctrl !h-11 !w-11 ${
                  player.shuffle
                    ? '!bg-blush-300/70 !ring-2 !ring-blush-400'
                    : ''
                }`}
              >
                <ShuffleIcon className="h-5 w-5" />
              </button>
              <button onClick={player.prev} aria-label="Previous" className="ctrl !h-11 !w-11">
                <SkipPrevIcon className="h-5 w-5" />
              </button>
              <button onClick={player.replay} aria-label="Replay" className="ctrl !h-11 !w-11">
                <ReplayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={player.toggle}
                aria-label={playing ? 'Pause' : 'Play'}
                className="btn-candy h-14 w-14 rounded-full !p-0"
              >
                {playing ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="ml-0.5 h-6 w-6" />
                )}
              </button>
              <button
                onClick={player.next}
                aria-label="Next"
                className="ctrl !h-11 !w-11"
                disabled={player.queue.length <= 1}
              >
                <SkipNextIcon className="h-5 w-5" />
              </button>
              <button
                onClick={player.cycleRepeat}
                aria-label={
                  player.repeat === 'off'
                    ? 'Repeat off'
                    : player.repeat === 'all'
                      ? 'Repeat all'
                      : 'Repeat one song'
                }
                title={
                  player.repeat === 'off'
                    ? 'Repeat: off'
                    : player.repeat === 'all'
                      ? 'Repeat: all'
                      : 'Repeat: one song'
                }
                className={`ctrl !h-11 !w-11 ${
                  player.repeat !== 'off'
                    ? '!bg-blush-300/70 !ring-2 !ring-blush-400'
                    : ''
                }`}
              >
                {player.repeat === 'one' ? (
                  <RepeatOneIcon className="h-5 w-5" />
                ) : (
                  <RepeatIcon className="h-5 w-5" />
                )}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <VolumeIcon className="h-5 w-5 text-blush-500" />
                <input
                  type="range"
                  className="slider w-28"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => player.setVolume(Number(e.target.value))}
                  aria-label="Volume"
                />
              </div>
            </div>
          </>
        )}

        {song && isExternal && embed && (
          <div>
            <button
              onClick={() => {
                void openExternal(spotifyDeep(song.url || ''))
                pushToast(`Opening “${song.title}” in Spotify 🎧`, '🎧')
              }}
              className="btn-candy mt-4 w-full"
            >
              <SpotifyIcon className="h-4.5 w-4.5" />
              Open in Spotify
            </button>
            <p className="mt-2 text-center text-xs font-semibold text-blush-500">
              Full song plays in your Spotify app — click above, or use the
              little preview below. 🎧
            </p>
            <iframe
              className="mt-2 h-[152px] w-full rounded-xl border-0"
              src={embed}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              title={song.title}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ImportModal({
  playlists,
  onClose,
  onImport,
}: {
  playlists: Playlist[]
  onClose: () => void
  onImport: (song: Song, playlistId: string) => void
}) {
  const { pushToast } = useApp()
  const [kind, setKind] = useState<SongKind>('youtube')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id ?? '')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState('')

  const confirm = () => {
    if (!playlistId) {
      pushToast('Create a playlist first 🎧', '🙈')
      return
    }
    if (kind === 'file') {
      const f = fileRef.current?.files?.[0]
      if (!f) {
        pushToast('Choose a song file first 🎵', '🙈')
        return
      }
      const song: Song = {
        id: uid(),
        title: title.trim() || f.name.replace(/\.[^.]+$/, ''),
        artist: artist.trim() || 'Local',
        kind: 'file',
      }
      void saveAudio(song.id, f)
      onImport(song, playlistId)
      pushToast('Saved to this device 💾', '🎵')
      onClose()
      return
    }

    if (!url.trim()) {
      pushToast('Paste a link first 🔗', '🙈')
      return
    }
    if (kind === 'youtube' && !looksYoutube(url)) {
      pushToast('That does not look like a YouTube link', '🙈')
      return
    }
    if (kind === 'spotify' && !looksSpotify(url)) {
      pushToast('That does not look like a Spotify link', '🙈')
      return
    }

    const song: Song = {
      id: uid(),
      title: title.trim() || (kind === 'youtube' ? `YouTube · ${youtubeId(url)}` : 'Spotify track'),
      artist: artist.trim() || (kind === 'youtube' ? 'YouTube' : 'Spotify'),
      kind,
      url: url.trim(),
    }
    onImport(song, playlistId)
    onClose()
  }

  const tabs: { key: SongKind; label: string; icon: typeof MusicIcon }[] = [
    { key: 'youtube', label: 'YouTube', icon: YoutubeIcon },
    { key: 'spotify', label: 'Spotify', icon: SpotifyIcon },
    { key: 'file', label: 'Local file', icon: ImportIcon },
  ]

  return (
    <Modal title="Import music" emoji="🎶" onClose={onClose}>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setKind(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition ${
              kind === t.key
                ? 'bg-blush-500 text-white shadow'
                : 'bg-white/70 text-blush-600 hover:bg-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {kind === 'file' ? (
        <div
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          className="mb-4 grid h-28 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-blush-300/70 bg-white/50 p-4 text-center transition hover:bg-white/70"
        >
          <div>
            <ImportIcon className="mx-auto h-7 w-7 text-blush-400" />
            <p className="mt-2 text-sm font-bold text-blush-600">
              {fileName || 'Choose an audio file'}
            </p>
            <p className="text-xs font-semibold text-blush-400">
              MP3, M4A, WAV, OGG…
            </p>
          </div>
        </div>
      ) : (
        <Field label={`${kind === 'youtube' ? 'YouTube' : 'Spotify'} link`}>
          <input
            className={inputCls}
            placeholder={
              kind === 'youtube'
                ? 'https://youtube.com/watch?v=…'
                : 'https://open.spotify.com/track/…'
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileName(f ? f.name : '')
          if (f) setTitle(f.name.replace(/\.[^.]+$/, ''))
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Title">
          <input
            className={inputCls}
            placeholder="Song name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Artist">
          <input
            className={inputCls}
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Add to playlist">
        <select
          className={inputCls}
          value={playlistId}
          onChange={(e) => setPlaylistId(e.target.value)}
        >
          {playlists.length === 0 && <option value="">No playlists</option>}
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-4 flex gap-3">
        <button onClick={confirm} className="btn-candy flex-1">
          Add to playlist
        </button>
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function ImportPlaylistModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (name: string, emoji: string, embedUrl: string) => void
}) {
  const { pushToast } = useApp()
  const [kind, setKind] = useState<'youtube' | 'spotify'>('youtube')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎧')

  const setUrlSmart = (v: string) => {
    setUrl(v)
    if (looksSpotify(v)) setKind('spotify')
    else if (looksYoutube(v)) setKind('youtube')
  }

  const save = () => {
    const trimUrl = url.trim()
    if (!trimUrl) {
      pushToast('Paste a Spotify or YouTube playlist link 🔗', '🙈')
      return
    }
    let embed: string | null = null
    if (kind === 'spotify') {
      if (!looksSpotify(trimUrl)) {
        pushToast('That does not look like a Spotify link', '🙈')
        return
      }
      embed = spotifyEmbed(trimUrl)
      if (!embed) {
        pushToast('Could not read that Spotify link', '🙈')
        return
      }
    } else {
      if (!looksYoutube(trimUrl)) {
        pushToast('That does not look like a YouTube link', '🙈')
        return
      }
      embed = youtubeEmbed(trimUrl)
      if (!embed) {
        pushToast('Could not read that YouTube link', '🙈')
        return
      }
    }
    const fallback =
      kind === 'spotify'
        ? `Our Spotify • ${trimUrl.match(/open\.spotify\.com\/(\w+)/)?.[1] ?? ''}`.trim()
        : 'Our YouTube mix'
    onSave(name.trim() || fallback, emoji, embed)
    onClose()
  }

  return (
    <Modal title="Import a playlist" emoji="🎧" onClose={onClose}>
      <div className="mb-4 flex gap-2">
        {(
          [
            { key: 'youtube', label: 'YouTube', icon: YoutubeIcon },
            { key: 'spotify', label: 'Spotify', icon: SpotifyIcon },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setKind(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition ${
              kind === t.key
                ? 'bg-blush-500 text-white shadow'
                : 'bg-white/70 text-blush-600 hover:bg-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <Field label={`${kind === 'youtube' ? 'YouTube' : 'Spotify'} playlist link`}>
        <input
          className={inputCls}
          placeholder={
            kind === 'youtube'
              ? 'https://youtube.com/playlist?list=…'
              : 'https://open.spotify.com/playlist/…'
          }
          value={url}
          onChange={(e) => setUrlSmart(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Playlist name (optional)">
          <input
            className={inputCls}
            placeholder={kind === 'youtube' ? 'Our YouTube mix' : 'Our Spotify'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Pick a sticker">
          <div className="grid grid-cols-5 gap-1.5">
            {PLAYLIST_EMOJIS.slice(0, 5).map((e) => (
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
      </div>

      <p className="mb-3 rounded-xl bg-white/50 p-3 text-xs font-semibold text-blush-500">
        The whole playlist will show up embedded inside the music page — albums,
        mixes and playlists from {kind === 'youtube' ? 'YouTube' : 'Spotify'}{' '}
        all work. It streams live, so internet is needed.
      </p>

      <div className="mt-2 flex gap-3">
        <button onClick={save} className="btn-candy flex-1">
          Import playlist
        </button>
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function NewPlaylistModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (name: string, emoji: string) => void
}) {
  const { pushToast } = useApp()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎧')

  const save = () => {
    if (!name.trim()) {
      pushToast('Name your playlist 🎧', '🙈')
      return
    }
    onSave(name.trim(), emoji)
    onClose()
  }

  return (
    <Modal title="New playlist" emoji="🎧" onClose={onClose}>
      <Field label="Playlist name">
        <input
          autoFocus
          className={inputCls}
          placeholder="Our Road Trip Jams"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Pick a sticker">
        <div className="flex flex-wrap gap-2">
          {PLAYLIST_EMOJIS.map((e) => (
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
          Create playlist
        </button>
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
      </div>
    </Modal>
  )
}