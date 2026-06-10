import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { Globe, LogOut, Map, Scroll, Heart } from '../components/Icons.jsx'

// Player-facing display. Mirrors what the DM pushes from the in-app "Player
// display" toggle: the active battle map and any shared handouts. Read-only.
export default function PlayerView() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const name = user?.user_metadata?.name || 'Adventurer'
  const code = user?.user_metadata?.code || 'SUNKEN-CROWN'

  const leave = async () => {
    await signOut()
    nav('/join')
  }

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
            <span className="h-2 w-2 animate-pulseGlow rounded-full bg-emerald-400" /> Connected as <span className="font-semibold text-white/80">{name}</span>
          </span>
          <button onClick={leave} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/65 transition hover:text-white">
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Shared map */}
        <main className="relative flex min-w-0 flex-1 items-center justify-center bg-ink-900 p-6">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative w-full max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aether-300">
              <Globe size={14} /> Now showing · pushed by your DM
            </div>
            <div className="card-grad-border relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-aether-600/30 via-ink-600 to-ink-700 shadow-panel">
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border border-white/5" />
                ))}
              </div>
              <Token x="24%" y="42%" color="bg-aether-300" label="K" />
              <Token x="34%" y="60%" color="bg-aether-300" label="M" />
              <Token x="62%" y="46%" color="bg-rune-300" label="A" />
              <Token x="70%" y="64%" color="bg-red-400" label="?" />
              <div className="absolute left-3 top-3 rounded bg-ink-900/70 px-2 py-1 text-[11px] text-white/70">Hollowmere Vault · 5 ft squares</div>
            </div>
            <p className="mt-3 text-center text-xs text-white/40">
              The DM controls what you see here. Fog, tokens, and maps update live.
            </p>
          </div>
        </main>

        {/* Side: identity + handout */}
        <aside className="w-full shrink-0 border-t border-white/5 bg-ink-800/60 p-5 lg:w-80 lg:border-l lg:border-t-0">
          <div className="glass flex items-center gap-3 rounded-xl p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aether-500/40 font-display text-lg">{name[0]?.toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-white/45">Player</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rune-300">
              <Scroll size={13} /> Latest handout
            </p>
            <div className="mt-2 rounded-xl border border-rune-300/20 bg-ink-700/70 p-3 text-sm text-white/75">
              <p className="font-display text-base text-white">A note, water-stained</p>
              <p className="mt-1 italic text-white/60">
                “The bells beneath Hollowmere still ring. Do not answer the second verse.”
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-aether-300">
              <Heart size={13} /> Your status
            </p>
            <div className="mt-2 space-y-2">
              {[['HP', '41 / 44'], ['AC', '18'], ['Conditions', 'Blessed']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="text-white/55">{k}</span>
                  <span className="font-mono text-white/85">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/35">Waiting on the DM… sit tight, adventurer.</p>
        </aside>
      </div>
    </div>
  )
}

function Token({ x, y, color, label }) {
  return (
    <span
      className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${color} text-xs font-bold text-ink-900 ring-2 ring-ink-900/40`}
      style={{ left: x, top: y }}
    >
      {label}
    </span>
  )
}
