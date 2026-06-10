import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { Users, ChevronRight, Dice, Sparkles } from '../components/Icons.jsx'

export default function PlayerLogin() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { joinAsPlayer, configured } = useAuth()
  const nav = useNavigate()

  const join = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a character or player name.'); return }
    setError('')
    setBusy(true)
    try {
      await joinAsPlayer({ name: name.trim(), code: code.trim() || 'DEMO' })
      nav('/play')
    } catch (err) {
      setError(err?.message || 'Could not join the game.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-5 py-12 text-white">
      <div className="aether-aura pointer-events-none absolute inset-0" />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card-grad-border glass rounded-2xl p-7">
          <span className="chip mb-4 border-aether-300/30 text-aether-100">
            <Users size={13} /> Player join
          </span>
          <h1 className="font-display text-2xl">Join your party’s table</h1>
          <p className="mt-2 text-sm text-white/55">
            Your DM shares a game code. Enter it with your name to see maps and handouts on your screen.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
          )}

          <form onSubmit={join} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/55">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kaelen Frostward"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-aether-300/50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/55">Game code <span className="text-white/30">(optional in demo)</span></span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUNKEN-CROWN"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-4 py-2.5 font-mono text-sm tracking-wide text-white placeholder:text-white/30 outline-none transition focus:border-aether-300/50"
              />
            </label>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
              <Dice size={16} /> {busy ? 'Joining…' : 'Join game'} <ChevronRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/50">
            Are you the DM?{' '}
            <Link to="/login" className="font-semibold text-amethyst-200 hover:underline">Sign in here</Link>
          </p>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/35">
          <Sparkles size={12} /> {configured ? 'Players join via Supabase anonymous sessions.' : 'Demo mode — no account needed.'}
        </p>
        <p className="mt-2 text-center text-xs text-white/30">
          <Link to="/" className="hover:text-white/60">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
