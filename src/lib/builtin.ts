import type { Playlist, Song } from './types'

export const BUILTIN_PLAYLIST_ID = 'builtin-cozy-cuddles'

export const BUILTIN_SONGS: Song[] = [
  {
    id: 'builtin-1',
    title: 'Teddy Bear Waltz',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/teddy-bear-waltz.mp3',
  },
  {
    id: 'builtin-2',
    title: 'Carefree',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/carefree.mp3',
  },
  {
    id: 'builtin-3',
    title: 'Frost Waltz',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/frost-waltz.mp3',
  },
  {
    id: 'builtin-4',
    title: 'Pixelland',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/pixelland.mp3',
  },
  {
    id: 'builtin-5',
    title: 'Crinoline Dreams',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/crinoline-dreams.mp3',
  },
  {
    id: 'builtin-6',
    title: 'Fluffing a Duck',
    artist: 'Kevin MacLeod',
    kind: 'file',
    src: 'audio/fluffing-a-duck.mp3',
  },
]

export const BUILTIN_PLAYLIST: Playlist = {
  id: BUILTIN_PLAYLIST_ID,
  name: 'Cozy Cuddles',
  emoji: '🧸',
  songIds: BUILTIN_SONGS.map((s) => s.id),
}

export function ensureBuiltinMusic(
  songs: Song[],
  playlists: Playlist[],
  setSongs: (s: Song[]) => void,
  setPlaylists: (p: Playlist[]) => void,
) {
  const known = new Set(songs.map((s) => s.id))
  const missing = BUILTIN_SONGS.filter((s) => !known.has(s.id))
  if (missing.length > 0) {
    const keep = songs.filter((s) => !BUILTIN_SONGS.some((b) => b.id === s.id))
    setSongs([...keep, ...BUILTIN_SONGS])
  }

  if (!playlists.some((p) => p.id === BUILTIN_PLAYLIST_ID)) {
    setPlaylists([BUILTIN_PLAYLIST, ...playlists])
  }
}