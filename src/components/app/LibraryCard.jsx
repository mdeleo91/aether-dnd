import { useState } from 'react'
import { Skull, MapPin, Dragon, Plus, X } from '../Icons.jsx'
import { useConfirm } from './ConfirmDialog.jsx'

// Per-campaign library browser, split into three kinds of saved content:
//   • NPCs      — character/creature entities saved from the NPC card
//   • Bestiary  — monster/enemy stat blocks saved from the Monster card
//   • Locations — places saved from the Location card
// Each row can be re-added to the canvas or removed (with a confirm).
export default function LibraryCard({ lib }) {
  const [tab, setTab] = useState('npc')
  const npcs = lib?.npcLibrary || []
  const monsters = lib?.monsterLibrary || []
  const locs = lib?.locationLibrary || []
  const confirm = useConfirm()

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-white/5 pb-2">
        <Tab active={tab === 'npc'} onClick={() => setTab('npc')} icon={Skull}>NPCs · {npcs.length}</Tab>
        <Tab active={tab === 'monster'} onClick={() => setTab('monster')} icon={Dragon}>Custom · {monsters.length}</Tab>
        <Tab active={tab === 'loc'} onClick={() => setTab('loc')} icon={MapPin}>Locations · {locs.length}</Tab>
      </div>

      <div className="mt-2 flex-1 space-y-1.5 overflow-auto pr-1">
        {tab === 'npc' && (
          npcs.length === 0 ? (
            <Empty>No saved NPCs yet. Generate one on an NPC card and hit <span className="text-amethyst-200">★ Save</span>.</Empty>
          ) : (
            npcs.map((row) => (
              <Row
                key={row.id}
                title={row.npc?.name || 'NPC'}
                meta={[row.npc?.type, row.npc?.cr ? `CR ${row.npc.cr}` : null].filter(Boolean).join(' · ')}
                onAdd={() => lib.addNpcCardFromLibrary(row.npc)}
                onRemove={async () => { if (await confirm({ title: 'Remove NPC?', body: `Remove “${row.npc?.name || 'this NPC'}” from the library? This can't be undone.`, confirmLabel: 'Remove' })) lib.removeNpcFromLibrary(row.id) }}
              />
            ))
          )
        )}

        {tab === 'monster' && (
          monsters.length === 0 ? (
            <Empty>No custom enemies yet. On the <span className="text-rune-200">Enemies</span> card's <span className="text-rune-200">Custom</span> tab, AI-generate a monster and hit <span className="text-rune-200">★ Save</span>. (SRD monsters are native — search them, no saving needed.)</Empty>
          ) : (
            monsters.map((row) => (
              <Row
                key={row.id}
                icon={Dragon}
                accent="rune"
                title={row.monster?.name || 'Monster'}
                meta={[row.monster?.size, row.monster?.type, row.monster?.cr ? `CR ${row.monster.cr}` : null].filter(Boolean).join(' · ')}
                onAdd={() => lib.addMonsterCardFromLibrary(row.monster)}
                onRemove={async () => { if (await confirm({ title: 'Remove monster?', body: `Remove “${row.monster?.name || 'this monster'}” from the Bestiary? This can't be undone.`, confirmLabel: 'Remove' })) lib.removeMonsterFromBestiary(row.id) }}
              />
            ))
          )
        )}

        {tab === 'loc' && (
          locs.length === 0 ? (
            <Empty>No saved locations yet. Generate one on a Location card and hit <span className="text-amethyst-200">★ Save</span>.</Empty>
          ) : (
            locs.map((row) => (
              <Row
                key={row.id}
                icon={MapPin}
                title={row.location?.name || 'Location'}
                meta={row.location?.type || ''}
                onAdd={() => lib.addLocationCardFromLibrary(row.location)}
                onRemove={async () => { if (await confirm({ title: 'Remove location?', body: `Remove “${row.location?.name || 'this location'}” from the library? This can't be undone.`, confirmLabel: 'Remove' })) lib.removeLocationFromLibrary(row.id) }}
              />
            ))
          )
        )}
      </div>

      <p className="mt-2 border-t border-white/5 pt-2 text-[9px] text-white/30">✦ Saved to this campaign · survives refresh</p>
    </div>
  )
}

function Tab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
        active ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/75'
      }`}
    >
      <Icon size={12} /> {children}
    </button>
  )
}

function Row({ title, meta, onAdd, onRemove, icon: Icon, accent }) {
  const addCls = accent === 'rune'
    ? 'bg-rune-400/20 text-rune-100 hover:bg-rune-400/30'
    : 'bg-amethyst-400/20 text-amethyst-100 hover:bg-amethyst-400/30'
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
      {Icon && <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${accent === 'rune' ? 'bg-rune-400/20 text-rune-100' : 'bg-white/5 text-white/50'}`}><Icon size={12} /></span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white/85">{title}</p>
        {meta && <p className="truncate text-[10px] text-white/45">{meta}</p>}
      </div>
      <button onClick={onAdd} title="Add to canvas" className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${addCls}`}>
        <Plus size={11} /> Canvas
      </button>
      <button onClick={onRemove} title="Remove" className="shrink-0 text-white/30 hover:text-red-300"><X size={13} /></button>
    </div>
  )
}

function Empty({ children }) {
  return <p className="px-1 py-4 text-center text-xs leading-relaxed text-white/40">{children}</p>
}
