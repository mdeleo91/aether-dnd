import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Canvas from '../components/app/Canvas.jsx'
import CoGMPanel from '../components/app/CoGMPanel.jsx'
import { canvasCards } from '../data/mock.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import {
  Swords, Map, Dice, Bag, Scroll, Skull, Brain, Users, Search,
  Plus, ChevronRight, Sparkles, Globe, Layers, Expand, Shrink, LogOut,
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
  const [isFs, setIsFs] = useState(false)
  const shellRef = useRef(null)
  const { user, signOut } = useAuth()
  const nav = useNavigate()

  const dmName = user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Dungeon Master')

  // Fullscreen API
  const toggleFullscreen = () => {
    const el = shellRef.current
    if (!document.fullscreenElement) el?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    const onKey = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

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

  const doSignOut = async () => {
    await signOut()
    nav('/login')
  }

  return (
    <div ref={shellRef} className="flex h-screen flex-col overflow-hidden bg-ink-900 text-white">
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
          <button
            onClick={toggleFullscreen}
            title="Toggle fullscreen (F)"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/65 transition hover:text-white"
          >
            {isFs ? <Shrink size={14} /> : <Expand size={14} />}
            <span className="hidden lg:inline">{isFs ? 'Exit full' : 'Fullscreen'}</span>
          </button>
          <button
            onClick={() => setCogmOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              cogmOpen ? 'bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900' : 'border border-amethyst-400/40 text-amethyst-100'
            }`}
          >
            <Brain size={14} /> co-DM
          </button>
          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <span className="hidden text-xs text-white/55 lg:inline">{dmName}</span>
            <button onClick={doSignOut} title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:text-white">
              <LogOut size={14} />
            </button>
          </div>
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
          <Canvas cards={cards} setCards={setCards} zoom={zoom} setZoom={setZoom} />

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
              <Globe size={14} /> Mirroring “Hollowmere Vault” · players join at <span className="font-mono">/join</span>
            </div>
          )}
        </main>

        {/* co-DM PANEL */}
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
    npc: 'NPC — Water Elemental',
    shop: 'Hollowmere Magic Shop',
    notes: 'Session Notes',
    roll: 'Roll Tables',
  }[type] || 'Card'
}
