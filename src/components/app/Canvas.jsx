import { useEffect, useRef, useState } from 'react'
import InitiativeTracker from './InitiativeTracker.jsx'
import { shopItems, sessionNotes } from '../../data/mock.js'
import { Dice, Map, Bag, Scroll, Swords, Skull, Sparkles } from '../Icons.jsx'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.6
const MIN_W = 240
const MIN_H = 150
const MAX_W = 760
const MAX_H = 560

export default function Canvas({ cards, setCards, zoom = 1, setZoom }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(null)
  const [panning, setPanning] = useState(false)
  const drag = useRef(null)
  const surfaceRef = useRef(null)

  // Ctrl + wheel to zoom (native, non-passive so we can preventDefault).
  useEffect(() => {
    const el = surfaceRef.current
    if (!el || !setZoom) return
    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setZoom])

  // ── Window controls ────────────────────────────────────────────────
  const removeCard = (id) => setCards((cs) => cs.filter((c) => c.id !== id))
  const toggleMin = (id) =>
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, min: !c.min } : c)))
  const toggleMax = (id) =>
    setCards((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c
        if (c.max) return { ...c, max: false, min: false, w: c.restore?.w ?? c.w, h: c.restore?.h }
        return { ...c, max: true, min: false, restore: { w: c.w, h: c.h }, w: MAX_W, h: MAX_H }
      }),
    )
  const bringToFront = (id) =>
    setCards((cs) => {
      const idx = cs.findIndex((c) => c.id === id)
      if (idx < 0) return cs
      return [...cs.slice(0, idx), ...cs.slice(idx + 1), cs[idx]]
    })

  // ── Pointer interactions ───────────────────────────────────────────
  const onPointerDownSurface = (e) => {
    if (e.button !== 1) return // middle button pans
    if (e.target.closest('[data-card]')) return
    e.preventDefault()
    setPanning(true)
    drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    surfaceRef.current?.setPointerCapture?.(e.pointerId)
  }
  const onHeaderDown = (e, id) => {
    if (e.button !== 0) return // left button drags the window
    e.stopPropagation()
    setActive(id)
    bringToFront(id)
    const card = cards.find((c) => c.id === id)
    drag.current = { mode: 'card', id, sx: e.clientX, sy: e.clientY, cx: card.x, cy: card.y }
  }
  const onResizeDown = (e, id, dirX, dirY, h0) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setActive(id)
    bringToFront(id)
    const card = cards.find((c) => c.id === id)
    drag.current = { mode: 'resize', id, sx: e.clientX, sy: e.clientY, w0: card.w, h0, dirX, dirY }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / zoom
    const dy = (e.clientY - d.sy) / zoom
    if (d.mode === 'pan') setOffset({ x: d.ox + dx, y: d.oy + dy })
    else if (d.mode === 'card')
      setCards((cs) => cs.map((c) => (c.id === d.id ? { ...c, x: d.cx + dx, y: d.cy + dy } : c)))
    else if (d.mode === 'resize')
      setCards((cs) =>
        cs.map((c) => {
          if (c.id !== d.id) return c
          const w = d.dirX ? Math.max(MIN_W, Math.round(d.w0 + dx)) : c.w
          const h = d.dirY ? Math.max(MIN_H, Math.round(d.h0 + dy)) : c.h
          return { ...c, w, h, max: false }
        }),
      )
  }
  const endDrag = () => {
    drag.current = null
    setPanning(false)
  }

  return (
    <div
      ref={surfaceRef}
      onPointerDown={onPointerDownSurface}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault() }}
      onAuxClick={(e) => { if (e.button === 1) e.preventDefault() }}
      className={`dot-grid relative h-full w-full touch-none overflow-hidden bg-ink-900 ${panning ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(138,92,240,0.08),transparent_50%)]" />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {cards.map((c) => (
          <CanvasCard
            key={c.id}
            card={c}
            active={active === c.id}
            onHeaderDown={onHeaderDown}
            onResizeDown={onResizeDown}
            onClose={removeCard}
            onMin={toggleMin}
            onMax={toggleMax}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-ink-800/80 px-3 py-1 text-[11px] text-white/40 backdrop-blur">
        Middle-click drag to pan · Ctrl + scroll to zoom · drag the title bar to move · drag edges to resize
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

function CanvasCard({ card, active, onHeaderDown, onResizeDown, onClose, onMin, onMax }) {
  const Icon = headIcons[card.type] || Scroll
  const rootRef = useRef(null)

  const startResize = (e, dirX, dirY) => {
    const h0 = rootRef.current ? rootRef.current.offsetHeight : card.h || 240
    onResizeDown(e, card.id, dirX, dirY, h0)
  }
  const stop = (e) => e.stopPropagation()

  return (
    <div
      ref={rootRef}
      data-card
      className={`absolute flex select-none flex-col overflow-hidden rounded-xl border bg-ink-700/95 shadow-panel transition-shadow ${
        active ? 'border-amethyst-400/50 shadow-glow-violet' : 'border-white/10'
      }`}
      style={{ left: card.x, top: card.y, width: card.w, height: card.min ? undefined : card.h }}
    >
      {/* macOS-style title bar */}
      <div
        onPointerDown={(e) => onHeaderDown(e, card.id)}
        onDoubleClick={() => onMax(card.id)}
        className="relative flex h-9 shrink-0 cursor-grab items-center gap-2 border-b border-white/10 bg-ink-800/55 px-3 backdrop-blur-xl active:cursor-grabbing"
      >
        {/* traffic lights */}
        <div className="group/tl flex items-center gap-2" onPointerDown={stop}>
          <button
            type="button"
            title="Close"
            aria-label="Close window"
            onPointerDown={stop}
            onClick={(e) => { stop(e); onClose(card.id) }}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition hover:brightness-110"
          >
            <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">×</span>
          </button>
          <button
            type="button"
            title="Minimize"
            aria-label="Minimize window"
            onPointerDown={stop}
            onClick={(e) => { stop(e); onMin(card.id) }}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-black/20 transition hover:brightness-110"
          >
            <span className="-mt-px text-[9px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">–</span>
          </button>
          <button
            type="button"
            title="Zoom"
            aria-label="Maximize window"
            onPointerDown={stop}
            onClick={(e) => { stop(e); onMax(card.id) }}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-black/20 transition hover:brightness-110"
          >
            <span className="text-[7px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">{card.max ? '–' : '+'}</span>
          </button>
        </div>

        {/* centered title */}
        <span className="pointer-events-none absolute left-1/2 flex max-w-[70%] -translate-x-1/2 items-center gap-1.5 truncate text-xs font-medium text-white/70">
          <Icon size={13} className={`${headTints[card.type]} shrink-0`} />
          <span className="truncate">{card.title}</span>
        </span>
      </div>

      {/* body */}
      {!card.min && (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <CardBody card={card} />
        </div>
      )}

      {/* resize handles (hidden while minimized) */}
      {!card.min && (
        <>
          <div
            onPointerDown={(e) => startResize(e, 1, 0)}
            className="absolute right-0 top-9 bottom-3 w-1.5 cursor-ew-resize"
          />
          <div
            onPointerDown={(e) => startResize(e, 0, 1)}
            className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize"
          />
          <div
            onPointerDown={(e) => startResize(e, 1, 1)}
            title="Resize"
            className="group/rs absolute bottom-0 right-0 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-0.5"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-white/25 group-hover/rs:text-white/50">
              <path d="M7 1v6H1" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
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
