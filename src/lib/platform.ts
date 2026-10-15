/* Tells the app whether it's running inside the Tauri desktop shell or a plain
   browser (the installable PWA). Desktop-only features are gated on this. */
export const isTauri =
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)

export const isWeb = !isTauri
