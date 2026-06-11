import { useState } from 'react'
import { newId, rollInitiative } from '../../app/generators.js'
import { aiGenerate } from '../../lib/ai.js'
import { searchSrdMonsters, fetchDnd5eApiMonster } from '../../lib/srd.js'
import { normalizeMember, initiativeValue, num } from '../../app/dnd5e.js'
import { abilityMod as monAbilityMod, normalizeMonster, fromSrdMonster, fromDnd5eApiMonster } from '../../app/monster.js'
import { Heart, Shield, Skull, Dragon, ChevronRight, Plus, Sparkles, Users, Book, Search, X, Check } from '../Icons.jsx'
import { useConfirm } from './ConfirmDialog.jsx'

// Parse a signed/loose modifier string ("+2", "-1", "3") to a number.
const parseMod = (v) => { const n = parseInt(String(v).replace('+', ''), 10); return Number.isFinite(n) ? n : 0 }

// The full official D&D 5e condition list.
const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone',
  'Restrained', 'Stunned', 'Unconscious',
]

export default function InitiativeTracker({ card, onData, party = [], lib }) {
  const data = card.data || { combatants: [], round: 1, turn: 0 }
  const list = data.combatants || []
  const order = [...list].sort((a, b) => b.init - a.init)
  const turn = order.length ? Math.min(data.turn || 0, order.length - 1) : 0
  const npcLib = lib?.npcLibrary || []
  const monsterLib = lib?.monsterLibrary || []

  const [name, setName] = useState('')
  const [init, setInit] = useState('')
  const [hp, setHp] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [condFor, setCondFor] = useState(null) // combatant id whose condition picker is open
  const [libOpen, setLibOpen] = useState(false)
  const [qty, setQty] = useState({}) // per-row quantity (search results)
  const [libQuery, setLibQuery] = useState('')
  const [libResults, setLibResults] = useState([]) // unified SRD + custom results
  const [libBusy, setLibBusy] = useState(false)
  const [libErr, setLibErr] = useState('')
  const [addingId, setAddingId] = useState(null)
  const confirm = useConfirm()

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

  const remove = async (cb) => {
    if (await confirm({ title: 'Remove combatant?', body: `Remove “${cb.name}” from the initiative order?`, confirmLabel: 'Remove' })) {
      setList((l) => l.filter((c) => c.id !== cb.id))
    }
  }
  const setHpFor = (id, val) =>
    setList((l) => l.map((c) => (c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, val)) } : c)))
  const bump = (id, d) => setList((l) => l.map((c) => (c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + d)) } : c)))
  const toggleCond = (id, cond) =>
    setList((l) =>
      l.map((c) => {
        if (c.id !== id) return c
        const conds = c.conditions || []
        return { ...c, conditions: conds.includes(cond) ? conds.filter((x) => x !== cond) : [...conds, cond] }
      }),
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

  // Insert a saved NPC (character/creature) as a combatant.
  const addNpcFromLib = (npc) => {
    const cb = {
      id: newId('cb'),
      name: npc.name || 'NPC',
      sub: npc.type || (npc.cr ? `CR ${npc.cr}` : ''),
      init: rollInitiative(String(parseMod(npc.abilities?.DEX))),
      hp: num(npc.hp, 10), maxHp: num(npc.hp, 10), ac: num(npc.ac, 10), kind: 'npc', conditions: [],
    }
    setList((l) => [...l, cb])
    setMsg(`Added ${cb.name}.`)
  }

  // Insert a saved monster as N numbered combatants (each rolls its own init).
  const addMonsterFromLib = (monster, n = 1) => {
    const count = Math.max(1, Math.min(20, n))
    const mod = monAbilityMod((monster.abilities || {}).DEX)
    const added = []
    for (let i = 0; i < count; i++) {
      added.push({
        id: newId('cb'),
        name: count > 1 ? `${monster.name} ${i + 1}` : monster.name,
        sub: monster.cr ? `CR ${monster.cr}` : monster.type || '',
        init: rollInitiative(String(mod)),
        hp: num(monster.hp, 10), maxHp: num(monster.hp, 10), ac: num(monster.ac, 10), kind: 'npc', conditions: [],
      })
    }
    setList((l) => [...l, ...added])
    setMsg(`Added ${count > 1 ? `${count}× ` : ''}${monster.name}.`)
  }

  // Unified monster search across the NATIVE SRD list AND saved custom enemies.
  const searchMonsters = async (e) => {
    e?.preventDefault?.()
    const q = libQuery.trim()
    const ql = q.toLowerCase()
    setLibBusy(true); setLibErr('')
    const custom = (monsterLib || [])
      .filter((row) => !q || (row.monster?.name || '').toLowerCase().includes(ql))
      .map((row) => ({
        key: 'c_' + row.id, kind: 'custom', name: row.monster?.name || 'Monster',
        monster: normalizeMonster(row.monster),
        meta: [row.monster?.cr ? `CR ${row.monster.cr}` : null, row.monster?.ac ? `AC ${row.monster.ac}` : null, row.monster?.hp ? `HP ${row.monster.hp}` : null].filter(Boolean).join(' · '),
      }))
    let srd = []
    let errMsg = ''
    if (q) {
      const res = await searchSrdMonsters(q)
      if (res.error) errMsg = res.error
      else srd = (res.results || []).map((r) => ({
        key: 's_' + (r.slug || r.index || r.name), kind: 'srd', name: r.name, raw: r,
        meta: [r.size, r.type, r.challenge_rating != null ? `CR ${r.challenge_rating}` : null].filter(Boolean).join(' · '),
      }))
    }
    setLibBusy(false)
    const all = [...custom, ...srd]
    setLibResults(all)
    setLibErr(errMsg || (!all.length ? (q ? 'No monsters matched — try another name.' : 'Type a name to search the SRD and your custom enemies.') : ''))
  }

  // Add a unified-search result (custom or SRD) into the order, ×N.
  const addSearchResult = async (r, n) => {
    setAddingId(r.key)
    try {
      let monster = null
      if (r.kind === 'custom') monster = r.monster
      else {
        const raw = r.raw
        if (raw.armor_class !== undefined || raw.strength !== undefined) monster = fromSrdMonster(raw)
        else { const full = await fetchDnd5eApiMonster(raw); monster = full ? fromDnd5eApiMonster(full) : null }
      }
      if (!monster) { setMsg('Could not load that monster.'); return }
      addMonsterFromLib(monster, num(n, 1))
    } finally {
      setAddingId(null)
    }
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
            onClick={() => { setLibOpen((o) => !o); setMsg('') }}
            title="Add a saved NPC or monster from your libraries"
            aria-pressed={libOpen}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${libOpen ? 'border-rune-300/50 bg-rune-400/15 text-rune-100' : 'border-white/15 text-white/65 hover:text-white'}`}
          >
            <Book size={12} /> Library
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

      {libOpen && (
        <div className="mt-2 rounded-lg border border-white/10 bg-ink-800/70 p-2">
          <div className="mb-1 flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Add from libraries</span>
            <button onClick={() => setLibOpen(false)} className="text-white/30 hover:text-white"><X size={12} /></button>
          </div>
          <p className="mb-1 flex items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-amethyst-200/80"><Skull size={10} /> NPCs</p>
          {npcLib.length === 0 ? (
            <p className="px-1 pb-1 text-[10px] text-white/35">No saved NPCs. Save one from an NPC card.</p>
          ) : (
            <div className="space-y-1">
              {npcLib.map((row) => (
                <div key={row.id} className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-white/85">{row.npc?.name || 'NPC'}</p>
                    <p className="truncate text-[9px] text-white/40">{[row.npc?.type, row.npc?.cr ? `CR ${row.npc.cr}` : null, row.npc?.ac ? `AC ${row.npc.ac}` : null, row.npc?.hp ? `HP ${row.npc.hp}` : null].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button onClick={() => addNpcFromLib(row.npc)} className="shrink-0 rounded bg-amethyst-400/20 px-2 py-0.5 text-[10px] font-semibold text-amethyst-100 hover:bg-amethyst-400/30">Add</button>
                </div>
              ))}
            </div>
          )}
          <p className="mb-1 mt-2 flex items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-rune-200/80"><Dragon size={10} /> Monsters · SRD + custom</p>
          <form onSubmit={searchMonsters} className="flex items-center gap-1.5">
            <input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="Search SRD + your custom enemies (e.g. goblin)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-rune-300/50" />
            <button type="submit" disabled={libBusy} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rune-400/25 text-rune-100 hover:bg-rune-400/35 disabled:opacity-50">{libBusy ? <span className="text-[11px]">…</span> : <Search size={13} />}</button>
          </form>
          {libErr && <p className="px-1 pt-1 text-[10px] text-white/45">{libErr}</p>}
          <div className="mt-1 max-h-[220px] space-y-1 overflow-auto pr-1">
            {libResults.map((r) => {
              const q = qty[r.key] ?? 1
              return (
                <div key={r.key} className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${r.kind === 'custom' ? 'bg-rune-400/25 text-rune-100' : 'bg-white/10 text-white/55'}`}><Dragon size={11} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-white/85">{r.name} <span className={`text-[8px] ${r.kind === 'custom' ? 'text-rune-200' : 'text-white/35'}`}>· {r.kind === 'custom' ? 'custom' : 'SRD'}</span></p>
                    <p className="truncate text-[9px] text-white/40">{r.meta}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <span className="text-[9px] text-white/30">×</span>
                    <input value={q} onChange={(e) => setQty((m) => ({ ...m, [r.key]: e.target.value.replace(/[^0-9]/g, '') }))} className="w-7 rounded bg-white/5 px-1 py-0.5 text-center font-mono text-[10px] text-white/85 outline-none" />
                  </span>
                  <button onClick={() => addSearchResult(r, q)} disabled={addingId === r.key} className="shrink-0 rounded bg-rune-400/25 px-2 py-0.5 text-[10px] font-semibold text-rune-100 hover:bg-rune-400/35 disabled:opacity-50">{addingId === r.key ? '…' : 'Add'}</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                <button
                  onClick={() => setCondFor((id) => (id === c.id ? null : c.id))}
                  title="Click to set conditions"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs transition ${c.kind === 'pc' ? 'bg-aether-500/30 text-aether-100' : 'bg-rune-400/25 text-rune-100'} ${condFor === c.id ? 'ring-2 ring-amethyst-400/70' : 'hover:ring-1 hover:ring-white/40'}`}
                >
                  {c.init}
                </button>
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
                    <button onClick={() => remove(c)} title="Remove" className="text-white/30 hover:text-red-300"><X size={12} /></button>
                  </div>
                  {(c.conditions || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {(c.conditions || []).map((s) => (
                        <button key={s} onClick={() => toggleCond(c.id, s)} title="Click to remove condition" className="inline-flex items-center gap-1 rounded-full bg-amethyst-400/20 px-1.5 py-0.5 text-[9px] font-medium text-amethyst-100 transition hover:bg-amethyst-400/30">{s} <X size={8} /></button>
                      ))}
                    </div>
                  )}
                  {condFor === c.id && (
                    <div className="mt-1.5 rounded-lg border border-white/10 bg-ink-900/70 p-1.5">
                      <div className="mb-1 flex items-center justify-between px-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Conditions</span>
                        <button onClick={() => setCondFor(null)} title="Close" className="text-white/30 hover:text-white"><X size={11} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-0.5">
                        {CONDITIONS.map((cond) => {
                          const on = (c.conditions || []).includes(cond)
                          return (
                            <button
                              key={cond}
                              onClick={() => toggleCond(c.id, cond)}
                              className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-[10px] transition ${on ? 'bg-amethyst-400/20 text-amethyst-100' : 'text-white/60 hover:bg-white/5'}`}
                            >
                              <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border ${on ? 'border-amethyst-400 bg-amethyst-400' : 'border-white/25'}`}>{on ? <Check size={8} className="text-ink-900" /> : null}</span>
                              <span className="truncate">{cond}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
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
