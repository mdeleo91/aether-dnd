import { useState } from 'react'
import { parseDice, rollOnTable, newId } from '../../app/generators.js'
import { aiGenerate } from '../../lib/ai.js'
import { Dice, Sparkles } from '../Icons.jsx'

const PRESETS = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100']

export default function RollCard({ card, onData }) {
  const data = card.data || { history: [], die: 20 }
  const history = data.history || []
  const [expr, setExpr] = useState('1d20')
  const [theme, setTheme] = useState(data.theme || '')
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState('')

  const set = (patch) => onData(card.id, patch)
  const pushHistory = (entry) => set({ history: [{ id: newId('r'), ...entry }, ...history].slice(0, 10) })

  const rollExpr = (val) => {
    const r = parseDice(val ?? expr)
    if (!r) { setState('Try a format like 1d20+5'); return }
    setState('')
    pushHistory({ label: r.label, detail: r.rolls.join(' + ') + (r.mod ? (r.mod > 0 ? ' + ' : ' − ') + Math.abs(r.mod) : ''), result: String(r.total) })
  }

  const rollTable = () => {
    const r = rollOnTable(data.table)
    pushHistory({ label: `${data.table.name} (d${r.die})`, detail: `rolled ${r.roll}`, result: r.text })
  }

  const genTable = async () => {
    setBusy(true); setState('')
    const res = await aiGenerate('rolltable', { theme: theme || 'campaign events', die: data.die || 20 })
    setBusy(false)
    if (res.demo) { setState('demo'); return }
    if (res.error) { setState(res.error); return }
    set({ table: res.data, theme })
  }

  return (
    <div className="space-y-3">
      {/* Dice roller — pure mechanics, always works */}
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-aether-300"><Dice size={12} /> Dice roller</p>
        <div className="flex items-center gap-1.5">
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') rollExpr() }}
            placeholder="1d20+5"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 font-mono text-xs text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
          />
          <button onClick={() => rollExpr()} className="shrink-0 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2.5 py-1 text-xs font-semibold text-ink-900 hover:brightness-110">Roll</button>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => { setExpr('1' + p); rollExpr('1' + p) }} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/65 hover:border-amethyst-400/40 hover:text-white">{p}</button>
          ))}
        </div>
      </div>

      {/* AI-generated table */}
      <div className="border-t border-white/5 pt-2">
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amethyst-300"><Sparkles size={12} /> Random table</p>
        {data.table ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-white/85">{data.table.name} <span className="text-white/40">· d{data.table.die}</span></span>
              <div className="flex shrink-0 gap-1">
                <button onClick={rollTable} className="rounded-md bg-amethyst-400/20 px-2 py-0.5 text-[11px] font-semibold text-amethyst-100 hover:bg-amethyst-400/30">Roll</button>
                <button onClick={genTable} disabled={busy} className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-white/55 hover:text-white disabled:opacity-50">{busy ? '…' : '↻'}</button>
              </div>
            </div>
            <p className="mt-1 text-[9px] text-white/30">✦ AI-generated · saved to this device</p>
          </div>
        ) : (
          <div>
            {state === 'demo' ? (
              <p className="text-[11px] text-white/55">No AI key configured. Set <span className="font-mono text-amethyst-200">AI_API_KEY</span> in Vercel to generate a table. The dice roller above still works.</p>
            ) : state ? (
              <p className="text-[11px] text-red-300">{state}</p>
            ) : null}
            <div className="mt-1 flex items-center gap-1.5">
              <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="table theme (e.g. dockside rumors)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50" />
              <select value={data.die || 20} onChange={(e) => set({ die: Number(e.target.value) })} className="rounded-md border border-white/10 bg-ink-700 px-1 py-1 text-[11px] text-white/75 outline-none">
                {[6, 8, 10, 12, 20, 100].map((d) => <option key={d} value={d}>d{d}</option>)}
              </select>
              <button onClick={genTable} disabled={busy} className="shrink-0 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2 py-1 text-[11px] font-semibold text-ink-900 hover:brightness-110 disabled:opacity-50">{busy ? '…' : 'AI'}</button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">History</p>
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1 text-[11px]">
                <span className="min-w-0">
                  <span className="text-white/50">{h.label}</span>{h.detail ? <span className="text-white/30"> · {h.detail}</span> : null}
                </span>
                <span className="shrink-0 font-mono font-semibold text-aether-200">{h.result}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
