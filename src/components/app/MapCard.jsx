import { useRef } from 'react'
import { newId } from '../../app/generators.js'
import { Plus, Globe } from '../Icons.jsx'

const COLORS = ['bg-aether-300', 'bg-rune-300', 'bg-red-400', 'bg-emerald-400', 'bg-amethyst-400']

export default function MapCard({ card, onData, onPush }) {
  const data = card.data || { tokens: [], fog: false, name: 'Battle Map' }
  const tokens = data.tokens || []
  const gridRef = useRef(null)
  const drag = useRef(null)

  const set = (patch) => onData(card.id, patch)
  const setTokens = (fn) => set({ tokens: fn(tokens) })

  const addToken = () => {
    const i = tokens.length
    setTokens((t) => [
      ...t,
      { id: newId('tk'), x: 50, y: 50, color: COLORS[i % COLORS.length], label: String.fromCharCode(65 + (i % 26)) },
    ])
  }

  const onTokenDown = (e, id) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { id }
  }
  const onTokenMove = (e, id) => {
    if (!drag.current || drag.current.id !== id || !gridRef.current) return
    const r = gridRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
    setTokens((t) => t.map((k) => (k.id === id ? { ...k, x, y } : k)))
  }
  const onTokenUp = () => { drag.current = null }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          value={data.name || ''}
          onChange={(e) => set({ name: e.target.value })}
          className="min-w-0 flex-1 rounded bg-transparent text-xs font-medium text-white/80 outline-none focus:bg-white/5"
        />
        <button onClick={addToken} title="Add token" className="flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/65 hover:text-white"><Plus size={12} /> Token</button>
      </div>

      <div ref={gridRef} className="relative aspect-[16/10] select-none overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-aether-600/30 via-ink-600 to-ink-700">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-7">
          {Array.from({ length: 70 }).map((_, i) => <div key={i} className="border border-white/5" />)}
        </div>

        {tokens.map((k) => (
          <span
            key={k.id}
            onPointerDown={(e) => onTokenDown(e, k.id)}
            onPointerMove={(e) => onTokenMove(e, k.id)}
            onPointerUp={onTokenUp}
            onDoubleClick={(e) => { e.stopPropagation(); setTokens((t) => t.filter((x) => x.id !== k.id)) }}
            title="Drag to move · double-click to remove"
            className={`absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full ${k.color} text-[10px] font-bold text-ink-900 ring-2 ring-ink-900/40 active:cursor-grabbing`}
            style={{ left: `${k.x}%`, top: `${k.y}%` }}
          >
            {k.label}
          </span>
        ))}

        {data.fog && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-ink-900/80 backdrop-blur-[2px]">
            <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/70">Fog of war</span>
          </div>
        )}

        <div className="absolute left-2 top-2 z-30 rounded bg-ink-900/70 px-1.5 py-0.5 text-[9px] text-white/60">5 ft squares</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onPush?.({ type: 'map', name: data.name, tokens, fog: data.fog })}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 py-1.5 text-[11px] font-semibold text-ink-900 hover:brightness-110"
        >
          <Globe size={13} /> Push to player screen
        </button>
        <button
          onClick={() => set({ fog: !data.fog })}
          className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${data.fog ? 'border-aether-300/50 bg-aether-300/15 text-aether-100' : 'border-white/10 text-white/60'}`}
        >
          Fog {data.fog ? 'on' : 'off'}
        </button>
      </div>
      <p className="text-[9px] text-white/30">Add tokens, drag to position, toggle fog, then push to any open player screen.</p>
    </div>
  )
}
