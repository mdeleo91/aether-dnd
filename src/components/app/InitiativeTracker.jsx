import { useState } from 'react'
import { newId, rollInitiative } from '../../app/generators.js'
import { aiGenerate } from '../../lib/ai.js'
import { normalizeMember, initiativeValue, num } from '../../app/dnd5e.js'
import { Heart, Shield, Skull, ChevronRight, Plus, Sparkles, Users, X } from '../Icons.jsx'

const CONDITIONS = [
  'Blessed', 'Bloodied', 'Blinded', 'Charmed', 'Concentrating', 'Frightened',
  'Grappled', 'Invisible', 'Paralyzed', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious',
]

export default function InitiativeTracker({ card, onData, party = [] }) {
  const data = card.data || { combatants: [], round: 1, turn: 0 }
  const list = data.combatants || []
  const order = [...list].sort((a, b) => b.init - a.init)
  const turn = order.length ? Math.min(data.turn || 0, order.length - 1) : 0

  const [name, setName] = useState('')
  const [init, setInit] = useState('')
  const [hp, setHp] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (patch) => onData(card.id, patch)
  const setList = (fn) => set({ combatants: fn(list) })

  const next = () => {
    if (!order.length) return
    let n = turn + 1
    let round = data.round || 1
    if (n >= order.length) { n = 0; round += 1 }
    set({ turn: n, round })
  }

  const add = (e) => {
    e?.preventDefault?.()
    if (!name.trim()) return
    const v = Number(hp) || 1
    setList((l) => [
      ...l,
      { id: newId('cb'), name: name.trim(), sub: '', init: Number(init) || 10, hp: v, maxHp: v, ac: 10, kind: 'npc', conditions: [] },
    ])
    setName(''); setInit(''); setHp('')
  }

  const remove = (id) => setList((l) => l.filter((c) => c.id !== id))
  const setHpFor = (id, val) =>
    setList((l) => l.map((c) => (c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, val)) } : c)))
  const bump = (id, d) => setList((l) => l.map((c) => (c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + d)) } : c)))
  const toggleCond = (id, cond) =>
    setList((l) =>
      l.map((c) =>
        c.id === id
          ? { ...c, conditions: c.conditions.includes(cond) ? c.conditions.filter((x) => x !== cond) : [...c.conditions, cond] }
          : c,
      ),
    )

  const addParty = () => {
    setMsg('')
    if (!party.length) { setMsg('No party members yet — add them in the Party panel.'); return }
    const existing = new Set(list.map((c) => c.name))
    const added = party
      .map(normalizeMember)
      .filter((p) => !existing.has(p.name))
      .map((p) => ({
        id: newId('cb'),
        name: p.name,
        sub: p.classes || `Lv ${p.level || 1}`,
        init: rollInitiative(String(initiativeValue(p))),
        hp: num(p.hp || p.maxHp, 10),
        maxHp: num(p.maxHp || p.hp, 10),
        ac: num(p.ac, 10),
        kind: 'pc',
        conditions: [],
      }))
    if (added.length) setList((l) => [...l, ...added])
    setMsg(added.length ? `Added ${added.length} party member${added.length > 1 ? 's' : ''} (initiative rolled).` : 'Party is already in the tracker.')
  }

  const aiEncounter = async () => {
    setBusy(true); setMsg('')
    const res = await aiGenerate('encounter', { difficulty: 'medium', party: 'four level-5 PCs', prompt: data.encPrompt || '' })
    setBusy(false)
    if (res.demo) { setMsg('Set AI_API_KEY in Vercel to generate encounters.'); return }
    if (res.error) { setMsg(res.error); return }
    const monsters = res.data?.monsters || []
    const added = []
    monsters.forEach((m) => {
      const count = Math.max(1, Math.min(12, m.count || 1))
      for (let i = 0; i < count; i++) {
        added.push({
          id: newId('cb'),
          name: count > 1 ? `${m.name} ${i + 1}` : m.name,
          sub: `CR ${m.cr ?? '?'}`,
          init: rollInitiative(m.init || '+0'),
          hp: m.hp || 10, maxHp: m.hp || 10, ac: m.ac || 12, kind: 'npc', conditions: [],
        })
      }
    })
    if (added.length) setList((l) => [...l, ...added])
    setMsg(res.data?.title ? `Added: ${res.data.title}` : '')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-aether-300">Round</span>
          <span className="font-display text-lg leading-none">{data.round || 1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={addParty}
            title="Add your party members to the initiative order"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] font-medium text-white/65 transition hover:text-white"
          >
            <Users size={12} /> Party
          </button>
          <button
            onClick={aiEncounter}
            disabled={busy}
            title="Generate a 5e encounter with AI"
            className="inline-flex items-center gap-1 rounded-lg border border-amethyst-400/40 px-2 py-1 text-[11px] font-medium text-amethyst-100 transition hover:bg-amethyst-400/10 disabled:opacity-50"
          >
            <Sparkles size={12} /> {busy ? '…' : 'AI'}
          </button>
          <button
            onClick={next}
            disabled={!order.length}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 px-2.5 py-1 text-xs font-semibold text-ink-900 transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            Next turn <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <input
        value={data.encPrompt || ''}
        onChange={(e) => set({ encPrompt: e.target.value })}
        placeholder="Optional: guide the AI encounter (e.g. cultist ambush near a ruined shrine)"
        className="mt-2 w-full rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
      />

      {msg && <p className="px-1 pt-2 text-[11px] text-amethyst-200">{msg}</p>}

      <div className="mt-2 flex-1 space-y-1.5 overflow-auto pr-1">
        {order.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-white/40">
            No combatants yet. Add one below, or use <span className="text-amethyst-200">AI</span> to generate an encounter.
          </p>
        )}
        {order.map((c, i) => {
          const active = i === turn
          const down = c.hp <= 0
          const pct = Math.max(0, Math.round((c.hp / Math.max(1, c.maxHp)) * 100))
          return (
            <div
              key={c.id}
              className={`rounded-lg border px-2.5 py-2 transition ${
                active ? 'border-amethyst-400/50 bg-amethyst-400/15 shadow-glow-violet' : 'border-white/5 bg-white/[0.02]'
              } ${down ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${c.kind === 'pc' ? 'bg-aether-500/30 text-aether-100' : 'bg-rune-400/25 text-rune-100'}`}>{c.init}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`truncate text-sm font-medium ${down ? 'line-through' : ''}`}>{c.name}</span>
                    {down && <Skull size={12} className="text-white/40" />}
                    {c.sub && <span className="truncate text-[10px] text-white/40">{c.sub}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Heart size={11} className={pct > 50 ? 'text-emerald-400' : pct > 25 ? 'text-rune-300' : 'text-red-400'} />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-rune-300' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <button onClick={() => bump(c.id, -1)} className="h-5 w-5 rounded bg-white/5 text-xs text-white/60 hover:bg-white/10">−</button>
                    <input
                      type="number"
                      value={c.hp}
                      onChange={(e) => setHpFor(c.id, parseInt(e.target.value || '0', 10))}
                      className="w-11 rounded bg-white/5 px-1 py-0.5 text-center font-mono text-[11px] text-white/85 outline-none"
                    />
                    <button onClick={() => bump(c.id, 1)} className="h-5 w-5 rounded bg-white/5 text-xs text-white/60 hover:bg-white/10">+</button>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-white/45"><Shield size={10} />{c.ac}</span>
                    <button onClick={() => remove(c.id)} title="Remove" className="text-white/30 hover:text-red-300"><X size={12} /></button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {c.conditions.map((s) => (
                      <button key={s} onClick={() => toggleCond(c.id, s)} title="Remove condition" className="rounded-full bg-amethyst-400/20 px-1.5 py-0.5 text-[9px] font-medium text-amethyst-100 hover:bg-amethyst-400/30">{s} ×</button>
                    ))}
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) toggleCond(c.id, e.target.value) }}
                      className="rounded-full border border-white/10 bg-ink-700 px-1.5 py-0.5 text-[9px] text-white/55 outline-none"
                    >
                      <option value="">+ cond</option>
                      {CONDITIONS.filter((x) => !c.conditions.includes(x)).map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={add} className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50" />
        <input value={init} onChange={(e) => setInit(e.target.value)} placeholder="Init" className="w-12 rounded-md border border-white/10 bg-ink-700 px-1 py-1 text-center text-xs text-white placeholder:text-white/30 outline-none" />
        <input value={hp} onChange={(e) => setHp(e.target.value)} placeholder="HP" className="w-12 rounded-md border border-white/10 bg-ink-700 px-1 py-1 text-center text-xs text-white placeholder:text-white/30 outline-none" />
        <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amethyst-400/20 text-amethyst-100 hover:bg-amethyst-400/30"><Plus size={14} /></button>
      </form>
    </div>
  )
}
