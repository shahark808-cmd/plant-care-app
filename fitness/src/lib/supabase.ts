import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** null when the app runs without a backend (everything still works offline/locally). */
export const supabase = url && key ? createClient(url, key) : null
export const stravaClientId = import.meta.env.VITE_STRAVA_CLIENT_ID || ''
