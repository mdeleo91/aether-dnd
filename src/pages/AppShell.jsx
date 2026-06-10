import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Canvas from '../components/app/Canvas.jsx'
import CoGMPanel from '../components/app/CoGMPanel.jsx'
import { canvasCards } from '../data/mock.js'
import {
  Swords, Map, Dice, Bag, Scroll, Skull, Brain, Users, Search,
  Plus, ChevronRight, Sparkles, Globe, Layers,
} from '../components/Icons.jsx'

const tools = [
  { type: 'initiative', icon: Swords, label: 'Initiative', w: 320 },
  { type: 'map', icon: Map, label: 'Battle Map', w: 440 },
  { type: 'npc', icon: Skull, label: 'NPC', w: 300 },
  { type: 'shop', icon: Bag, label: 'Shop', w: 360 },
  { type: 'notes', icon: Scroll, label: 'Notes', w: 360 },
  { type: 'roll', icon: Dice, label: 'Roll Tables', w: 300 },
]

let idc = 100

export default function AppShell() {
  const [cards, setCards] = useState(canvasCards)
  const [cogmOpen, setCogmOpen] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [player, setPlayer] = useState(false)

  const spawn = (type, w) => {
    idc += 1
    const id = `c${idc}`
    setCards((cs) => [
      ...cs,
      { id, type, w: w || 320, x: 120 + Math.random() * 160, y: 120 + Math.random() * 120, title: labelFor(type) },
    ])
  }
  const spawnGen = (genCard) => {
    idc += 1
    setCards((cs) => [
      ...cs,
      {
        id: `c${idc}`,
        type: 'gen',
        w: 300,
        x: 200 + Math.random() * 140,
        y: 180 + Math.random() * 100,
        title: genCard.title,
        gen: { meta: genCard.meta, lines: genCard.lines },
      },
    ])
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-900 text-white">
      {/* TOP BAR */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-ink-800/80 px-3 backdrop-blur">
        <Logo withWordmark={false} />
        <div className="hidden items-center gap-1.5 text-sm sm:flex">
          <span className="text-white/40">Campaigns</span>
          <ChevronRight size={14} className="text-white/25" />
          <span className="font-medium text-white/90">The Sunken Crown</span>
          <span className="ml-1.5 rounded-md bg-amethyst-400/20 px-1.5 py-0.5 text-[10px] text-amethyst-100">Session 12</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-2.5 py-1.5 text-xs text-white/40 md:flex">
            <Search size={13} /> <span>Search canvas</span> <kbd className="ml-3 rounded bg-white/5 px-1 text-[10px]">⌘K</kbd>
          </div>
          <button
            onClick={() => setPlayer((p) => !p)}
            className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition sm:flex ${
              player ? 'border-aether-300/50 bg-aether-300/15 text-aether-100' : 'border-white/10 text-white/65 hover:text-white'
            }`}
          >
            <Globe size={14} /> Player display {player ? 'on' : 'off'}
          </button>
          <div className="flex -space-x-2">
            {['K', 'M', 'A'].map((p, i) => (
              <span key={p} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink-800 text-[11px] font-semibold ${['bg-aether-500/60', 'bg-amethyst-500/60', 'bg-rune-400/60'][i]}`}>{p}</span>
            ))}
          </div>
          <button
            onClick={() => setCogmOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              cogmOpen ? 'bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900' : 'border border-amethyst-400/40 text-amethyst-100'
            }`}
          >
            <Brain size={14} /> co-DM
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* LEFT RAIL */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-white/5 bg-ink-800/60 py-3 lg:w-48 lg:items-stretch lg:px-3">
          <p className="hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 lg:block">Add to canvas</p>
          {tools.map((t) => (
            <button
              key={t.type}
              onClick={() => spawn(t.type, t.w)}
              title={`Add ${t.label}`}
              className="group flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3"
            >
              <t.icon size={18} className="shrink-0" />
              <span className="hidden text-sm lg:block">{t.label}</span>
              <Plus size={14} className="ml-auto hidden text-white/30 group-hover:text-amethyst-200 lg:block" />
            </button>
          ))}
          <div className="mx-2 my-2 h-px bg-white/5" />
          <button className="flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3">
            <Users size={18} /> <span className="hidden text-sm lg:block">Party</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3">
            <Layers size={18} /> <span className="hidden text-sm lg:block">Scenes</span>
          </button>

          <div className="mt-auto hidden lg:block">
            <Link to="/pricing" className="flex items-center gap-2 rounded-lg border border-amethyst-400/30 bg-amethyst-400/10 p-2.5 text-xs text-amethyst-100">
              <Sparkles size={14} /> <span>Trial · 11 days left</span>
            </Link>
          </div>
        </aside>

        {/* CANVAS */}
        <main className="relative min-w-0 flex-1">
          <Canvas cards={cards} setCards={setCards} zoom={zoom} />

          {/* Zoom controls */}
          <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-ink-800/80 backdrop-blur">
            {[['+', () => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))],
              [Math.round(zoom * 100) + '%', () => setZoom(1)],
              ['−', () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))]].map(([l, fn], i) => (
              <button key={i} onClick={fn} className="px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">{l}</button>
            ))}
          </div>

          {/* Player display indicator */}
          {player && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-aether-300/40 bg-aether-300/15 px-3 py-1.5 text-xs text-aether-100 shadow-glow">
              <Globe size={14} /> Mirroring “Hollowmere Vault” to the player screen
            </div>
          )}
        </main>

        {/* co-GM PANEL */}
        {cogmOpen && (
          <aside className="hidden w-[340px] shrink-0 border-l border-white/5 md:block">
            <CoGMPanel onSpawnCard={spawnGen} />
          </aside>
        )}
      </div>
    </div>
  )
}

function labelFor(type) {
  return {
    initiative: 'Initiative — Round 3',
    map: 'Battle Map',
    npc: 'NPC — Tide-Bound Sentinel',
    shop: 'Dock Market',
    notes: 'Session Notes',
    roll: 'Roll Tables',
  }[type] || 'Card'
}
