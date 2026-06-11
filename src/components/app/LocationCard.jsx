import { useState } from 'react'
import { aiGenerate } from '../../lib/ai.js'
import { GenError, Spinner } from './NpcCard.jsx'
import { MapPin, Sparkles, Check } from '../Icons.jsx'

const BIOMES = ['any', 'dungeon', 'town', 'wilderness', 'coastal', 'underdark', 'ruin', 'planar']

export default function LocationCard({ card, onData, lib }) {
  const data = card.data || {}
  const loc = data.location || null
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (patch) => onData(card.id, patch)

  const generate = async () => {
    setBusy(true); setState(''); setSaved(false)
    const res = await aiGenerate('location', { kind: data.kind || 'any', note: data.note || '' })
    setBusy(false)
    if (res.demo) { setState('demo'); return }
    if (res.error) { setState('Generation failed: ' + res.error); return }
    set({ location: res.data })
  }

  const save = () => {
    if (!loc) return
    lib?.saveLocationToLibrary?.(loc)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const controls = (
    <div className="mb-2 flex items-center gap-1.5">
      <select value={data.kind || 'any'} onChange={(e) => set({ kind: e.target.value })} className="rounded-md border border-white/10 bg-ink-700 px-1.5 py-1 text-[11px] text-white/75 outline-none">
        {BIOMES.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <input value={data.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="hint (e.g. smuggler hideout)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50" />
      <button onClick={generate} disabled={busy} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2 py-1 text-[11px] font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50">
        {busy ? <><Spinner size={10} /> …</> : loc ? '↻' : 'Generate'}
      </button>
    </div>
  )

  if (!loc) {
    return (
      <div>
        {controls}
        <div className="flex flex-col items-center justify-center gap-2 px-2 py-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40"><MapPin size={20} /></span>
          {state === 'demo' ? (
            <p className="text-xs leading-relaxed text-white/55">No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in Vercel to generate locations.</p>
          ) : state ? (
            <GenError msg={state} />
          ) : busy ? (
            <p className="text-xs text-amethyst-100/80">Conjuring a location…</p>
          ) : (
            <p className="text-xs text-white/45">Generate an evocative D&D 5e location for your campaign.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {controls}
      {state && state !== 'demo' && <div className="mb-1.5"><GenError msg={state} /></div>}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base leading-tight text-white">{loc.name}</p>
          {loc.type && <p className="text-[11px] text-rune-200">{loc.type}</p>}
        </div>
        <button
          onClick={save}
          title="Save to this campaign's Locations library"
          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition ${saved ? 'border-emerald-400/40 text-emerald-300' : 'border-amethyst-400/40 text-amethyst-100 hover:bg-amethyst-400/10'}`}
        >
          {saved ? <><Check size={11} /> Saved</> : '★ Save'}
        </button>
      </div>

      {loc.description && <p className="mt-2 text-[12px] leading-relaxed text-white/75">{loc.description}</p>}

      {loc.read_aloud && (
        <div className="mt-2 rounded-md border-l-2 border-aether-300/60 bg-aether-300/5 px-2.5 py-1.5 text-[11px] italic leading-relaxed text-aether-50/90">
          {loc.read_aloud}
        </div>
      )}

      {Array.isArray(loc.features) && loc.features.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amethyst-300">Features</p>
          <ul className="mt-1 space-y-1 text-[11px] text-white/65">
            {loc.features.map((f, i) => <li key={i}>• {f}</li>)}
          </ul>
        </div>
      )}

      {Array.isArray(loc.hooks) && loc.hooks.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rune-300">Hooks</p>
          <ul className="mt-1 space-y-1 text-[11px] text-white/65">
            {loc.hooks.map((h, i) => <li key={i} className="flex gap-1.5"><Sparkles size={11} className="mt-0.5 shrink-0 text-rune-300" /> {h}</li>)}
          </ul>
        </div>
      )}

      <p className="mt-2 text-[9px] text-white/30">✦ AI-generated · ★ Save to add to your campaign library</p>
    </div>
  )
}
