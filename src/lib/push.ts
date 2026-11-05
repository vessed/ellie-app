import type { PushSub } from './types'

/* Public half of the VAPID keypair. The private half lives only as a Supabase
   Edge Function secret (see supabase/functions/send-push). */
export const VAPID_PUBLIC_KEY =
  'BHq8FRzKlAKDyF_OPE1ROxsk3BCkx8fC2a-WybRbQZlQOSAOQEUJLmJwpNED9iv-44rwe6y5BOOq89dQajSmFro'

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function toPushSub(sub: PushSubscription): PushSub | null {
  try {
    const json = sub.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null
    return {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }
  } catch {
    return null
  }
}

export async function getExistingPushSubscription(): Promise<PushSub | null> {
  if (!pushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return null
    const sub = await reg.pushManager.getSubscription()
    return sub ? toPushSub(sub) : null
  } catch {
    return null
  }
}

export async function ensurePushSubscription(): Promise<PushSub | null> {
  if (!pushSupported()) return null
  if (Notification.permission !== 'granted') return null
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.ready)
    if (!reg) return null
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    return toPushSub(sub)
  } catch {
    return null
  }
}
