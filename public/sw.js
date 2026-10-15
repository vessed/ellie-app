/* Ellie App service worker — makes the app installable and usable offline.

   Strategy:
   - Navigations: network-first, fall back to the cached app shell when offline.
   - Hashed/static assets (js, css, images, fonts, audio): cache-first, then
     refresh quietly in the background.
   - Everything else: straight to the network. */

const CACHE = 'ellie-app-v2'

/* Scope root (works at a domain root or under a subpath like /ellie-app/). */
const ROOT = new URL('./', self.location.href).href

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(ROOT))
      .catch(() => {}),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

/* Let the page tell a freshly-installed worker to take over right away. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

/* Real push: a heart/note/mood the other person sends arrives here even when
   the app is closed, and we pop it as an OS notification. */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    try {
      data = { body: event.data.text() }
    } catch {
      data = {}
    }
  }
  const icon = new URL('icons/icon-192.png', self.registration.scope).href
  const title = data.title || 'Ellie 💗'
  const options = {
    body: data.body || 'You have a new love note 💗',
    icon,
    badge: icon,
    tag: 'ellie',
    renotify: true,
    data: { url: new URL('./', self.registration.scope).href },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const url =
        (event.notification.data && event.notification.data.url) ||
        new URL('./', self.registration.scope).href
      const list = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const c of list) {
        if ('focus' in c) {
          try {
            await c.focus()
            return
          } catch {
            /* fall through to opening a new window */
          }
        }
      }
      if (clients.openWindow) await clients.openWindow(url)
    })(),
  )
})

const ASSET_RE = /\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp3|wav|ogg|m4a|flac|json|webmanifest)$/i

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  let url
  try {
    url = new URL(req.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(ROOT, copy)).catch(() => {})
          return res
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match(ROOT)) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        }
      })(),
    )
    return
  }

  const isAsset = url.pathname.includes('/assets/') || ASSET_RE.test(url.pathname)
  const isRange = req.headers.has('range')
  if (!isAsset || isRange) return

  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) {
        fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {})
            }
          })
          .catch(() => {})
        return cached
      }
      try {
        const res = await fetch(req)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        }
        return res
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Offline' })
      }
    })(),
  )
})
