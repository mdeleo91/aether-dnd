import { useRef, useState } from 'react'
import { aiParseCharSheet, fileToScaledBase64 } from '../../lib/ai.js'
import { GenError, Spinner } from './NpcCard.jsx'
import { Users, UserPlus, Sparkles, X } from '../Icons.jsx'

const ABILS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

const num = (v, d = 0) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : d
}

// Normalize whatever the vision model returns into a clean party member.
function fromParsed(d = {}) {
  const ab = d.abilities || {}
  const abilities = {}
  ABILS.forEach((k) => (abilities[k] = num(ab[k] ?? ab[k?.toLowerCase?.()], 10)))
  const maxHp = num(d.maxHp ?? d.hp, 10)
  return {
    name: d.name || 'Imported character',
    class: d.class || '',
    race: d.race || '',
    level: num(d.level, 1),
    abilities,
    ac: num(d.ac, 10),
    hp: num(d.hp ?? d.maxHp, maxHp),
    maxHp,
    skills: Array.isArray(d.skills) ? d.skills.slice(0, 8) : [],
    notes: d.notes || '',
  }
}

function blankMember() {
  return {
    name: 'New character',
    class: '',
    race: '',
    level: 1,
    abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    ac: 10,
    hp: 10,
    maxHp: 10,
    skills: [],
    notes: '',
  }
}

export default function PartyCard({ lib }) {
  const party = lib?.party || []
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setBusy(true); setErr(''); setNote('')
    try {
      const { base64, mediaType } = await fileToScaledBase64(file)
      const res = await aiParseCharSheet(base64, mediaType)
      if (res.demo) { setErr('demo'); return }
      if (res.error) { setErr('Import failed: ' + res.error); return }
      const member = fromParsed(res.data)
      lib.addPartyMember(member)
      setNote(`Imported “${member.name}” — review the stats below.`)
    } catch (e2) {
      setErr('Import failed: ' + (e2?.message || 'could not process image'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-1 pb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aether-300">
          <Users size={13} /> Party · {party.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => lib.addPartyMember(blankMember())}
            title="Add a member manually"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/65 transition hover:text-white"
          >
            <UserPlus size={12} /> Add
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            title="Import a character by uploading a photo of the sheet"
            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2 py-1 text-[11px] font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <><Spinner size={10} /> Reading…</> : <><Sparkles size={12} /> Import sheet</>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
      </div>

      {err === 'demo' ? (
        <p className="px-1 pt-2 text-[11px] text-white/55">
          No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in Vercel to import sheets by photo. You can still add members manually.
        </p>
      ) : err ? (
        <div className="px-1 pt-2"><GenError msg={err} /></div>
      ) : note ? (
        <p className="px-1 pt-2 text-[11px] text-emerald-300">{note}</p>
      ) : busy ? (
        <p className="px-1 pt-2 text-[11px] text-amethyst-100/80">Reading the character sheet with AI vision…</p>
      ) : null}

      <div className="mt-2 flex-1 space-y-2 overflow-auto pr-1">
        {party.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-white/40">
            No party yet. <span className="text-amethyst-200">Add</span> a member, or <span className="text-amethyst-200">Import sheet</span> from a photo of a character sheet.
          </p>
        )}
        {party.map((m) => (
          <Member key={m.id} m={m} lib={lib} />
        ))}
      </div>

      {party.length > 0 && (
        <p className="mt-2 border-t border-white/5 pt-2 text-[9px] text-white/30">
          ✦ Imported via AI vision · all fields editable · saved to this campaign
        </p>
      )}
    </div>
  )
}

function Member({ m, lib }) {
  const [open, setOpen] = useState(false)
  const edit = (patch) => lib.updatePartyMember(m.id, patch)
  const editAb = (k, v) => lib.updatePartyMember(m.id, { abilities: { ...m.abilities, [k]: num(v, 10) } })

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
      <div className="flex items-center gap-1.5">
        <input
          value={m.name}
          onChange={(e) => edit({ name: e.target.value })}
          className="min-w-0 flex-1 rounded bg-transparent text-sm font-medium text-white outline-none focus:bg-white/5"
        />
        <button onClick={() => setOpen((o) => !o)} className="rounded px-1.5 py-0.5 text-[10px] text-white/45 hover:text-white">{open ? 'Hide' : 'Edit'}</button>
        <button onClick={() => lib.removePartyMember(m.id)} title="Remove" className="text-white/30 hover:text-red-300"><X size={13} /></button>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/50">
        <span>Lv {m.level || 1}</span>
        <span className="truncate">{[m.race, m.class].filter(Boolean).join(' ') || 'class / race'}</span>
        <span className="ml-auto flex items-center gap-2 font-mono text-white/60">
          <span>AC {m.ac}</span><span>HP {m.hp}/{m.maxHp}</span>
        </span>
      </div>

      {open && (
        <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
          <div className="grid grid-cols-3 gap-1.5">
            <Field label="Class" value={m.class} onChange={(v) => edit({ class: v })} />
            <Field label="Race" value={m.race} onChange={(v) => edit({ race: v })} />
            <Field label="Level" value={m.level} onChange={(v) => edit({ level: num(v, 1) })} numeric />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Field label="AC" value={m.ac} onChange={(v) => edit({ ac: num(v, 10) })} numeric />
            <Field label="HP" value={m.hp} onChange={(v) => edit({ hp: num(v, 0) })} numeric />
            <Field label="Max HP" value={m.maxHp} onChange={(v) => edit({ maxHp: num(v, 0) })} numeric />
          </div>
          <div className="grid grid-cols-6 gap-1 text-center">
            {ABILS.map((k) => (
              <label key={k} className="rounded bg-white/5 py-0.5">
                <span className="block text-[8px] uppercase text-white/40">{k}</span>
                <input
                  value={m.abilities?.[k] ?? 10}
                  onChange={(e) => editAb(k, e.target.value)}
                  className="w-full bg-transparent text-center font-mono text-[11px] text-white/85 outline-none"
                />
              </label>
            ))}
          </div>
          {Array.isArray(m.skills) && m.skills.length > 0 && (
            <p className="text-[10px] text-white/50"><span className="text-white/35">Skills:</span> {m.skills.join(', ')}</p>
          )}
          <input
            value={m.notes || ''}
            onChange={(e) => edit({ notes: e.target.value })}
            placeholder="Notes"
            className="w-full rounded border border-white/10 bg-ink-700 px-2 py-1 text-[11px] text-white/80 placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
          />
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, numeric }) {
  return (
    <label className="block">
      <span className="block text-[8px] uppercase tracking-wider text-white/40">{label}</span>
      <input
        value={value}
        inputMode={numeric ? 'numeric' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-ink-700 px-1.5 py-0.5 text-[11px] text-white/85 outline-none focus:border-amethyst-400/50"
      />
    </label>
  )
}
