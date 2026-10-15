/* Optional OS-level notifications for the in-app toasts (hearts, love notes,
   moods, reminders). These pop as real notifications when the app is open but
   not focused/in the foreground. True push (app fully closed) needs a server,
   which is a separate setup. Off until the user turns it on in Settings. */
const PREF_KEY = 'ellie-os-notify'

export function osNotifyPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

export function setOsNotifyPref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function notificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationSupport()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationSupport()) return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

function iconUrl() {
  const base =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.BASE_URL
      : './'
  return `${base}icons/icon-192.png`
}

export function osNotify(text: string, emoji = '💗') {
  if (!notificationSupport()) return
  if (!osNotifyPref()) return
  if (Notification.permission !== 'granted') return
  /* Only when the bubble isn't on screen — otherwise the in-app toast is enough. */
  if (typeof document !== 'undefined' && !document.hidden) return

  const opts: NotificationOptions = {
    body: text,
    icon: iconUrl(),
    badge: iconUrl(),
    tag: 'ellie',
  }

  const fallback = () => {
    try {
      new Notification(`Ellie ${emoji}`, { body: text })
    } catch {
      /* ignore */
    }
  }

  try {
    if (navigator.serviceWorker?.getRegistration) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (reg) void reg.showNotification(`Ellie ${emoji}`, opts)
          else fallback()
        })
        .catch(fallback)
      return
    }
  } catch {
    /* ignore */
  }
  fallback()
}
