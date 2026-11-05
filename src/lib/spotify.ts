import { invoke } from '@tauri-apps/api/core'
import { openExternal } from './media'

export const SPOTIFY_REDIRECT = 'http://127.0.0.1:49112/callback'

const SCOPES =
  'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state'
const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

export interface SpotProfile {
  clientId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const KEY = 'ellie-spotify'

function toBase64Url(buf: ArrayBuffer) {
  const b = new Uint8Array(buf)
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function rnd(n: number) {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return toBase64Url(a.buffer)
}

async function sha256b64(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return toBase64Url(d)
}

export function loadProfile(): SpotProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SpotProfile) : null
  } catch {
    return null
  }
}

export function saveProfile(p: SpotProfile) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function clearProfile() {
  localStorage.removeItem(KEY)
}

export async function ensureToken(
  p: SpotProfile,
): Promise<SpotProfile> {
  if (Date.now() < p.expiresAt - 60_000) return p
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: p.refreshToken,
    client_id: p.clientId,
  })
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error('Spotify refresh failed')
  const j = (await r.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
  const np: SpotProfile = {
    ...p,
    accessToken: j.access_token,
    expiresAt: Date.now() + (j.expires_in || 3600) * 1000,
  }
  if (j.refresh_token) np.refreshToken = j.refresh_token
  saveProfile(np)
  return np
}

export async function startSpotifyAuth(
  clientId: string,
): Promise<{ ok: boolean; message: string }> {
  const verifier = rnd(64)
  const challenge = await sha256b64(verifier)
  const csrf = rnd(16)
  try {
    await invoke('spotify_start_auth', { csrfState: csrf })
  } catch (e) {
    return { ok: false, message: String(e) }
  }
  const url =
    `${AUTH_URL}?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT)}` +
    `&code_challenge_method=S256&code_challenge=${challenge}` +
    `&state=${csrf}&scope=${encodeURIComponent(SCOPES)}`
  await openExternal(url)

  const deadline = Date.now() + 150_000
  let code: string | null = null
  while (Date.now() < deadline && !code) {
    await new Promise((r) => setTimeout(r, 900))
    try {
      const v = await invoke<string | null>('spotify_fetch_auth_code')
      if (v) code = v
    } catch {
      /* ignore poll errors */
    }
  }
  if (!code) return { ok: false, message: 'Timed out waiting for Spotify login.' }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT,
    client_id: clientId,
    code_verifier: verifier,
  })
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) return { ok: false, message: 'Login failed — check the Client ID and retry.' }
  const j = (await r.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  saveProfile({
    clientId,
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: Date.now() + (j.expires_in || 3600) * 1000,
  })
  return { ok: true, message: 'Connected to Spotify 💗' }
}

export async function spotifyMe(
  p: SpotProfile,
): Promise<{ display_name: string; product: string }> {
  const t = await ensureToken(p)
  const r = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${t.accessToken}` },
  })
  if (!r.ok) throw new Error('Could not reach your Spotify account')
  return (await r.json()) as { display_name: string; product: string }
}

let sdkPromise: Promise<any> | null = null
export function ensureSpotifySDK(): Promise<any> {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const w = window as any
    if (w.Spotify) {
      resolve(w.Spotify)
      return
    }
    const s = document.createElement('script')
    s.src = 'https://sdk.scdn.co/play.js'
    s.onload = () =>
      w.Spotify ? resolve(w.Spotify) : reject(new Error('Spotify SDK unavailable'))
    s.onerror = () => reject(new Error('Could not load the Spotify player'))
    document.head.appendChild(s)
  })
  return sdkPromise
}

export async function spotifyREST(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
) {
  const p = loadProfile()
  if (!p) throw new Error('Not connected to Spotify')
  const t = await ensureToken(p)
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${t.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok && r.status !== 204) throw new Error(`Spotify error ${r.status}`)
  return r
}