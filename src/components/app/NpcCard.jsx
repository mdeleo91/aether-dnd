import { useState } from 'react'
import { aiGenerate } from '../../lib/ai.js'
import { Sparkles, Skull } from '../Icons.jsx'

const ABILS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export default function NpcCard({ card, onData }) {
  const npc = card.data?.npc || null
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState('') // '' | 'demo' | error message

  const generate = async () => {
    setBusy(true); setState('')
    const res = await aiGenerate('npc', { role: 'any' })
    setBusy(false)
    if (res.demo) { setState('demo'); return }
    if (res.error) { setState('Generation failed: ' + res.error); return }
    onData(card.id, { npc: res.data })
  }

  const edit = (patch) => onData(card.id, { npc: { ...npc, ...patch } })

  if (!npc) {
    return (
      <Empty busy={busy} state={state} onGenerate={generate} label="NPC / monster" icon={Skull} />
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <input
          value={npc.name || ''}
          onChange={(e) => edit({ name: e.target.value })}
          className="min-w-0 flex-1 rounded bg-transparent font-display text-base text-white outline-none focus:bg-white/5"
        />
        <button onClick={generate} disabled={busy} title="Regenerate with AI" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amethyst-400/40 px-2 py-0.5 text-[10px] text-amethyst-100 transition hover:bg-amethyst-400/10 disabled:opacity-50">
          {busy ? <><Spinner size={9} /> …</> : '↻ AI'}
        </button>
      </div>
      <input
        value={npc.type || ''}
        onChange={(e) => edit({ type: e.target.value })}
        className="mt-0.5 w-full rounded bg-transparent text-[11px] text-white/45 outline-none focus:bg-white/5"
      />
      {state && state !== 'demo' && <GenError msg={state} />}

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        {[['AC', 'ac'], ['HP', 'hp'], ['CR', 'cr']].map(([lbl, k]) => (
          <label key={k} className="rounded-md bg-white/5 py-1">
            <span className="block text-[9px] uppercase text-white/40">{lbl}</span>
            <input
              value={npc[k] ?? ''}
              onChange={(e) => edit({ [k]: e.target.value })}
              className="w-full bg-transparent text-center font-mono text-sm text-white/85 outline-none"
            />
          </label>
        ))}
      </div>

      {npc.abilities && (
        <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[9px]">
          {ABILS.map((a) => (
            <div key={a} className="rounded bg-white/5 py-0.5">
              <p className="text-white/40">{a}</p>
              <p className="font-mono text-white/80">{npc.abilities[a] ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {npc.speed && <p className="mt-2 text-[11px] text-white/55"><span className="text-white/40">Speed</span> {npc.speed}</p>}

      {Array.isArray(npc.traits) && npc.traits.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] text-white/65">
          {npc.traits.map((t, i) => <li key={i}>• {t}</li>)}
        </ul>
      )}

      {(npc.personality || npc.appearance) && (
        <div className="mt-2 space-y-1 rounded-md bg-rune-400/10 p-2 text-[11px] italic text-rune-100">
          {npc.appearance && <p>{npc.appearance}</p>}
          {npc.personality && <p className="text-amethyst-100/90">{npc.personality}</p>}
        </div>
      )}
      <p className="mt-2 text-[9px] text-white/30">✦ AI-generated · editable · saved to this device</p>
    </div>
  )
}

export function Empty({ busy, state, onGenerate, label, icon: Icon }) {
  const isError = state && state !== 'demo'
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-2 py-6 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40">
        <Icon size={20} />
      </span>
      {state === 'demo' ? (
        <p className="text-xs leading-relaxed text-white/55">
          No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in your Vercel project to generate a {label}.
        </p>
      ) : isError ? (
        <GenError msg={state} />
      ) : busy ? (
        <p className="text-xs text-amethyst-100/80">Generating your {label}…</p>
      ) : (
        <p className="text-xs text-white/45">Generate a {label} with AI for your campaign.</p>
      )}
      <button
        onClick={onGenerate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 px-3.5 py-1.5 text-xs font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50"
      >
        {busy ? <Spinner size={14} /> : <Sparkles size={14} />} {busy ? 'Generating…' : isError ? `Try again` : `Generate ${label}`}
      </button>
    </div>
  )
}

// Shared inline error box for AI-generation failures (used across tool cards).
export function GenError({ msg }) {
  return (
    <div className="flex w-full items-start gap-1.5 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-left text-[11px] leading-snug text-red-200">
      <span className="shrink-0">⚠</span>
      <span className="min-w-0 break-words">{msg}</span>
    </div>
  )
}

// Small spinning loader using Tailwind core utilities.
export function Spinner({ size = 12 }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
      style={{ width: size, height: size }}
    />
  )
}
