import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Roles: 'dm' (Dungeon Master) or 'player'. Stored in Supabase user_metadata
// when configured, or held locally in demo mode.
function roleOf(user) {
  return user?.user_metadata?.role ?? (user ? 'dm' : null)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
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

  const demoUser = (email, r, extra = {}) => ({
    id: `demo-${r}`,
    email: email || null,
    user_metadata: { role: r, demo: true, ...extra },
  })

  async function signUp({ email, password, name }) {
    if (!isSupabaseConfigured) {
      setUser(demoUser(email, 'dm', { name }))
      setRole('dm')
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
      setUser(demoUser(email, 'dm'))
      setRole('dm')
      return { demo: true }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      setUser(demoUser('google-user@demo.aether', 'dm'))
      setRole('dm')
      return { demo: true }
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    })
  }

  // Players join lightly. With Supabase we use anonymous sign-in (must be
  // enabled in the project); otherwise we fall back to a local demo session.
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
    setUser(demoUser(null, 'player', { name, code }))
    setRole('player')
    return { demo: true }
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
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
