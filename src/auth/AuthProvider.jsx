import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const DEMO_KEY = 'aether:auth'

function roleOf(user) {
  return user?.user_metadata?.role ?? (user ? 'dm' : null)
}

// Demo sessions persist locally so a refresh keeps you logged in (real
// Supabase sessions persist via Supabase itself).
function readDemo() {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : readDemo()))
  const [role, setRole] = useState(() => (isSupabaseConfigured ? null : roleOf(readDemo())))
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    // Supabase is configured, so we never use the local demo session. Clear any
    // stale one left over from a previous demo/unconfigured build so it can't
    // cause confusion.
    try { localStorage.removeItem(DEMO_KEY) } catch { /* ignore */ }
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setRole(roleOf(data.session?.user))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRole(roleOf(session?.user))
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const setDemo = (u) => {
    setUser(u)
    setRole(roleOf(u))
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(u))
    } catch {
      /* ignore */
    }
  }
  const demoUser = (email, r, extra = {}) => ({
    id: `demo-${r}`,
    email: email || null,
    user_metadata: { role: r, demo: true, ...extra },
  })

  async function signUp({ email, password, name }) {
    if (!isSupabaseConfigured) {
      setDemo(demoUser(email, 'dm', { name }))
      return { demo: true }
    }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'dm', name }, emailRedirectTo: `${window.location.origin}/app` },
    })
  }

  async function signIn({ email, password }) {
    if (!isSupabaseConfigured) {
      setDemo(demoUser(email, 'dm'))
      return { demo: true }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    // Google sign-in is REAL OAuth only — it must never silently drop the user
    // into a local demo session (that looks broken: "I clicked Google and ended
    // up in a demo"). If Supabase isn't configured, surface a clear error.
    if (!isSupabaseConfigured) {
      return { error: { message: 'Google sign-in isn’t available in demo mode — Supabase isn’t configured for this deployment.' } }
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    })
  }

  async function joinAsPlayer({ name, code }) {
    if (isSupabaseConfigured && typeof supabase.auth.signInAnonymously === 'function') {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { role: 'player', name, code } },
      })
      if (!error) {
        setRole('player')
        return { ok: true }
      }
    }
    setDemo(demoUser(null, 'player', { name, code }))
    return { demo: true }
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    try {
      localStorage.removeItem(DEMO_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
    setRole(null)
  }

  const value = {
    user,
    role,
    loading,
    configured: isSupabaseConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    joinAsPlayer,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
