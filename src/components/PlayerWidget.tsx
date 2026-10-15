import { useApp } from '../lib/store'
import { usePlayer } from '../lib/player'
import {
  MusicIcon,
  PauseIcon,
  PlayIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from './Icons'
import { openExternal, spotifyDeep } from '../lib/media'

export function PlayerWidget() {
  const { setRoute } = useApp()
  const {
    song,
    playing,
    time,
    duration,
    toggle,
    next,
    prev,
    queue,
    isExternal,
  } = usePlayer()

  const pct =
    song && duration > 0 ? Math.min(100, (time / duration) * 100) : 0

  return (
    <div
      onClick={() => setRoute('music')}
      className="glass-soft relative flex h-14 w-64 cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl border-blush-200/70 bg-gradient-to-br from-blush-200/50 to-lilac-200/40 px-3 transition hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setRoute('music')
      }}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
          playing ? 'animate-bob' : ''
        }`}
      >
        <MusicIcon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[0.6rem] font-extrabold uppercase tracking-wider text-blush-400">
          now playing
        </span>
        <span className="block truncate text-sm font-extrabold text-blush-800">
          {song ? song.title : 'Pick a song ♪'}
        </span>
      </span>

      {!song || isExternal ? (
        <button
          onClick={(e) => {
            if (!song || !isExternal) return
            e.stopPropagation()
            void openExternal(spotifyDeep(song.url || ''))
          }}
          title={song && isExternal ? 'Open in Spotify' : undefined}
          className="pill shrink-0 !px-2 !py-1 text-[0.6rem]"
        >
          {song && isExternal ? '▶ in Spotify' : '♪'}
        </button>
      ) : (
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous"
            className="ctrl !h-7 !w-7"
          >
            <SkipPrevIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggle()
            }}
            aria-label={playing ? 'Pause' : 'Play'}
            className="btn-candy h-9 w-9 rounded-full !px-0"
          >
            {playing ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="ml-0.5 h-4 w-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next"
            className="ctrl !h-7 !w-7"
            disabled={queue.length <= 1}
          >
            <SkipNextIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/40">
        <span
          className="block h-full rounded-r-full bg-gradient-to-r from-blush-400 to-lilac-400 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  )
}