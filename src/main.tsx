import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Register the service worker so the web/PWA build installs to a phone home
   screen and works offline. Skipped inside the Tauri desktop shell. */
const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
if (import.meta.env.PROD && 'serviceWorker' in navigator && !inTauri) {
  /* Vite fires this when a lazy-loaded chunk can't be fetched — which almost
     always means the app is running an old bundle after a new deploy replaced
     the hashed files. A refresh pulls the current bundle. */
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing
          if (!sw) return
          sw.addEventListener('statechange', () => {
            /* A new worker has installed while one is already controlling the
               page: take the update now so we never mix old + new chunks. */
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload()
            }
          })
        })
      })
      .catch(() => {})
  })
}

