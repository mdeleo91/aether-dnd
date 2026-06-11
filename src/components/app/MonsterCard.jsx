import { useState } from 'react'
import { aiGenerate } from '../../lib/ai.js'
import { searchSrdMonsters, fetchDnd5eApiMonster } from '../../lib/srd.js'
import {
  ABILS, abilityMod, fmtMod, normalizeMonster, fromSrdMonster, fromDnd5eApiMonster,
  fromAiMonster, profBonusForCR, xpForCR,
} from '../../app/monster.js'
import { Spinner, GenError } from './NpcCard.jsx'
import { Skull, Sparkles, Check, Plus, X, Search } from '../Icons.jsx'

// The Enemy/Monster tool: a Monster-Manual stat block with two ways to fill it —
// (1) search the SRD via the open5e API, (2) AI-generate a custom monster — then
// edit it and save it to the campaign Bestiary.
export default function MonsterCard({ card, onData, lib }) {
  const monster = card.data?.monster ? normalizeMonster(card.data.monster) : null
  const mode = card.data?.mode || 'search'
  const setMode = (m) => onData(card.id, { mode: m })
  const [saved, setSaved] = useState(false)

  const setMonster = (m) => onData(card.id, { monster: m })
  const clear = () => onData(card.id, { monster: null })
  const saveToBestiary = () => {
    if (!monster) return
    lib?.saveMonsterToBestiary?.(monster)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  if (monster) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-end gap-1">
          <button onClick={clear} title="Back to search / generate" className="rounded-md border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-white">← New</button>
          <button onClick={saveToBestiary} title="Save to this campaign's Bestiary" className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition ${saved ? 'border-emerald-400/40 text-emerald-300' : 'border-white/15 text-white/60 hover:text-white'}`}>
            {saved ? <><Check size={10} /> Saved</> : '★ Save to Bestiary'}
          </button>
        </div>
        <StatBlock monster={monster} onChange={setMonster} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1 rounded-lg border border-white/10 bg-ink-800/60 p-0.5 text-[11px]">
        <ModeBtn active={mode === 'search'} onClick={() => setMode('search')}>SRD search</ModeBtn>
        <ModeBtn active={mode === 'ai'} onClick={() => setMode('ai')}>AI custom</ModeBtn>
      </div>
      {mode === 'search'
        ? <SearchMode card={card} onData={onData} onLoad={setMonster} />
        : <AiMode card={card} onData={onData} onLoad={setMonster} />}
    </div>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-md px-2 py-1 font-medium transition ${active ? 'bg-rune-400/20 text-rune-100' : 'text-white/55 hover:text-white'}`}>{children}</button>
  )
}

// ---------- SRD SEARCH MODE ----------
function SearchMode({ card, onData, onLoad }) {
  const query = card.data?.query || ''
  const cr = card.data?.cr || ''
  const type = card.data?.type || ''
  const results = card.data?.results || []
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loadingId, setLoadingId] = useState(null)

  const run = async (e) => {
    e?.preventDefault?.()
    setBusy(true); setErr('')
    const res = await searchSrdMonsters(query.trim(), { cr: cr.trim(), type: type.trim() })
    setBusy(false)
    if (res.error) { setErr(res.error); onData(card.id, { results: [] }); return }
    onData(card.id, { results: res.results.map((r) => ({ ...r, _src: res.source })) })
    if (!res.results.length) setErr('No SRD monsters matched. Try another name, CR, or type.')
  }

  const pick = async (r) => {
    setLoadingId(r.slug || r.index || r.name)
    setErr('')
    try {
      let loaded
      if (r.armor_class !== undefined || r.strength !== undefined) loaded = fromSrdMonster(r) // open5e full object
      else { const full = await fetchDnd5eApiMonster(r); loaded = full ? fromDnd5eApiMonster(full) : null }
      if (!loaded) { setErr('Could not load that monster.'); return }
      onLoad(loaded)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <form onSubmit={run} className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input value={query} onChange={(e) => onData(card.id, { query: e.target.value })} placeholder="Search SRD monsters (e.g. goblin, dragon)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-rune-300/50" />
          <button type="submit" disabled={busy} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rune-400/25 text-rune-100 hover:bg-rune-400/35 disabled:opacity-50">{busy ? <Spinner size={12} /> : <Search size={13} />}</button>
        </div>
        <div className="flex items-center gap-1.5">
          <input value={cr} onChange={(e) => onData(card.id, { cr: e.target.value })} placeholder="CR (e.g. 1/2)" className="w-24 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[10px] text-white/85 placeholder:text-white/30 outline-none" />
          <input value={type} onChange={(e) => onData(card.id, { type: e.target.value })} placeholder="type (e.g. dragon)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[10px] text-white/85 placeholder:text-white/30 outline-none" />
        </div>
      </form>
      {err && <div className="mt-2"><GenError msg={err} /></div>}
      <div className="mt-2 max-h-[340px] space-y-1 overflow-auto pr-1">
        {results.map((r) => (
          <button key={r.slug || r.index || r.name} onClick={() => pick(r)} className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-left transition hover:border-rune-300/40 hover:bg-white/[0.04]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rune-400/20 text-rune-100"><Skull size={13} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/85">{r.name}</p>
              <p className="truncate text-[10px] text-white/45">{[r.size, r.type, r.challenge_rating != null ? `CR ${r.challenge_rating}` : null].filter(Boolean).join(' · ') || 'SRD monster'}</p>
            </div>
            {loadingId === (r.slug || r.index || r.name) ? <Spinner size={11} /> : <span className="text-[10px] text-rune-200">Open →</span>}
          </button>
        ))}
        {!results.length && !err && !busy && (
          <p className="px-1 py-6 text-center text-[11px] leading-relaxed text-white/40">Search the SRD bestiary by name, CR, or creature type. Open a result to drop a stat block here, then save it to your Bestiary.</p>
        )}
      </div>
    </div>
  )
}

// ---------- AI CUSTOM MODE ----------
function AiMode({ card, onData, onLoad }) {
  const prompt = card.data?.prompt || ''
  const cr = card.data?.aiCr || ''
  const type = card.data?.aiType || ''
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState('') // '' | 'demo' | error

  const generate = async () => {
    setBusy(true); setState('')
    const res = await aiGenerate('monster', { prompt: prompt.trim(), cr: cr.trim(), type: type.trim() })
    setBusy(false)
    if (res.demo) { setState('demo'); return }
    if (res.error) { setState('Generation failed: ' + res.error); return }
    onLoad(fromAiMonster(res.data))
  }

  return (
    <div className="space-y-2">
      <textarea
        value={prompt}
        onChange={(e) => onData(card.id, { prompt: e.target.value })}
        rows={3}
        placeholder="Describe the monster (e.g. a bog-dwelling hag that drowns travellers and animates kelp)"
        className="w-full resize-none rounded-md border border-white/10 bg-ink-700 px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
      />
      <div className="flex items-center gap-1.5">
        <input value={cr} onChange={(e) => onData(card.id, { aiCr: e.target.value })} placeholder="CR (optional)" className="w-28 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[10px] text-white/85 placeholder:text-white/30 outline-none" />
        <input value={type} onChange={(e) => onData(card.id, { aiType: e.target.value })} placeholder="type (optional)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[10px] text-white/85 placeholder:text-white/30 outline-none" />
      </div>
      {state === 'demo' && (
        <p className="text-[11px] leading-relaxed text-white/55">No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in Vercel to generate a custom monster. You can still use SRD search.</p>
      )}
      {state && state !== 'demo' && <GenError msg={state} />}
      <button onClick={generate} disabled={busy} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 px-3.5 py-2 text-xs font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50">
        {busy ? <Spinner size={14} /> : <Sparkles size={14} />} {busy ? 'Conjuring…' : 'Generate custom monster'}
      </button>
    </div>
  )
}

// ---------- THE STAT BLOCK (editable) ----------
function StatBlock({ monster: m, onChange }) {
  const edit = (patch) => onChange(normalizeMonster({ ...m, ...patch }))
  const editAbility = (k, v) => edit({ abilities: { ...m.abilities, [k]: v } })
  const editEntry = (key, i, patch) => edit({ [key]: m[key].map((e, idx) => (idx === i ? { ...e, ...patch } : e)) })
  const addEntry = (key) => edit({ [key]: [...m[key], { name: '', desc: '' }] })
  const removeEntry = (key, i) => edit({ [key]: m[key].filter((_, idx) => idx !== i) })

  return (
    <div className="rounded-lg border border-rune-400/30 bg-rune-400/[0.04] p-2.5" style={{ boxShadow: 'inset 3px 0 0 0 rgba(217,154,44,0.55)' }}>
      {/* name + type line */}
      <input value={m.name} onChange={(e) => edit({ name: e.target.value })} className="w-full bg-transparent font-display text-lg text-rune-100 outline-none focus:bg-white/5" />
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] italic text-white/55">
        <Bare value={m.size} onChange={(v) => edit({ size: v })} w="w-16" />
        <Bare value={m.type} onChange={(v) => edit({ type: v })} w="w-20" />
        <Bare value={m.subtype} onChange={(v) => edit({ subtype: v })} placeholder="(subtype)" w="w-20" />
        <span>,</span>
        <Bare value={m.alignment} onChange={(v) => edit({ alignment: v })} w="w-28" />
      </div>

      <Rule />
      <KV label="Armor Class"><Bare value={m.ac} onChange={(v) => edit({ ac: v })} w="w-10" mono /> <Bare value={m.acType} onChange={(v) => edit({ acType: v })} placeholder="(natural armor)" w="w-28" /></KV>
      <KV label="Hit Points"><Bare value={m.hp} onChange={(v) => edit({ hp: v })} w="w-10" mono /> <Bare value={m.hitDice} onChange={(v) => edit({ hitDice: v })} placeholder="(7d8+14)" w="w-24" mono /></KV>
      <KV label="Speed"><Bare value={m.speed} onChange={(v) => edit({ speed: v })} placeholder="30 ft." w="flex-1" /></KV>

      <Rule />
      <div className="grid grid-cols-6 gap-1 text-center">
        {ABILS.map((k) => (
          <div key={k} className="rounded-md border border-rune-400/20 bg-white/[0.03] py-1">
            <div className="text-[9px] font-bold uppercase text-rune-200/80">{k}</div>
            <input value={m.abilities[k]} onChange={(e) => editAbility(k, e.target.value)} className="w-full bg-transparent text-center font-mono text-sm text-white outline-none" />
            <div className="font-mono text-[10px] text-white/55">{fmtMod(abilityMod(m.abilities[k]))}</div>
          </div>
        ))}
      </div>

      <Rule />
      <KVText label="Saving Throws" value={m.saves} onChange={(v) => edit({ saves: v })} placeholder="CON +6, WIS +4" />
      <KVText label="Skills" value={m.skills} onChange={(v) => edit({ skills: v })} placeholder="Perception +5, Stealth +6" />
      <KVText label="Damage Vulnerabilities" value={m.damageVulnerabilities} onChange={(v) => edit({ damageVulnerabilities: v })} />
      <KVText label="Damage Resistances" value={m.damageResistances} onChange={(v) => edit({ damageResistances: v })} />
      <KVText label="Damage Immunities" value={m.damageImmunities} onChange={(v) => edit({ damageImmunities: v })} />
      <KVText label="Condition Immunities" value={m.conditionImmunities} onChange={(v) => edit({ conditionImmunities: v })} />
      <KV label="Senses">
        <Bare value={m.senses} onChange={(v) => edit({ senses: v })} placeholder="darkvision 60 ft." w="flex-1" />
        <span className="ml-1 shrink-0 text-white/40">· passive Perception</span>
        <Bare value={m.passivePerception} onChange={(v) => edit({ passivePerception: v })} w="w-8" mono />
      </KV>
      <KVText label="Languages" value={m.languages} onChange={(v) => edit({ languages: v })} placeholder="Common, Draconic" />
      <KV label="Challenge">
        <Bare value={m.cr} onChange={(v) => edit({ cr: v })} w="w-10" mono />
        <span className="shrink-0 text-white/45">{xpForCR(m.cr) ? `(${xpForCR(m.cr)} XP)` : ''} · PB {fmtMod(profBonusForCR(m.cr))}</span>
      </KV>

      <EntrySection title="Traits" entries={m.traits} k="traits" {...{ editEntry, addEntry, removeEntry }} />
      <EntrySection title="Actions" entries={m.actions} k="actions" {...{ editEntry, addEntry, removeEntry }} accent />
      <EntrySection title="Bonus Actions" entries={m.bonusActions} k="bonusActions" {...{ editEntry, addEntry, removeEntry }} />
      <EntrySection title="Reactions" entries={m.reactions} k="reactions" {...{ editEntry, addEntry, removeEntry }} />
      <div>
        <SectionHead title="Legendary Actions" onAdd={() => addEntry('legendaryActions')} />
        {(m.legendaryActions.length > 0 || m.legendaryDescription) && (
          <textarea value={m.legendaryDescription} onChange={(e) => edit({ legendaryDescription: e.target.value })} rows={2} placeholder="Legendary action rules (e.g. can take 3 legendary actions…)" className="mb-1 w-full resize-none rounded border border-white/10 bg-ink-700 px-2 py-1 text-[10px] italic text-white/70 placeholder:text-white/25 outline-none" />
        )}
        <EntryList entries={m.legendaryActions} k="legendaryActions" {...{ editEntry, removeEntry }} />
      </div>
      <EntrySection title="Lair Actions" entries={m.lairActions} k="lairActions" {...{ editEntry, addEntry, removeEntry }} />

      <p className="mt-2 text-[9px] text-white/30">✦ 5e stat block · ability modifiers, XP &amp; proficiency bonus auto-computed · editable · save to Bestiary</p>
    </div>
  )
}

// ---- statblock building blocks ----
function Rule() {
  return <div className="my-2 h-px bg-gradient-to-r from-rune-400/60 to-transparent" />
}
function KV({ label, children }) {
  return <p className="flex flex-wrap items-center gap-x-1 text-[11px] text-white/75"><span className="font-semibold text-rune-200/90">{label}</span> {children}</p>
}
function KVText({ label, value, onChange, placeholder }) {
  if (!value && !placeholder) return null
  return (
    <p className="flex items-center gap-1 text-[11px] text-white/75">
      <span className="shrink-0 font-semibold text-rune-200/90">{label}</span>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-white/80 outline-none placeholder:text-white/25 focus:bg-white/5" />
    </p>
  )
}
function Bare({ value, onChange, placeholder, w = 'w-16', mono }) {
  return (
    <input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${w} bg-transparent text-white/80 outline-none placeholder:text-white/25 focus:bg-white/5 ${mono ? 'font-mono' : ''}`}
    />
  )
}
function SectionHead({ title, onAdd }) {
  return (
    <div className="mt-2 flex items-center justify-between border-b border-rune-400/40 pb-0.5">
      <span className="font-display text-sm text-rune-100">{title}</span>
      <button onClick={onAdd} title={`Add ${title.replace(/s$/, '').toLowerCase()}`} className="text-rune-200/70 hover:text-rune-100"><Plus size={12} /></button>
    </div>
  )
}
function EntrySection({ title, entries, k, editEntry, addEntry, removeEntry }) {
  return (
    <div>
      <SectionHead title={title} onAdd={() => addEntry(k)} />
      <EntryList entries={entries} k={k} editEntry={editEntry} removeEntry={removeEntry} />
    </div>
  )
}
function EntryList({ entries, k, editEntry, removeEntry }) {
  return (
    <div className="mt-1 space-y-1.5">
      {entries.map((e, i) => (
        <div key={i} className="rounded-md border border-white/5 bg-white/[0.02] p-1.5">
          <div className="flex items-center gap-1">
            <input value={e.name} onChange={(ev) => editEntry(k, i, { name: ev.target.value })} placeholder="Name" className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold italic text-rune-100 outline-none placeholder:text-white/25 focus:bg-white/5" />
            <button onClick={() => removeEntry(k, i)} className="shrink-0 text-white/25 hover:text-red-300"><X size={11} /></button>
          </div>
          <textarea value={e.desc} onChange={(ev) => editEntry(k, i, { desc: ev.target.value })} rows={2} placeholder="Description…" className="mt-0.5 w-full resize-none bg-transparent text-[11px] leading-snug text-white/75 outline-none placeholder:text-white/25 focus:bg-white/5" />
        </div>
      ))}
    </div>
  )
}
