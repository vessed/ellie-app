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
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {})
  })
}

