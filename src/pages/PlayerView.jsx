import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { subscribePlayer } from '../lib/playerSync.js'
import { Globe, LogOut } from '../components/Icons.jsx'

// Player-facing display. Live-reflects whatever the DM pushes from the in-app
// "Push to player screen" button (same-device via BroadcastChannel/localStorage;
// cross-device when Supabase Realtime is configured).
export default function PlayerView() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const name = user?.user_metadata?.name || 'Adventurer'
  const code = user?.user_metadata?.code || 'SUNKEN-CROWN'
  const [view, setView] = useState(null)

  useEffect(() => subscribePlayer(setView), [])

  const leave = async () => {
    await signOut()
    nav('/join')
  }

  const live = view && view.on
  const tokens = view?.tokens || []

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-900 text-white">
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-ink-800/80 px-4 backdrop-blur">
        <Logo withWordmark={false} />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-white/90">The Sunken Crown</span>
          <span className="rounded-md bg-aether-300/15 px-1.5 py-0.5 font-mono text-[10px] text-aether-100">{code}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-white/55 sm:flex">
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulseGlow bg-emerald-400' : 'bg-white/30'}`} /> {live ? 'Live' : 'Standby'} · <span className="font-semibold text-white/80">{name}</span>
          </span>
          <button onClick={leave} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/65 transition hover:text-white"><LogOut size={14} /> Leave</button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center bg-ink-900 p-6">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
        {!live ? (
          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">
              <Globe size={24} />
            </div>
            <p className="font-display text-2xl text-white/80">Waiting for the DM…</p>
            <p className="mt-2 text-sm text-white/45">When your DM pushes a map or handout, it appears here live.</p>
          </div>
        ) : (
          <div className="relative w-full max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aether-300">
              <Globe size={14} /> Now showing{view.name ? ` · ${view.name}` : ''}
            </div>
            <div className="card-grad-border relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-aether-600/30 via-ink-600 to-ink-700 shadow-panel">
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
                {Array.from({ length: 96 }).map((_, i) => <div key={i} className="border border-white/5" />)}
              </div>
              {tokens.map((k) => (
                <span key={k.id} className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${k.color} text-xs font-bold text-ink-900 ring-2 ring-ink-900/40`} style={{ left: `${k.x}%`, top: `${k.y}%` }}>{k.label}</span>
              ))}
              {view.fog && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink-900/85 backdrop-blur-[2px]">
                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/70">The way ahead is shrouded…</span>
                </div>
              )}
              <div className="absolute left-3 top-3 z-30 rounded bg-ink-900/70 px-2 py-1 text-[11px] text-white/70">5 ft squares</div>
            </div>
            <p className="mt-3 text-center text-xs text-white/40">Updates live as your DM moves tokens, toggles fog, or pushes a new map.</p>
          </div>
        )}
      </main>
    </div>
  )
}
