import { useState } from 'react'
import { combatants as seed } from '../../data/mock.js'
import { Heart, Shield, Skull, ChevronRight, Plus } from '../Icons.jsx'

export default function InitiativeTracker({ compact = false }) {
  const [list] = useState(seed)
  const [round, setRound] = useState(3)
  const [turn, setTurn] = useState(0)
  const order = [...list].sort((a, b) => b.init - a.init)

  const next = () => {
    setTurn((t) => {
      const n = t + 1
      if (n >= order.length) {
        setRound((r) => r + 1)
        return 0
      }
      return n
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-aether-300">Round</span>
          <span className="font-display text-lg leading-none">{round}</span>
        </div>
        <button
          onClick={next}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 px-2.5 py-1 text-xs font-semibold text-ink-900 transition hover:brightness-110 active:scale-95"
        >
          Next turn <ChevronRight size={13} />
        </button>
      </div>

      <div className={`mt-2 flex-1 space-y-1.5 overflow-auto pr-1 ${compact ? 'max-h-44' : ''}`}>
        {order.map((c, i) => {
          const active = i === turn
          const down = c.hp <= 0
          const pct = Math.max(0, Math.round((c.hp / c.maxHp) * 100))
          return (
            <div
              key={c.id}
              className={`relative rounded-lg border px-2.5 py-2 transition ${
                active
                  ? 'border-amethyst-400/50 bg-amethyst-400/15 shadow-glow-violet'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
              } ${down ? 'opacity-45' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${
                    c.kind === 'pc' ? 'bg-aether-500/30 text-aether-100' : 'bg-rune-400/25 text-rune-100'
                  }`}
                >
                  {c.init}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`truncate text-sm font-medium ${down ? 'line-through' : ''}`}>{c.name}</span>
                    {down && <Skull size={13} className="text-white/40" />}
                  </div>
                  {c.sub && <p className="truncate text-[10px] text-white/40">{c.sub}</p>}
                  <div className="mt-1 flex items-center gap-1.5">
                    <Heart size={11} className={pct > 50 ? 'text-emerald-400' : pct > 25 ? 'text-rune-300' : 'text-red-400'} />
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-rune-300' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono text-[10px] text-white/45">{c.hp}/{c.maxHp}</span>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-white/45"><Shield size={10} />{c.ac}</span>
                  </div>
                </div>
              </div>
              {c.status.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 pl-8">
                  {c.status.map((s) => (
                    <span key={s} className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/55">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-white/10 py-1.5 text-xs text-white/45 transition hover:border-white/25 hover:text-white/70">
        <Plus size={13} /> Add combatant
      </button>
    </div>
  )
}
