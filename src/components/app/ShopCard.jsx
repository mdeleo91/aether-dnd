import { useState } from 'react'
import { aiGenerate } from '../../lib/ai.js'
import { Bag } from '../Icons.jsx'
import { Empty, GenError, Spinner } from './NpcCard.jsx'

const TYPES = ['General store', 'Magic shop', 'Alchemist', 'Blacksmith', 'Tavern', 'Black market']
const LEVELS = ['Poor', 'Standard', 'Rich']
const RARITY = { common: 'text-white/60', uncommon: 'text-emerald-300', rare: 'text-aether-200', 'very rare': 'text-amethyst-200', legendary: 'text-rune-200' }

export default function ShopCard({ card, onData }) {
  const data = card.data || {}
  const items = data.items || []
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState('')

  const set = (patch) => onData(card.id, patch)

  const reroll = async () => {
    setBusy(true); setState('')
    const count = data.level === 'Poor' ? 4 : data.level === 'Rich' ? 9 : 6
    const res = await aiGenerate('shop', { shopType: data.shopType, level: data.level, count })
    setBusy(false)
    if (res.demo) { setState('demo'); return }
    if (res.error) { setState('Generation failed: ' + res.error); return }
    set({ items: res.data?.items || [], shopName: res.data?.shopName || data.shopName })
  }

  const controls = (
    <div className="mb-2 flex items-center gap-1.5">
      <select value={data.shopType} onChange={(e) => set({ shopType: e.target.value })} className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-1.5 py-1 text-[11px] text-white/75 outline-none">
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={data.level} onChange={(e) => set({ level: e.target.value })} className="rounded-md border border-white/10 bg-ink-700 px-1.5 py-1 text-[11px] text-white/75 outline-none">
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <button onClick={reroll} disabled={busy} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2 py-1 text-[11px] font-semibold text-ink-900 transition hover:brightness-110 disabled:opacity-50">
        {busy ? <><Spinner size={10} /> …</> : '↻ Reroll'}
      </button>
    </div>
  )

  if (items.length === 0) {
    return (
      <div>
        {controls}
        <Empty busy={busy} state={state} onGenerate={reroll} label="shop inventory" icon={Bag} />
      </div>
    )
  }

  return (
    <div>
      {controls}
      {data.shopName && <p className="mb-1.5 font-display text-sm text-white/85">{data.shopName}</p>}
      {state && state !== 'demo' && <div className="mb-1.5"><GenError msg={state} /></div>}
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white/85">{it.name}</p>
              <p className={`text-[10px] ${RARITY[String(it.rarity).toLowerCase()] || 'text-white/50'}`}>{it.rarity} · {it.note}</p>
            </div>
            <span className="ml-2 shrink-0 font-mono text-[11px] text-rune-200">{it.price}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-white/30">✦ AI-generated · saved to this device</p>
    </div>
  )
}
