import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Canvas from '../components/app/Canvas.jsx'
import CoGMPanel from '../components/app/CoGMPanel.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { loadCampaign, saveCampaign } from '../lib/storage.js'
import { publishPlayer } from '../lib/playerSync.js'
import { defaultCampaign, makeCard, CAMPAIGN_VERSION } from '../app/campaignState.js'
import { newId } from '../app/generators.js'
import {
  Swords, Map, Dice, Bag, Scroll, Skull, Brain, Users, Search,
  Plus, ChevronRight, Sparkles, Globe, Layers, Expand, Shrink, LogOut, X,
} from '../components/Icons.jsx'

const tools = [
  { type: 'initiative', icon: Swords, label: 'Initiative', w: 330 },
  { type: 'map', icon: Map, label: 'Battle Map', w: 470 },
  { type: 'npc', icon: Skull, label: 'NPC', w: 320 },
  { type: 'shop', icon: Bag, label: 'Shop', w: 350 },
  { type: 'notes', icon: Scroll, label: 'Notes', w: 360 },
  { type: 'roll', icon: Dice, label: 'Roll Table', w: 330 },
]

export default function AppShell() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const userKey = user?.id || 'guest'

  const [campaign, setCampaign] = useState(() => {
    const saved = loadCampaign(userKey)
    return saved && saved.v === CAMPAIGN_VERSION ? saved : defaultCampaign()
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cogmOpen, setCogmOpen] = useState(true)
  const [isFs, setIsFs] = useState(false)
  const [palette, setPalette] = useState(false)
  const shellRef = useRef(null)

  const cards = campaign.cards
  const player = campaign.player || { on: false, pushed: null }
  const dmName = user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Dungeon Master')

  // Persist the whole campaign (cards + data + player) per user.
  useEffect(() => {
    saveCampaign(userKey, campaign)
  }, [campaign, userKey])

  const setCards = (updater) =>
    setCampaign((c) => ({ ...c, cards: typeof updater === 'function' ? updater(c.cards) : updater }))
  const onData = (id, patch) =>
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, data: { ...c.data, ...patch } } : c)))

  const spawn = (type, w) => {
    const card = makeCard(type, 120 + Math.random() * 160, 120 + Math.random() * 120, w || 330)
    setCards((cs) => [...cs, card])
  }
  const spawnGen = (g) => {
    setCards((cs) => [
      ...cs,
      { id: newId('c'), type: 'gen', w: 300, x: 200 + Math.random() * 140, y: 180 + Math.random() * 100, title: g.title, gen: { meta: g.meta, lines: g.lines } },
    ])
  }
  const focusCard = (id) => {
    setOffset({ x: 0, y: 0 })
    setCards((cs) => {
      const idx = cs.findIndex((c) => c.id === id)
      if (idx < 0) return cs
      const c = { ...cs[idx], x: 60, y: 64, min: false }
      return [...cs.slice(0, idx), ...cs.slice(idx + 1), c]
    })
    setPalette(false)
  }

  // Player display
  const pushToPlayer = (payload) => {
    setCampaign((c) => ({ ...c, player: { on: true, pushed: payload } }))
    publishPlayer({ on: true, ...payload })
  }
  const togglePlayer = () =>
    setCampaign((c) => {
      const on = !c.player?.on
      publishPlayer({ on, ...(c.player?.pushed || {}) })
      return { ...c, player: { ...(c.player || {}), on } }
    })

  // Fullscreen + keyboard shortcuts
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) shellRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }
  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    const onKey = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPalette((p) => !p)
        return
      }
      if (e.key === 'Escape') setPalette(false)
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

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
          <button onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-2.5 py-1.5 text-xs text-white/45 transition hover:text-white/80 md:flex">
            <Search size={13} /> <span>Search canvas</span> <kbd className="ml-3 rounded bg-white/5 px-1 text-[10px]">⌘K</kbd>
          </button>
          <button onClick={togglePlayer} className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition sm:flex ${player.on ? 'border-aether-300/50 bg-aether-300/15 text-aether-100' : 'border-white/10 text-white/65 hover:text-white'}`}>
            <Globe size={14} /> Player display {player.on ? 'on' : 'off'}
          </button>
          <button onClick={toggleFullscreen} title="Toggle fullscreen (F)" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/65 transition hover:text-white">
            {isFs ? <Shrink size={14} /> : <Expand size={14} />}
            <span className="hidden lg:inline">{isFs ? 'Exit full' : 'Fullscreen'}</span>
          </button>
          <button onClick={() => setCogmOpen((o) => !o)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${cogmOpen ? 'bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900' : 'border border-amethyst-400/40 text-amethyst-100'}`}>
            <Brain size={14} /> co-DM
          </button>
          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <span className="hidden text-xs text-white/55 lg:inline">{dmName}</span>
            <button onClick={doSignOut} title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:text-white"><LogOut size={14} /></button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* LEFT RAIL */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-white/5 bg-ink-800/60 py-3 lg:w-48 lg:items-stretch lg:px-3">
          <p className="hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 lg:block">Add to canvas</p>
          {tools.map((t) => (
            <button key={t.type} onClick={() => spawn(t.type, t.w)} title={`Add ${t.label}`} className="group flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3">
              <t.icon size={18} className="shrink-0" />
              <span className="hidden text-sm lg:block">{t.label}</span>
              <Plus size={14} className="ml-auto hidden text-white/30 group-hover:text-amethyst-200 lg:block" />
            </button>
          ))}
          <div className="mx-2 my-2 h-px bg-white/5" />
          <a href="/join" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3">
            <Users size={18} /> <span className="hidden text-sm lg:block">Player link</span>
          </a>
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
          <Canvas cards={cards} setCards={setCards} zoom={zoom} setZoom={setZoom} offset={offset} setOffset={setOffset} onData={onData} onPush={pushToPlayer} />

          <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-ink-800/80 backdrop-blur">
            {[['+', () => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))],
              [Math.round(zoom * 100) + '%', () => { setZoom(1); setOffset({ x: 0, y: 0 }) }],
              ['−', () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))]].map(([l, fn], i) => (
              <button key={i} onClick={fn} className="px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">{l}</button>
            ))}
          </div>

          {player.on && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-aether-300/40 bg-aether-300/15 px-3 py-1.5 text-xs text-aether-100 shadow-glow">
              <Globe size={14} /> Player display live · open <span className="font-mono">/play</span> {player.pushed?.name ? `· showing “${player.pushed.name}”` : ''}
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

      {palette && <CommandPalette cards={cards} onClose={() => setPalette(false)} onFocus={focusCard} onSpawn={(t) => { spawn(t, tools.find((x) => x.type === t)?.w); setPalette(false) }} />}
    </div>
  )
}

function CommandPalette({ cards, onClose, onFocus, onSpawn }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const filteredCards = useMemo(
    () => cards.filter((c) => !query || (c.title || '').toLowerCase().includes(query) || (c.type || '').includes(query)),
    [cards, query],
  )
  const addable = tools.filter((t) => !query || t.label.toLowerCase().includes(query) || t.type.includes(query))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search size={16} className="text-white/40" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards or type a tool to add…" className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none" />
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16} /></button>
        </div>
        <div className="max-h-[50vh] overflow-auto p-2">
          {filteredCards.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Jump to card</p>
              {filteredCards.map((c) => (
                <button key={c.id} onClick={() => onFocus(c.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 transition hover:bg-white/5">
                  <span className="text-white/40">{c.title || c.type}</span>
                </button>
              ))}
            </div>
          )}
          <div>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Add to canvas</p>
            {addable.map((t) => (
              <button key={t.type} onClick={() => onSpawn(t.type)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 transition hover:bg-white/5">
                <t.icon size={15} className="text-amethyst-200" /> Add {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
