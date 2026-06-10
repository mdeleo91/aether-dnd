import { useRef, useState } from 'react'
import InitiativeTracker from './InitiativeTracker.jsx'
import { shopItems, sessionNotes } from '../../data/mock.js'
import { Dice, Map, Bag, Scroll, Swords, Skull, Sparkles } from '../Icons.jsx'

export default function Canvas({ cards, setCards, zoom = 1 }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(null)
  const drag = useRef(null)
  const surfaceRef = useRef(null)

  const onPointerDownSurface = (e) => {
    if (e.target.closest('[data-card]')) return
    drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    surfaceRef.current?.setPointerCapture?.(e.pointerId)
  }
  const onPointerDownCard = (e, id) => {
    e.stopPropagation()
    setActive(id)
    setCards((cs) => {
      const idx = cs.findIndex((c) => c.id === id)
      const card = cs[idx]
      drag.current = { mode: 'card', id, sx: e.clientX, sy: e.clientY, cx: card.x, cy: card.y }
      const reordered = [...cs.slice(0, idx), ...cs.slice(idx + 1), card]
      return reordered
    })
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / zoom
    const dy = (e.clientY - d.sy) / zoom
    if (d.mode === 'pan') setOffset({ x: d.ox + dx, y: d.oy + dy })
    else setCards((cs) => cs.map((c) => (c.id === d.id ? { ...c, x: d.cx + dx, y: d.cy + dy } : c)))
  }
  const endDrag = () => { drag.current = null }

  return (
    <div
      ref={surfaceRef}
      onPointerDown={onPointerDownSurface}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className="dot-grid relative h-full w-full cursor-grab touch-none overflow-hidden bg-ink-900 active:cursor-grabbing"
    >
      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(138,92,240,0.08),transparent_50%)]" />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {cards.map((c) => (
          <CanvasCard key={c.id} card={c} active={active === c.id} onHeaderDown={onPointerDownCard} />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-ink-800/80 px-3 py-1 text-[11px] text-white/40 backdrop-blur">
        Drag the board to pan · drag a card header to move it
      </div>
    </div>
  )
}

const headTints = {
  initiative: 'text-aether-300',
  map: 'text-amethyst-300',
  npc: 'text-rune-300',
  shop: 'text-rune-300',
  notes: 'text-aether-300',
  roll: 'text-amethyst-300',
  gen: 'text-rune-300',
}
const headIcons = {
  initiative: Swords, map: Map, npc: Skull, shop: Bag, notes: Scroll, roll: Dice, gen: Sparkles,
}

function CanvasCard({ card, active, onHeaderDown }) {
  const Icon = headIcons[card.type] || Scroll
  return (
    <div
      data-card
      className={`absolute select-none rounded-xl border bg-ink-700/95 shadow-panel backdrop-blur transition-shadow ${
        active ? 'border-amethyst-400/50 shadow-glow-violet' : 'border-white/10'
      }`}
      style={{ left: card.x, top: card.y, width: card.w }}
    >
      <div
        onPointerDown={(e) => onHeaderDown(e, card.id)}
        className="flex cursor-grab items-center gap-2 rounded-t-xl border-b border-white/5 bg-ink-800/80 px-3 py-2 active:cursor-grabbing"
      >
        <Icon size={15} className={headTints[card.type]} />
        <span className="truncate text-xs font-semibold text-white/85">{card.title}</span>
        <span className="ml-auto flex gap-1">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
        </span>
      </div>
      <div className="p-3">
        <CardBody card={card} />
      </div>
    </div>
  )
}

function CardBody({ card }) {
  switch (card.type) {
    case 'initiative':
      return <div className="h-72"><InitiativeTracker compact /></div>
    case 'map':
      return <MapCard />
    case 'npc':
      return <NpcCard />
    case 'shop':
      return <ShopCard />
    case 'notes':
      return <NotesCard />
    case 'roll':
      return <RollCard />
    case 'gen':
      return <GenBody card={card} />
    default:
      return null
  }
}

function MapCard() {
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-aether-600/30 via-ink-600 to-ink-700">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-7">
          {Array.from({ length: 70 }).map((_, i) => <div key={i} className="border border-white/5" />)}
        </div>
        {/* tokens */}
        <Token x="22%" y="40%" color="bg-aether-300" label="K" />
        <Token x="35%" y="58%" color="bg-aether-300" label="M" />
        <Token x="64%" y="46%" color="bg-rune-300" label="S" />
        <Token x="72%" y="62%" color="bg-red-400" label="g" />
        <div className="absolute left-2 top-2 rounded bg-ink-900/70 px-1.5 py-0.5 text-[9px] text-white/60">Hollowmere Vault · 5 ft squares</div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 py-1.5 text-[11px] font-semibold text-ink-900">Push to player screen</button>
        <button className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60">Fog</button>
      </div>
    </div>
  )
}
function Token({ x, y, color, label }) {
  return (
    <span
      className={`absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${color} text-[10px] font-bold text-ink-900 ring-2 ring-ink-900/40`}
      style={{ left: x, top: y }}
    >
      {label}
    </span>
  )
}

function NpcCard() {
  return (
    <div>
      <p className="font-display text-base text-white">Water Elemental</p>
      <p className="text-[11px] text-white/45">Large elemental · CR 5 · 1,800 XP</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        {[['AC', '14'], ['HP', '114'], ['Speed', '30/90']].map(([k, v]) => (
          <div key={k} className="rounded-md bg-white/5 py-1">
            <p className="text-[9px] uppercase text-white/40">{k}</p>
            <p className="font-mono text-sm text-white/85">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[9px]">
        {[['STR', '+4'], ['DEX', '+2'], ['CON', '+4'], ['INT', '-3'], ['WIS', '-1'], ['CHA', '-2']].map(([a, m]) => (
          <div key={a} className="rounded bg-white/5 py-0.5">
            <p className="text-white/40">{a}</p>
            <p className="font-mono text-white/80">{m}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1 text-[11px] text-white/60">
        <p><span className="text-amethyst-200">Multiattack</span> — two slams, +7 to hit, 2d8+4 bludgeoning.</p>
        <p><span className="text-amethyst-200">Whelm (4–6)</span> — DC 15 STR, 5d8 bludgeoning, engulf &amp; grapple.</p>
        <p className="text-white/45">Resist nonmagical B/P/S · Immune poison, exhaustion, grappled, prone.</p>
      </div>
    </div>
  )
}

function ShopCard() {
  const rar = { common: 'text-white/60', uncommon: 'text-emerald-300', rare: 'text-aether-200' }
  return (
    <div className="space-y-1.5">
      {shopItems.map((it) => (
        <div key={it.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/85">{it.name}</p>
            <p className={`text-[10px] ${rar[it.rarity]}`}>{it.rarity} · {it.note}</p>
          </div>
          <span className="ml-2 shrink-0 font-mono text-[11px] text-rune-200">{it.price}</span>
        </div>
      ))}
      <button className="mt-1 w-full rounded-lg border border-dashed border-white/10 py-1.5 text-[11px] text-white/45 hover:text-white/70">↻ Reroll stock</button>
    </div>
  )
}

function NotesCard() {
  return (
    <ul className="space-y-1.5 text-[12px] text-white/70">
      {sessionNotes.map((n, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amethyst-300" />
          <span>{n}</span>
        </li>
      ))}
      <li className="flex gap-2 text-white/35">
        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
        <span className="italic">Type to add a note…</span>
      </li>
    </ul>
  )
}

function RollCard() {
  const tables = [
    ['d100', 'Wild Magic Surge (PHB)'],
    ['d100', 'Trinkets (PHB)'],
    ['d20', 'Critical Hit effects'],
    ['d8', 'Magic Item — Table A (DMG)'],
  ]
  return (
    <div className="space-y-1.5">
      {tables.map(([die, name]) => (
        <button key={name} className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-left transition hover:bg-white/[0.07]">
          <span className="text-xs text-white/80">{name}</span>
          <span className="rounded-md bg-amethyst-400/20 px-2 py-0.5 font-mono text-[11px] text-amethyst-100">Roll {die}</span>
        </button>
      ))}
    </div>
  )
}

function GenBody({ card }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-rune-300">{card.gen?.meta}</p>
      <ul className="mt-1.5 space-y-1">
        {(card.gen?.lines || []).map((l) => (
          <li key={l} className="text-[11px] text-white/70">• {l}</li>
        ))}
      </ul>
      <span className="mt-2 inline-block rounded-full bg-amethyst-400/20 px-2 py-0.5 text-[10px] text-amethyst-100">✦ generated by co-DM</span>
    </div>
  )
}
