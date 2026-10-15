import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Song } from './types'
import { resolveAudioUrl } from './localAudio'
import { spotifyDeep } from './media'
import {
  clearProfile,
  ensureSpotifySDK,
  ensureToken,
  loadProfile,
  spotifyMe,
  spotifyREST,
  startSpotifyAuth,
} from './spotify'

export function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const VOLUME_KEY = 'ellie-volume'

function loadVolume() {
  const raw = localStorage.getItem(VOLUME_KEY)
  if (raw == null) return 0.05
  const v = parseFloat(raw)
  return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.05
}

export type RepeatMode = 'off' | 'all' | 'one'

const REPEAT_KEY = 'ellie-repeat'

function loadRepeat(): RepeatMode {
  const raw = localStorage.getItem(REPEAT_KEY)
  return raw === 'all' || raw === 'one' ? raw : 'off'
}

const SHUFFLE_KEY = 'ellie-shuffle'

function loadShuffle() {
  return localStorage.getItem(SHUFFLE_KEY) === '1'
}

function shuffledOther(len: number, current: number): number[] {
  const idx: number[] = []
  for (let i = 0; i < len; i++) if (i !== current) idx.push(i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = idx[i]
    idx[i] = idx[j]
    idx[j] = t
  }
  return idx
}

function youtubeId(url: string) {
  const m =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/embed\/([^?]+)/)
  return m ? m[1] : ''
}

let ytPromise: Promise<any> | null = null
function ensureYT(): Promise<any> {
  if (ytPromise) return ytPromise
  ytPromise = new Promise((resolve, reject) => {
    const w = window as any
    if (w.YT && w.YT.Player) {
      resolve(w.YT)
      return
    }
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve(w.YT)
    }
    if (!document.getElementById('yt-api')) {
      const s = document.createElement('script')
      s.id = 'yt-api'
      s.src = 'https://www.youtube.com/iframe_api'
      s.onerror = () => reject(new Error('yt load failed'))
      document.head.appendChild(s)
    }
  })
  return ytPromise
}

interface PlayerValue {
  song: Song | null
  playing: boolean
  time: number
  duration: number
  volume: number
  queue: Song[]
  index: number
  isExternal: boolean
  spotify: { connected: boolean; account: string; premium: boolean; busy: boolean }
  connectSpotify: (clientId: string) => Promise<{ ok: boolean; message: string }>
  disconnectSpotify: () => void
  playQueue: (songs: Song[], index: number) => void
  playSong: (song: Song) => void
  toggle: () => void
  next: () => void
  prev: () => void
  replay: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
  repeat: RepeatMode
  cycleRepeat: () => void
  shuffle: boolean
  toggleShuffle: () => void
  stop: () => void
}

const PlayerContext = createContext<PlayerValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytWrapRef = useRef<HTMLDivElement | null>(null)
  const ytHostRef = useRef<HTMLDivElement | null>(null)
  const ytRef = useRef<any>(null)
  const volumeRef = useRef(loadVolume())
  const spotifyPlayerRef = useRef<any>(null)
  const spotifyDeviceRef = useRef<string>('')
  const bagRef = useRef<number[]>([])
  const playedRef = useRef<number[]>([])

  const [song, setSong] = useState<Song | null>(null)
  const [queue, setQueue] = useState<Song[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState<number>(loadVolume())
  const [repeat, setRepeatState] = useState<RepeatMode>(loadRepeat())
  const [shuffle, setShuffleState] = useState<boolean>(loadShuffle())
  const [spotify, setSpotify] = useState<{
    connected: boolean
    account: string
    premium: boolean
    busy: boolean
  }>({ connected: false, account: '', premium: false, busy: false })

  const spotifyOn = spotify.connected && spotify.premium
  const isExternal = song?.kind === 'spotify' && !spotifyOn

  const pauseEngines = () => {
    const a = audioRef.current
    if (a) a.pause()
    const y = ytRef.current
    if (y && y.pauseVideo) y.pauseVideo()
  }

  const applyVolume = () => {
    const a = audioRef.current
    if (a) a.volume = volumeRef.current
    const y = ytRef.current
    if (y && y.setVolume) y.setVolume(volumeRef.current * 100)
    const sp = spotifyPlayerRef.current
    if (sp && sp.setVolume) sp.setVolume(volumeRef.current)
  }

  const ensureHost = () => {
    if (ytHostRef.current) return ytHostRef.current
    const wrap = ytWrapRef.current
    if (!wrap) return null
    const host = document.createElement('div')
    wrap.appendChild(host)
    ytHostRef.current = host
    return host
  }

  const ensureSpotifyEngine = async () => {
    if (spotifyPlayerRef.current && spotifyDeviceRef.current) return
    const p = loadProfile()
    if (!p) throw new Error('not connected')
    const Spotify = await ensureSpotifySDK()
    if (spotifyPlayerRef.current) return
    const player = new Spotify.Player({
      name: 'Ellie App 💗',
      getOAuthToken: (cb: (t: string) => void) => {
        const q = loadProfile()
        if (!q) {
          cb('')
          return
        }
        ensureToken(q)
          .then((n) => cb(n.accessToken))
          .catch(() => cb(''))
      },
      volume: volumeRef.current,
    })
    spotifyPlayerRef.current = player
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      spotifyDeviceRef.current = device_id
    })
    await player.connect()
    for (let i = 0; i < 50 && !spotifyDeviceRef.current; i++) {
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  const playSpotifyQueue = async (uris: string[], at: number) => {
    await ensureSpotifyEngine()
    const dev = spotifyDeviceRef.current
    if (!dev) throw new Error('no device')
    await spotifyREST(
      'PUT',
      `/me/player/play?device_id=${encodeURIComponent(dev)}`,
      { uris, offset: { position: at } },
    )
    setPlaying(true)
  }

  const connectSpotify = async (
    clientId: string,
  ): Promise<{ ok: boolean; message: string }> => {
    setSpotify((s) => ({ ...s, busy: true }))
    try {
      const res = await startSpotifyAuth(clientId.trim())
      if (!res.ok) {
        setSpotify((s) => ({ ...s, busy: false }))
        return res
      }
      const p = loadProfile()
      if (!p) throw new Error('no profile')
      const me = await spotifyMe(p)
      setSpotify({
        connected: true,
        account: me.display_name || 'Spotify',
        premium: me.product === 'premium',
        busy: false,
      })
      return res
    } catch (e) {
      setSpotify((s) => ({ ...s, busy: false }))
      return { ok: false, message: String(e) }
    }
  }

  const disconnectSpotify = () => {
    clearProfile()
    if (song?.kind === 'spotify') {
      pauseEngines()
      setPlaying(false)
    }
    spotifyPlayerRef.current = null
    spotifyDeviceRef.current = ''
    setSpotify({ connected: false, account: '', premium: false, busy: false })
  }

  // Restore a saved Spotify login on launch.
  useEffect(() => {
    const p = loadProfile()
    if (!p) {
      setSpotify((s) => ({ ...s, busy: false }))
      return
    }
    spotifyMe(p)
      .then((me) =>
        setSpotify((s) => ({
          ...s,
          connected: true,
          account: me.display_name || 'Spotify',
          premium: me.product === 'premium',
          busy: false,
        })),
      )
      .catch(() => setSpotify((s) => ({ ...s, busy: false })))
  }, [])

  const resetShuffle = () => {
    bagRef.current = []
    playedRef.current = []
  }

  const playAt = (q: Song[], i: number) => {
    const target = q[i]
    if (!target) return
    setQueue(q)
    setIndex(i)
    setTime(0)
    setDuration(0)
    setSong(target)
  }

  const replay = () => {
    if (!song) return
    if (song.kind === 'file') {
      const a = audioRef.current
      if (a) {
        a.currentTime = 0
        void a.play()
      }
      setTime(0)
      setPlaying(true)
    } else if (song.kind === 'youtube') {
      const y = ytRef.current
      if (y && y.seekTo) {
        y.seekTo(0, true)
        y.playVideo()
      }
      setTime(0)
      setPlaying(true)
    } else if (song.kind === 'spotify' && spotifyOn) {
      void spotifyREST('PUT', '/me/player/seek?position_ms=0')
      setTime(0)
      setPlaying(true)
    }
  }

  const next = () => {
    if (shuffle && queue.length > 1) {
      if (!bagRef.current.length)
        bagRef.current = shuffledOther(queue.length, index)
      const ni = bagRef.current.pop()
      if (ni !== undefined && ni !== index) {
        playedRef.current.push(index)
        playAt(queue, ni)
        return
      }
    }
    if (index < queue.length - 1) playAt(queue, index + 1)
    else if (repeat === 'all' && queue.length) playAt(queue, 0)
    else {
      pauseEngines()
      setPlaying(false)
    }
  }

  const endGuardRef = useRef(0)
  const handleEnded = () => {
    const now = Date.now()
    if (now - endGuardRef.current < 700) return
    endGuardRef.current = now
    if (repeat === 'one') {
      replay()
      return
    }
    next()
  }

  const prev = () => {
    if (time > 4) {
      replay()
      return
    }
    if (shuffle && playedRef.current.length) {
      const pi = playedRef.current.pop() as number
      bagRef.current.push(index)
      if (queue[pi]) {
        playAt(queue, pi)
        return
      }
    }
    if (index > 0) playAt(queue, index - 1)
  }

  const toggle = () => {
    if (!song) return
    if (song.kind === 'spotify') {
      if (!spotifyOn) return
      const dev = spotifyDeviceRef.current
      if (!dev) return
      if (playing) {
        void spotifyREST('PUT', '/me/player/pause')
        setPlaying(false)
      } else {
        void spotifyREST(
          'PUT',
          `/me/player/play?device_id=${encodeURIComponent(dev)}`,
        )
        setPlaying(true)
      }
      return
    }
    if (song.kind === 'file') {
      const a = audioRef.current
      if (!a) return
      if (a.paused) {
        void a.play()
        setPlaying(true)
      } else {
        a.pause()
        setPlaying(false)
      }
    } else if (song.kind === 'youtube') {
      const y = ytRef.current
      if (!y) return
      if (playing) {
        y.pauseVideo()
        setPlaying(false)
      } else {
        y.playVideo()
        setPlaying(true)
      }
    }
  }

  const stop = () => {
    pauseEngines()
    if (song?.kind === 'spotify' && spotifyOn) {
      void spotifyREST('PUT', '/me/player/pause')
    }
    setSong(null)
    setPlaying(false)
    setTime(0)
    setDuration(0)
  }

  const seek = (t: number) => {
    if (!song) return
    if (song.kind === 'file') {
      const a = audioRef.current
      if (a) a.currentTime = t
    } else if (song.kind === 'youtube') {
      const y = ytRef.current
      if (y && y.seekTo) y.seekTo(t, true)
    } else if (song.kind === 'spotify' && spotifyOn) {
      void spotifyREST('PUT', `/me/player/seek?position_ms=${Math.round(t * 1000)}`)
    }
    setTime(t)
  }

  const setVolume = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    volumeRef.current = clamped
    setVolumeState(clamped)
    localStorage.setItem(VOLUME_KEY, String(clamped))
    applyVolume()
  }

  const setRepeat = (m: RepeatMode) => {
    setRepeatState(m)
    localStorage.setItem(REPEAT_KEY, m)
  }

  const cycleRepeat = () =>
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')

  const toggleShuffle = () => {
    const on = !shuffle
    setShuffleState(on)
    localStorage.setItem(SHUFFLE_KEY, on ? '1' : '0')
    resetShuffle()
  }

  // Keep the YT wrapper clean on mount/unmount.
  useEffect(() => {
    return () => {
      const y = ytRef.current
      if (y && y.destroy) {
        try {
          y.destroy()
        } catch {
          /* ignore */
        }
      }
      ytRef.current = null
      ytHostRef.current = null
      if (ytWrapRef.current) ytWrapRef.current.innerHTML = ''
    }
  }, [])

  // Keep the end-handler fresh for effects that intentionally stay keyed on [song].
  const endRef = useRef<() => void>(() => {})
  endRef.current = handleEnded
  const latestRef = useRef({ spotifyOn, queue, index })
  latestRef.current = { spotifyOn, queue, index }

  // Start the correct engine whenever the current song changes.
  useEffect(() => {
    if (!song) return
    pauseEngines()

    if (song.kind === 'file') {
      const a = audioRef.current
      if (!a) return
      const start = (src: string) => {
        a.src = src
        a.volume = volumeRef.current
        void a
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false))
      }
      if (song.src && !song.src.startsWith('blob:')) {
        start(song.src)
        return
      }
      let cancelled = false
      resolveAudioUrl(song.id, song.src)
        .then((url) => {
          if (cancelled) return
          if (url) start(url)
          else setPlaying(false)
        })
        .catch(() => setPlaying(false))
      return () => {
        cancelled = true
      }
    }

    if (song.kind === 'youtube') {
      let cancelled = false
      const id = youtubeId(song.url || '')
      ensureYT()
        .then((YT: any) => {
          if (cancelled) return
          const startPlayer = (host: any) => {
            if (host) host.innerHTML = ''
            ytRef.current = new YT.Player(host, {
              videoId: id,
              width: '200',
              height: '115',
              playerVars: {
                autoplay: 1,
                controls: 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                disablekb: 1,
                origin: window.location.origin,
              },
              events: {
                onError: () => {
                  if (!cancelled) setPlaying(false)
                },
                onReady: () => {
                  const y = ytRef.current
                  if (y && y.setVolume) y.setVolume(volumeRef.current * 100)
                  if (y && y.playVideo) y.playVideo()
                  if (!cancelled) setPlaying(true)
                },
                onStateChange: (e: any) => {
                  if (e.data === 1) setPlaying(true)
                  if (e.data === 2) setPlaying(false)
                  if (e.data === 0) endRef.current()
                },
              },
            })
          }

          if (ytRef.current && ytRef.current.loadVideoById) {
            ytRef.current.loadVideoById(id)
            applyVolume()
            if (ytRef.current.playVideo) ytRef.current.playVideo()
            setPlaying(true)
            return
          }

          const host = ensureHost()
          if (host) startPlayer(host)
        })
        .catch(() => setPlaying(false))

      return () => {
        cancelled = true
      }
    }

    if (song.kind === 'spotify') {
      const { spotifyOn, queue, index } = latestRef.current
      if (!spotifyOn) {
        setPlaying(false)
        setTime(0)
        setDuration(0)
        return
      }
      let cancelled = false
      const uris = queue.map((s) => spotifyDeep(s.url || ''))
      playSpotifyQueue(uris, index).catch(() => {
        if (!cancelled) setPlaying(false)
      })
      return () => {
        cancelled = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song])

  // Poll playback position from the active engine. Only runs a timer while
  // something is actually playing, and only commits changed numbers, so an
  // idle/paused app (or the gaps between songs) does no re-rendering.
  useEffect(() => {
    const read = () => {
      if (!song) return
      if (song.kind === 'file') {
        const a = audioRef.current
        if (a) {
          const t = a.currentTime || 0
          const d = a.duration || 0
          setTime((prev) => (Math.abs(prev - t) < 0.2 ? prev : t))
          setDuration((prev) => (prev === d ? prev : d))
        }
      } else if (song.kind === 'youtube') {
        const y = ytRef.current
        if (y && y.getCurrentTime) {
          const t = y.getCurrentTime() || 0
          const d = y.getDuration() || 0
          setTime((prev) => (Math.abs(prev - t) < 0.2 ? prev : t))
          setDuration((prev) => (prev === d ? prev : d))
        }
      } else if (song.kind === 'spotify' && latestRef.current.spotifyOn) {
        const y = spotifyPlayerRef.current
        if (y && y.getCurrentState) {
          y.getCurrentState()
            .then((s: any) => {
              if (!s) return
              const pos = (s.position || 0) / 1000
              const dur = (s.duration || 0) / 1000
              setTime((prev) => (Math.abs(prev - pos) < 0.2 ? prev : pos))
              if (dur > 0) setDuration((prev) => (prev === dur ? prev : dur))
              const paused = s.paused !== false
              setPlaying((prev) => (prev === !paused ? prev : !paused))
            })
            .catch(() => {})
        }
      }
    }
    read()
    if (!playing) return
    const iv = window.setInterval(read, 250)
    return () => window.clearInterval(iv)
  }, [song, playing])

  const value: PlayerValue = {
    song,
    playing,
    time,
    duration,
    volume,
    queue,
    index,
    isExternal,
    spotify,
    connectSpotify,
    disconnectSpotify,
    playQueue: (q, i) => {
      resetShuffle()
      playAt(q, i)
    },
    playSong: (s) => {
      resetShuffle()
      playAt([s], 0)
    },
    toggle,
    next,
    prev,
    replay,
    seek,
    setVolume,
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    stop,
  }

  return (
    <PlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="auto"
      />
      <div
        ref={ytWrapRef}
        aria-hidden
        style={{
          position: 'fixed',
          left: -9999,
          width: 200,
          height: 115,
          opacity: 0.01,
          pointerEvents: 'none',
        }}
      />
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}