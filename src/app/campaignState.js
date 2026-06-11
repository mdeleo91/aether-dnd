import { newId } from './generators.js'

// Schema version — bump to invalidate older saved campaigns that may contain
// previously-hardcoded content or a pre-campaign-system shape.
export const CAMPAIGN_VERSION = 3

// Tools start EMPTY. Content (NPCs, shop stock, roll tables, encounters,
// locations) is AI-generated on demand and then persisted; nothing is hardcoded.
export function defaultData(type) {
  switch (type) {
    case 'initiative':
      return { combatants: [], round: 1, turn: 0 }
    case 'map':
      return { tokens: [], fog: false, name: 'Battle Map' }
    case 'npc':
      return { npc: null }
    case 'shop':
      return { shopType: 'General store', level: 'Standard', shopName: '', items: [] }
    case 'notes':
      return { notes: [] }
    case 'roll':
      return { theme: '', die: 20, table: null, history: [] }
    case 'location':
      return { location: null, kind: '', note: '' }
    case 'party':
      // Party roster lives at the campaign level (shared with initiative); the
      // card is just a view, so it needs no per-card data.
      return {}
    case 'library':
      return { tab: 'npc' }
    default:
      return {}
  }
}

export const TOOL_TITLES = {
  initiative: 'Initiative',
  map: 'Battle Map',
  npc: 'NPC / Statblock',
  shop: 'Shop',
  notes: 'Session Notes',
  roll: 'Roll Table',
  location: 'Location',
  party: 'Party',
  library: 'Library',
}

// A few tools open large enough that a fixed starter height (with internal
// scroll) reads better than auto-growing — e.g. the full character sheet.
const DEFAULT_HEIGHT = { party: 640 }

export function makeCard(type, x, y, w) {
  return { id: newId('c'), type, x, y, w, h: DEFAULT_HEIGHT[type], title: TOOL_TITLES[type] || 'Card', data: defaultData(type) }
}

// A new campaign is a self-contained, Supabase-ready blob. `opts.empty` gives a
// truly clean canvas (used by "New Campaign"); otherwise it seeds the starter
// toolset so the first campaign feels ready to run.
export function defaultCampaign(name = 'New Campaign', opts = {}) {
  return {
    v: CAMPAIGN_VERSION,
    name: name || 'New Campaign',
    cards: opts.empty
      ? []
      : [
          makeCard('initiative', 40, 60, 330),
          makeCard('map', 420, 40, 470),
          makeCard('npc', 930, 70, 320),
          makeCard('party', 70, 470, 600),
          makeCard('notes', 480, 540, 360),
          makeCard('roll', 930, 470, 330),
        ],
    player: { on: false, pushed: null },
    party: [],
    npcLibrary: [],
    locationLibrary: [],
  }
}

// Ensure a loaded campaign has every field the current app expects (older saves
// may predate party / libraries).
export function normalizeCampaign(c, fallbackName = 'Campaign') {
  if (!c || typeof c !== 'object') return defaultCampaign(fallbackName)
  return {
    v: CAMPAIGN_VERSION,
    name: c.name || fallbackName,
    cards: Array.isArray(c.cards) ? c.cards : [],
    player: c.player || { on: false, pushed: null },
    party: Array.isArray(c.party) ? c.party : [],
    npcLibrary: Array.isArray(c.npcLibrary) ? c.npcLibrary : [],
    locationLibrary: Array.isArray(c.locationLibrary) ? c.locationLibrary : [],
  }
}
