import { newId } from './generators.js'

// Schema version — bump to invalidate older saved campaigns that may contain
// previously-hardcoded content.
export const CAMPAIGN_VERSION = 2

// Tools start EMPTY. Content (NPCs, shop stock, roll tables, encounters) is
// AI-generated on demand and then persisted; nothing is hardcoded.
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
}

export function makeCard(type, x, y, w) {
  return { id: newId('c'), type, x, y, w, title: TOOL_TITLES[type] || 'Card', data: defaultData(type) }
}

export function defaultCampaign() {
  return {
    v: CAMPAIGN_VERSION,
    cards: [
      makeCard('initiative', 40, 60, 330),
      makeCard('map', 420, 40, 470),
      makeCard('npc', 930, 70, 320),
      makeCard('shop', 70, 470, 350),
      makeCard('notes', 470, 540, 360),
      makeCard('roll', 930, 470, 330),
    ],
    player: { on: false, pushed: null },
  }
}
