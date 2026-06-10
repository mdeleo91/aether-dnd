import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { Brain, Lock, Sparkles, ChevronRight, Check } from '../components/Icons.jsx'

export default function Login() {
  const [mode, setMode] = useState('signup') // 'signup' | 'login'
  const nav = useNavigate()
  const submit = (e) => {
    e.preventDefault()
    nav('/app')
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden border-r border-white/5 bg-ink-800 lg:block">
        <div className="aether-aura pointer-events-none absolute inset-0" />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <h2 className="font-display text-4xl leading-tight">
              A co-DM that <span className="gradient-text">never forgets a thread.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/60">
              Sign in to pick up your D&amp;D campaign exactly where you left it — canvas, memory, and all.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {['12 sessions of campaign memory, synced', 'Unlimited 5e NPCs, lore & CR-balanced encounters', 'Your campaigns on every device'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-white/75">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amethyst-400/20 text-amethyst-200"><Check size={12} /></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass flex items-start gap-3 rounded-xl p-4">
            <Brain size={18} className="mt-0.5 text-amethyst-300" />
            <p className="text-sm text-white/65">
              “I open AETHER, and last week’s betrayal is already on the board. It remembers so I don’t have to.”
              <span className="mt-1 block text-xs text-white/40">— Dana R., Forever DM</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex items-center justify-center bg-ink-900 px-5 py-12">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-20 lg:hidden" />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <span className="chip mb-4 border-amethyst-400/30 text-amethyst-200">
            <Lock size={13} /> {mode === 'signup' ? 'Create your account' : 'Welcome back, DM'}
          </span>
          <h1 className="font-display text-3xl">
            {mode === 'signup' ? 'Take your seat at the table' : 'Sign in to AETHER'}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {mode === 'signup'
              ? 'Start your 14-day Archmage trial — no card required.'
              : 'Enter the realm and resume your campaign.'}
          </p>

          <div className="mt-7 space-y-3">
            <button onClick={submit} className="btn-ghost w-full justify-center">
              <GoogleGlyph /> Continue with Google
            </button>
            <button onClick={submit} className="btn-ghost w-full justify-center">
              <DiscordGlyph /> Continue with Discord
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-white/35">
            <span className="h-px flex-1 bg-white/10" /> or {mode === 'signup' ? 'sign up' : 'sign in'} with email <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Dungeon Master name" placeholder="Dungeon Master Dana" />
            )}
            <Field label="Email" type="email" placeholder="you@table.com" />
            <Field label="Password" type="password" placeholder="••••••••" />
            <button type="submit" className="btn-primary w-full justify-center py-3">
              {mode === 'signup' ? 'Create account & enter' : 'Sign in'} <ChevronRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            {mode === 'signup' ? 'Already have an account?' : 'New to AETHER?'}{' '}
            <button
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-amethyst-200 hover:underline"
            >
              {mode === 'signup' ? 'Sign in' : 'Create one free'}
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/35">
            <Sparkles size={12} /> Demo only — any button takes you into the live app mockup.
          </p>
          <p className="mt-2 text-center text-xs text-white/30">
            <Link to="/" className="hover:text-white/60">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-ink-700 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amethyst-400/50 focus:shadow-glow-violet"
      />
    </label>
  )
}

const GoogleGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1a6 6 0 0 1-5.6-4.1l-3.3 2.6A10 10 0 0 0 12 22z"/><path fill="#4A90D9" d="M6.4 14a6 6 0 0 1 0-3.9L3.1 7.5a10 10 0 0 0 0 9z"/><path fill="#FBBC05" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6A6 6 0 0 1 12 6.1z"/></svg>
)
const DiscordGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#8a5cf0"><path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4a14 14 0 0 1 3.4 1.7 14.5 14.5 0 0 0-12.4 0A14 14 0 0 1 9.6 4.4L9.4 4a16 16 0 0 0-4 1.3C2.3 9.9 1.6 14.4 2 18.8A16 16 0 0 0 6.9 21l.6-1a10 10 0 0 1-1.7-.8l.4-.3a11 11 0 0 0 9.4 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.9-2.2c.5-5.2-.7-9.6-2.5-13.5zM9.3 15.9c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.8.9 1.7 1.9c0 1-.8 1.9-1.7 1.9zm5.4 0c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.8.9 1.7 1.9c0 1-.7 1.9-1.7 1.9z"/></svg>
)
