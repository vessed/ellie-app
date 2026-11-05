export function youtubeId(url: string) {
  const m =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/embed\/([^?]+)/)
  return m ? m[1] : ''
}

export function spotifyEmbed(url: string) {
  const m = url.match(
    /open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/(\w+)/,
  )
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`
  return null
}

export function spotifyDeep(url: string) {
  const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/(\w+)/)
  if (m) return `spotify:${m[1]}:${m[2]}`
  return url
}

export async function openExternal(url: string, openWith?: string) {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url, openWith)
    return true
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
    return false
  }
}

export function looksSpotify(url: string) {
  return /spotify\.link|open\.spotify\.com/i.test(url)
}

export function looksYoutube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url)
}

export function youtubeEmbed(url: string) {
  const list = url.match(/[?&]list=([^&]+)/)
  if (list) return `https://www.youtube.com/embed/videoseries?list=${list[1]}&rel=0`
  const id = youtubeId(url)
  if (id) return `https://www.youtube.com/embed/${id}?rel=0`
  return null
}

export function prettyDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function prettyToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function prettyFull(iso: string) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysTogether(anniversary: string) {
  if (!anniversary) return -1
  const start = new Date(anniversary + 'T00:00:00')
  if (isNaN(start.getTime())) return -1
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000))
}

export function relativeTime(ts: number, now = Date.now()) {
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

export function stickerCode(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
}

export function readImageData(
  file: File,
  max = 512,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const cx = canvas.getContext('2d')
        if (!cx) throw new Error('no canvas')
        cx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}