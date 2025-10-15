
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_RESEND_API_KEY?: string
  readonly VITE_FROM_EMAIL?: string
  readonly VITE_FRONTEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
