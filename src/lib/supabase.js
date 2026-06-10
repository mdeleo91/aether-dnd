import { createClient } from '@supabase/supabase-js'

// Credentials come from environment variables — never hardcode secrets.
// Create a .env file (see .env.example) with:
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// When both are present we use real Supabase Auth. When they're missing the
// app still runs in a local "demo" auth mode so the mockup stays clickable.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
