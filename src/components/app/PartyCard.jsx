import { useRef, useState } from 'react'
import { aiParseCharSheet, fileToScaledBase64 } from '../../lib/ai.js'
import { newId } from '../../app/generators.js'
import { normalizeMember, blankMember, fromParsedSheet } from '../../app/dnd5e.js'
import { GenError, Spinner } from './NpcCard.jsx'
import CharacterSheet from './CharacterSheet.jsx'
import { Users, UserPlus, Sparkles, ChevronRight } from '../Icons.jsx'

// Party system: a ROSTER of members → click one to open their full 5e sheet.
export default function PartyCard({ lib }) {
  const party = lib?.party || []
  const fileRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const selected = party.find((m) => m.id === selectedId)

  const addManual = () => {
    const id = newId('pc')
    lib.addPartyMember({ ...blankMember(), id })
    setNote(''); setErr('')
    setSelectedId(id)
  }

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setErr(''); setNote('')
    try {
      const { base64, mediaType } = await fileToScaledBase64(file)
      const res = await aiParseCharSheet(base64, mediaType)
      if (res.demo) { setErr('demo'); return }
      if (res.error) { setErr('Import failed: ' + res.error); return }
      const id = newId('pc')
      const member = { ...fromParsedSheet(res.data), id }
      lib.addPartyMember(member)
      setNote(`Imported “${member.name}” — opening the sheet to review.`)
      setSelectedId(id)
    } catch (e2) {
      setErr('Import failed: ' + (e2?.message || 'could not process image'))
    } finally {
      setBusy(false)
    }
  }

  // ---- DETAIL: full character sheet ----
  if (selected) {
    return <CharacterSheet member={selected} lib={lib} onBack={() => setSelectedId(null)} />
  }

  // ---- ROSTER ----
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-1 pb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aether-300">
          <Users size={13} /> Party · {party.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={addManual} title="Add a member manually" className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/65 transition hover:text-white">
            <UserPlus size={12} /> Add
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy} title="Import a character from a photo of the sheet" className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2 py-1 text-[11px] font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50">
            {busy ? <><Spinner size={10} /> Reading…</> : <><Sparkles size={12} /> Import sheet</>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
      </div>

      {err === 'demo' ? (
        <p className="px-1 pt-2 text-[11px] text-white/55">No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in Vercel to import sheets by photo. You can still add members manually.</p>
      ) : err ? (
        <div className="px-1 pt-2"><GenError msg={err} /></div>
      ) : note ? (
        <p className="px-1 pt-2 text-[11px] text-emerald-300">{note}</p>
      ) : busy ? (
        <p className="px-1 pt-2 text-[11px] text-amethyst-100/80">Reading the full character sheet with AI vision…</p>
      ) : null}

      <div className="mt-2 flex-1 space-y-1.5 overflow-auto pr-1">
        {party.length === 0 && (
          <p className="px-1 py-5 text-center text-xs leading-relaxed text-white/40">
            No party yet. <span className="text-amethyst-200">Add</span> a member, or <span className="text-amethyst-200">Import sheet</span> from a photo of a 5e character sheet.
          </p>
        )}
        {party.map((raw) => {
          const m = normalizeMember(raw)
          return (
            <button key={m.id} onClick={() => setSelectedId(m.id)} className="group flex w-full items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left transition hover:border-amethyst-400/40 hover:bg-white/[0.04]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aether-500/40 to-amethyst-500/40 font-display text-base text-white">
                {(m.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{m.name}</p>
                <p className="truncate text-[11px] text-white/45">
                  {[m.classes || `Level ${m.level}`, m.race].filter(Boolean).join(' · ') || 'unclassed'}
                </p>
              </div>
              <div className="shrink-0 text-right font-mono text-[11px] text-white/55">
                <div>AC {m.ac || '—'}</div>
                <div>HP {m.hp || '—'}/{m.maxHp || '—'}</div>
              </div>
              <ChevronRight size={14} className="shrink-0 text-white/25 group-hover:text-amethyst-200" />
            </button>
          )
        })}
      </div>

      {party.length > 0 && (
        <p className="mt-2 border-t border-white/5 pt-2 text-[9px] text-white/30">Tap a character to open their full 5e sheet · imported via AI vision · saved to this campaign</p>
      )}
    </div>
  )
}
