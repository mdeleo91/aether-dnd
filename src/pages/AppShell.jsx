import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Canvas from '../components/app/Canvas.jsx'
import CoGMPanel from '../components/app/CoGMPanel.jsx'
import PartyModal from '../components/app/PartyModal.jsx'
import { ConfirmProvider, useConfirm } from '../components/app/ConfirmDialog.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import {
  loadCampaignsIndex, saveCampaignsIndex, loadCampaign, saveCampaign,
  saveCampaignNow, deleteCampaign, loadLegacyCampaign,
} from '../lib/storage.js'
import { publishPlayer } from '../lib/playerSync.js'
import { defaultCampaign, normalizeCampaign, makeCard, CAMPAIGN_VERSION } from '../app/campaignState.js'
import { newId } from '../app/generators.js'
import {
  Swords, Map, Dice, Scroll, Skull, Brain, Users, Search, MapPin, Book, Bag, Dragon,
  Plus, ChevronRight, Sparkles, Globe, Expand, Shrink, LogOut, X, Check,
} from '../components/Icons.jsx'

const tools = [
  { type: 'initiative', icon: Swords, label: 'Initiative', w: 330 },
  { type: 'map', icon: Map, label: 'Battle Map', w: 470 },
  { type: 'party', icon: Users, label: 'Party', w: 600, modal: true },
  { type: 'npc', icon: Skull, label: 'NPC', w: 320 },
  { type: 'monster', icon: Dragon, label: 'Monster / Enemy', w: 380 },
  { type: 'location', icon: MapPin, label: 'Location', w: 340 },
  { type: 'library', icon: Book, label: 'Library', w: 320 },
  { type: 'shop', icon: Bag, label: 'Shop', w: 350 },
  { type: 'notes', icon: Scroll, label: 'Notes', w: 360 },
  { type: 'roll', icon: Dice, label: 'Roll Table', w: 330 },
]

// Load (and, on first run, seed/migrate) a user's campaigns index + current
// campaign. Idempotent — safe to call again when the user id changes.
function bootstrap(userKey) {
  let index = loadCampaignsIndex(userKey)
  if (!index || !Array.isArray(index.campaigns) || index.campaigns.length === 0) {
    const legacy = loadLegacyCampaign(userKey)
    const id = newId('camp')
    const seed =
      legacy && legacy.cards
        ? normalizeCampaign({ ...legacy, name: legacy.name || 'My Campaign' }, 'My Campaign')
        : defaultCampaign('My Campaign')
    saveCampaignNow(userKey, id, seed)
    index = { campaigns: [{ id, name: seed.name, createdAt: Date.now() }], currentId: id }
    saveCampaignsIndex(userKey, index)
    return { index, campaign: seed }
  }
  if (!index.currentId || !index.campaigns.find((c) => c.id === index.currentId)) {
    index.currentId = index.campaigns[0].id
  }
  const meta = index.campaigns.find((c) => c.id === index.currentId)
  const loaded = loadCampaign(userKey, index.currentId)
  const campaign =
    loaded && loaded.v === CAMPAIGN_VERSION
      ? normalizeCampaign(loaded, meta?.name)
      : normalizeCampaign(loaded, meta?.name) // normalize older shapes too
  return { index, campaign }
}

export default function AppShell() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const userKey = user?.id || 'guest'

  const boot = useRef(null)
  if (!boot.current) boot.current = bootstrap(userKey)

  const [index, setIndex] = useState(boot.current.index)
  const [campaign, setCampaign] = useState(boot.current.campaign)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cogmOpen, setCogmOpen] = useState(true)
  const [isFs, setIsFs] = useState(false)
  const [palette, setPalette] = useState(false)
  const [partyOpen, setPartyOpen] = useState(false)
  const shellRef = useRef(null)
  const mainRef = useRef(null)

  const currentId = index.currentId
  const cards = campaign.cards
  const openTypes = new Set(cards.map((c) => c.type))
  const player = campaign.player || { on: false, pushed: null }
  const dmName = user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Dungeon Master')
  const currentName = index.campaigns.find((c) => c.id === currentId)?.name || campaign.name || 'Campaign'

  // Re-bootstrap if the signed-in user changes (keys are per-user).
  const lastUser = useRef(userKey)
  useEffect(() => {
    if (lastUser.current === userKey) return
    lastUser.current = userKey
    const b = bootstrap(userKey)
    setIndex(b.index)
    setCampaign(b.campaign)
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }, [userKey])

  // Persist the active campaign (debounced) on every edit.
  useEffect(() => {
    saveCampaign(userKey, currentId, campaign)
  }, [campaign, userKey, currentId])

  const persistIndex = (next) => { setIndex(next); saveCampaignsIndex(userKey, next) }

  // ---- card helpers -------------------------------------------------------
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

  // Is at least part of a card within the canvas viewport (accounting for pan/zoom)?
  const isCardVisible = (card) => {
    const el = mainRef.current
    if (!el) return true
    const vw = el.clientWidth
    const vh = el.clientHeight
    const sx = offset.x + card.x * zoom
    const sy = offset.y + card.y * zoom
    const sw = (card.w || 300) * zoom
    const sh = (card.h || 240) * zoom
    const m = 24 // require a bit more than an edge sliver to count as "visible"
    return sx < vw - m && sx + sw > m && sy < vh - m && sy + sh > m
  }

  // Sidebar tools toggle a SINGLE instance:
  //  - not on canvas      -> open it
  //  - open & visible     -> close it (toggle off)
  //  - minimized/off-screen -> bring it to focus (don't duplicate, don't lose it)
  const toggleTool = (type, w) => {
    const existing = cards.find((c) => c.type === type)
    if (!existing) { spawn(type, w); return }
    if (existing.min || !isCardVisible(existing)) { focusCard(existing.id); return }
    setCards((cs) => cs.filter((c) => c.id !== existing.id))
  }

  // ---- campaign-level state (party + libraries), passed to cards as `lib` --
  const lib = useMemo(() => ({
    party: campaign.party || [],
    npcLibrary: campaign.npcLibrary || [],
    monsterLibrary: campaign.monsterLibrary || [],
    locationLibrary: campaign.locationLibrary || [],
    addPartyMember: (m) => setCampaign((c) => ({ ...c, party: [...(c.party || []), { id: newId('pc'), ...m }] })),
    updatePartyMember: (id, patch) => setCampaign((c) => ({ ...c, party: (c.party || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    removePartyMember: (id) => setCampaign((c) => ({ ...c, party: (c.party || []).filter((p) => p.id !== id) })),
    saveNpcToLibrary: (npc) => setCampaign((c) => ({ ...c, npcLibrary: [{ id: newId('npc'), savedAt: Date.now(), npc }, ...(c.npcLibrary || [])] })),
    removeNpcFromLibrary: (id) => setCampaign((c) => ({ ...c, npcLibrary: (c.npcLibrary || []).filter((n) => n.id !== id) })),
    saveMonsterToBestiary: (monster) => setCampaign((c) => ({ ...c, monsterLibrary: [{ id: newId('mon'), savedAt: Date.now(), monster }, ...(c.monsterLibrary || [])] })),
    removeMonsterFromBestiary: (id) => setCampaign((c) => ({ ...c, monsterLibrary: (c.monsterLibrary || []).filter((m) => m.id !== id) })),
    saveLocationToLibrary: (location) => setCampaign((c) => ({ ...c, locationLibrary: [{ id: newId('loc'), savedAt: Date.now(), location }, ...(c.locationLibrary || [])] })),
    removeLocationFromLibrary: (id) => setCampaign((c) => ({ ...c, locationLibrary: (c.locationLibrary || []).filter((l) => l.id !== id) })),
    addNpcCardFromLibrary: (npc) => setCards((cs) => [...cs, { ...makeCard('npc', 160 + Math.random() * 160, 140 + Math.random() * 120, 320), data: { npc } }]),
    addMonsterCardFromLibrary: (monster) => setCards((cs) => [...cs, { ...makeCard('monster', 160 + Math.random() * 160, 140 + Math.random() * 120, 380), data: { monster, mode: 'search', query: '', results: [] } }]),
    addLocationCardFromLibrary: (location) => setCards((cs) => [...cs, { ...makeCard('location', 160 + Math.random() * 160, 140 + Math.random() * 120, 340), data: { location, kind: '', note: '' } }]),
  }), [campaign.party, campaign.npcLibrary, campaign.monsterLibrary, campaign.locationLibrary])

  // ---- campaign operations ------------------------------------------------
  const switchCampaign = (id) => {
    if (id === currentId) return
    saveCampaignNow(userKey, currentId, campaign)
    const meta = index.campaigns.find((c) => c.id === id)
    const loaded = loadCampaign(userKey, id)
    setCampaign(normalizeCampaign(loaded, meta?.name))
    persistIndex({ ...index, currentId: id })
    setOffset({ x: 0, y: 0 }); setZoom(1); setPalette(false)
  }
  const createCampaign = (name) => {
    saveCampaignNow(userKey, currentId, campaign)
    const id = newId('camp')
    const fresh = defaultCampaign(name || 'New Campaign', { empty: true })
    saveCampaignNow(userKey, id, fresh)
    setCampaign(fresh)
    persistIndex({ campaigns: [...index.campaigns, { id, name: fresh.name, createdAt: Date.now() }], currentId: id })
    setOffset({ x: 0, y: 0 }); setZoom(1)
  }
  const renameCampaign = (id, name) => {
    if (!name) return
    persistIndex({ ...index, campaigns: index.campaigns.map((c) => (c.id === id ? { ...c, name } : c)) })
    if (id === currentId) setCampaign((c) => ({ ...c, name }))
  }
  const deleteCampaignById = (id) => {
    if (index.campaigns.length <= 1) return
    deleteCampaign(userKey, id)
    const remaining = index.campaigns.filter((c) => c.id !== id)
    let nextCurrent = currentId
    if (id === currentId) {
      nextCurrent = remaining[0].id
      const loaded = loadCampaign(userKey, nextCurrent)
      setCampaign(normalizeCampaign(loaded, remaining[0].name))
      setOffset({ x: 0, y: 0 }); setZoom(1)
    }
    persistIndex({ campaigns: remaining, currentId: nextCurrent })
  }

  // ---- player display -----------------------------------------------------
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

  // ---- fullscreen + shortcuts --------------------------------------------
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
    <ConfirmProvider>
    <div ref={shellRef} className="flex h-screen flex-col overflow-hidden bg-ink-900 text-white">
      {/* TOP BAR */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-ink-800/80 px-3 backdrop-blur">
        <Logo withWordmark={false} />
        <CampaignMenu
          campaigns={index.campaigns}
          currentId={currentId}
          currentName={currentName}
          onSwitch={switchCampaign}
          onCreate={createCampaign}
          onRename={renameCampaign}
          onDelete={deleteCampaignById}
        />

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
        <aside className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-white/5 bg-ink-800/60 py-3 lg:w-48 lg:items-stretch lg:px-3">
          <p className="hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 lg:block">Tools</p>
          {tools.map((t) => {
            const open = t.modal ? partyOpen : openTypes.has(t.type)
            return (
              <button
                key={t.type}
                onClick={() => (t.modal ? setPartyOpen((o) => !o) : toggleTool(t.type, t.w))}
                title={open ? `${t.label} is open — click to close` : t.modal ? `Open ${t.label}` : `Add ${t.label}`}
                aria-pressed={open}
                className={`group flex items-center gap-3 rounded-lg p-2.5 transition lg:px-3 ${
                  open ? 'bg-amethyst-400/15 text-amethyst-100 ring-1 ring-inset ring-amethyst-400/30' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <t.icon size={18} className="shrink-0" />
                <span className="hidden text-sm lg:block">{t.label}</span>
                {open ? (
                  <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-amethyst-300 lg:block" title="On canvas" />
                ) : (
                  <Plus size={14} className="ml-auto hidden text-white/30 group-hover:text-amethyst-200 lg:block" />
                )}
              </button>
            )
          })}
          <div className="mx-2 my-2 h-px bg-white/5" />
          <a href="/join" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-2.5 text-white/60 transition hover:bg-white/5 hover:text-white lg:px-3">
            <Globe size={18} /> <span className="hidden text-sm lg:block">Player link</span>
          </a>

          <div className="mt-auto hidden lg:block">
            <Link to="/pricing" className="flex items-center gap-2 rounded-lg border border-amethyst-400/30 bg-amethyst-400/10 p-2.5 text-xs text-amethyst-100">
              <Sparkles size={14} /> <span>Trial · 11 days left</span>
            </Link>
          </div>
        </aside>

        {/* CANVAS */}
        <main ref={mainRef} className="relative min-w-0 flex-1">
          <Canvas cards={cards} setCards={setCards} zoom={zoom} setZoom={setZoom} offset={offset} setOffset={setOffset} onData={onData} onPush={pushToPlayer} lib={lib} />

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
      {partyOpen && <PartyModal lib={lib} onClose={() => setPartyOpen(false)} />}
    </div>
    </ConfirmProvider>
  )
}

// Campaign picker: shows the current campaign, lists all campaigns, and lets you
// create / switch / rename / delete. New campaigns start as a clean slate.
function CampaignMenu({ campaigns, currentId, currentName, onSwitch, onCreate, onRename, onDelete }) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef(null)
  const confirm = useConfirm()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const create = () => {
    const name = newName.trim() || `Campaign ${campaigns.length + 1}`
    onCreate(name)
    setNewName('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5"
      >
        <span className="text-white/40">Campaign</span>
        <ChevronRight size={13} className="rotate-90 text-white/30" />
        <span className="max-w-[180px] truncate font-medium text-white/90">{currentName}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-panel">
          <div className="max-h-64 overflow-auto p-1.5">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Your campaigns</p>
            {campaigns.map((c) => (
              <div key={c.id} className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 ${c.id === currentId ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                <button onClick={() => { onSwitch(c.id); setOpen(false) }} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {c.id === currentId ? <Check size={13} className="shrink-0 text-aether-300" /> : <span className="w-[13px] shrink-0" />}
                  <span className="truncate text-sm text-white/85">{c.name}</span>
                </button>
                <button
                  onClick={() => { const n = window.prompt('Rename campaign', c.name); if (n && n.trim()) onRename(c.id, n.trim()) }}
                  title="Rename"
                  className="rounded px-1 text-[10px] text-white/30 opacity-0 transition hover:text-white group-hover:opacity-100"
                >Rename</button>
                {campaigns.length > 1 && (
                  <button
                    onClick={async () => { if (await confirm({ title: 'Delete campaign?', body: `Delete “${c.name}” and everything in it? This can't be undone.`, confirmLabel: 'Delete campaign' })) onDelete(c.id) }}
                    title="Delete"
                    className="rounded px-1 text-white/25 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                  ><X size={12} /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-t border-white/10 p-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') create() }}
              placeholder="New campaign name…"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
            />
            <button onClick={create} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-aether-300 to-amethyst-400 px-2.5 py-1.5 text-xs font-semibold text-ink-900 transition hover:brightness-110">
              <Plus size={13} /> New
            </button>
          </div>
        </div>
      )}
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
