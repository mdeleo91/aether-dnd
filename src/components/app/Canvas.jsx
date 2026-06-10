import { useEffect, useRef, useState } from 'react'
import InitiativeTracker from './InitiativeTracker.jsx'
import MapCard from './MapCard.jsx'
import NpcCard from './NpcCard.jsx'
import ShopCard from './ShopCard.jsx'
import NotesCard from './NotesCard.jsx'
import RollCard from './RollCard.jsx'
import { Dice, Map, Bag, Scroll, Swords, Skull, Sparkles } from '../Icons.jsx'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.6
const MIN_W = 240
const MIN_H = 150
const MAX_W = 760
const MAX_H = 560

export default function Canvas({ cards, setCards, zoom = 1, setZoom, offset, setOffset, onData, onPush }) {
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

  const removeCard = (id) => setCards((cs) => cs.filter((c) => c.id !== id))
  const toggleMin = (id) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, min: !c.min } : c)))
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

  const onPointerDownSurface = (e) => {
    if (e.button !== 1) return
    if (e.target.closest('[data-card]')) return
    e.preventDefault()
    setPanning(true)
    drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    surfaceRef.current?.setPointerCapture?.(e.pointerId)
  }
  const onHeaderDown = (e, id) => {
    if (e.button !== 0) return
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
            onData={onData}
            onPush={onPush}
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

function CanvasCard({ card, active, onHeaderDown, onResizeDown, onClose, onMin, onMax, onData, onPush }) {
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
      <div
        onPointerDown={(e) => onHeaderDown(e, card.id)}
        onDoubleClick={() => onMax(card.id)}
        className="relative flex h-9 shrink-0 cursor-grab items-center gap-2 border-b border-white/10 bg-ink-800/55 px-3 backdrop-blur-xl active:cursor-grabbing"
      >
        <div className="group/tl flex items-center gap-2" onPointerDown={stop}>
          <button type="button" title="Close" aria-label="Close window" onPointerDown={stop} onClick={(e) => { stop(e); onClose(card.id) }} className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition hover:brightness-110">
            <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">×</span>
          </button>
          <button type="button" title="Minimize" aria-label="Minimize window" onPointerDown={stop} onClick={(e) => { stop(e); onMin(card.id) }} className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-black/20 transition hover:brightness-110">
            <span className="-mt-px text-[9px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">–</span>
          </button>
          <button type="button" title="Zoom" aria-label="Maximize window" onPointerDown={stop} onClick={(e) => { stop(e); onMax(card.id) }} className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-black/20 transition hover:brightness-110">
            <span className="text-[7px] font-bold leading-none text-black/60 opacity-0 group-hover/tl:opacity-100">{card.max ? '–' : '+'}</span>
          </button>
        </div>

        <span className="pointer-events-none absolute left-1/2 flex max-w-[70%] -translate-x-1/2 items-center gap-1.5 truncate text-xs font-medium text-white/70">
          <Icon size={13} className={`${headTints[card.type]} shrink-0`} />
          <span className="truncate">{card.title}</span>
        </span>
      </div>

      {!card.min && (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <CardBody card={card} onData={onData} onPush={onPush} />
        </div>
      )}

      {!card.min && (
        <>
          <div onPointerDown={(e) => startResize(e, 1, 0)} className="absolute right-0 top-9 bottom-3 w-1.5 cursor-ew-resize" />
          <div onPointerDown={(e) => startResize(e, 0, 1)} className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize" />
          <div onPointerDown={(e) => startResize(e, 1, 1)} title="Resize" className="group/rs absolute bottom-0 right-0 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-0.5">
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-white/25 group-hover/rs:text-white/50">
              <path d="M7 1v6H1" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}

function CardBody({ card, onData, onPush }) {
  switch (card.type) {
    case 'initiative':
      return <InitiativeTracker card={card} onData={onData} />
    case 'map':
      return <MapCard card={card} onData={onData} onPush={onPush} />
    case 'npc':
      return <NpcCard card={card} onData={onData} />
    case 'shop':
      return <ShopCard card={card} onData={onData} />
    case 'notes':
      return <NotesCard card={card} onData={onData} />
    case 'roll':
      return <RollCard card={card} onData={onData} />
    case 'gen':
      return <GenBody card={card} />
    default:
      return null
  }
}

// Card spawned by the co-DM ("add to canvas").
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
