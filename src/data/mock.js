// Mock data — Dungeons & Dragons 5th Edition (5e) flavored.
// Campaign: "The Sunken Crown" · a party of four level-5 adventurers.

export const combatants = [
  { id: 1, name: 'Kaelen Frostward', kind: 'pc', sub: 'Half-Elf Paladin 5', init: 22, hp: 41, maxHp: 44, ac: 18, status: ['Bless'] },
  { id: 2, name: 'Sahuagin Baron', kind: 'npc', sub: 'CR 5', init: 19, hp: 36, maxHp: 76, ac: 16, status: ['Bloodied'] },
  { id: 3, name: 'Mira Quill', kind: 'pc', sub: 'Halfling Rogue 5 (Arcane Trickster)', init: 17, hp: 33, maxHp: 33, ac: 15, status: [] },
  { id: 4, name: 'Sahuagin (×3)', kind: 'npc', sub: 'CR 1/2', init: 14, hp: 22, maxHp: 22, ac: 12, status: ['Pack Tactics'] },
  { id: 5, name: 'Brother Aldous', kind: 'pc', sub: 'Human Cleric 5 (Tempest)', init: 12, hp: 26, maxHp: 38, ac: 18, status: ['Concentrating'] },
  { id: 6, name: 'Lyra Embermoor', kind: 'pc', sub: 'Tiefling Wizard 5 (Evocation)', init: 11, hp: 28, maxHp: 32, ac: 12, status: [] },
  { id: 7, name: 'Sahuagin Priestess', kind: 'npc', sub: 'CR 2', init: 8, hp: 0, maxHp: 33, ac: 12, status: ['Unconscious'] },
]

export const coGMThread = [
  {
    role: 'gm',
    text: 'The party of four level-5 PCs just opened the flooded vault under Hollowmere. Generate a 5e-balanced boss encounter (~Hard) and give me the statblock.',
  },
  {
    role: 'ai',
    text: 'For a party of four level-5 PCs, a Hard day is ~1,100 XP. A **Sahuagin Baron** (CR 5, 1,800 XP) alone is Deadly, so pair down to a **Water Elemental** (CR 5) as the vault’s bound guardian — a clean single-boss Hard fight.',
    card: {
      title: 'Water Elemental',
      meta: 'Large elemental · CR 5 · 1,800 XP',
      stats: [
        ['AC', '14'],
        ['HP', '114 (12d10 + 48)'],
        ['Speed', '30 ft, swim 90 ft'],
        ['Save DC', '15 (Whelm)'],
      ],
      abilities: [
        'Multiattack — two slam attacks, +7 to hit, 2d8+4 bludgeoning.',
        'Whelm (recharge 4–6) — DC 15 STR save, 5d8 bludgeoning, Large-or-smaller grappled & engulfed.',
        'Water Form — can move through a space as narrow as 1 inch; resistant to nonmagical weapon damage.',
      ],
    },
  },
  {
    role: 'gm',
    text: 'Good. What does it do on initiative 20 if the cleric casts Banishment on it?',
  },
  {
    role: 'ai',
    text: 'Banishment forces a **Charisma save (the elemental’s is +0)** vs the cleric’s spell save DC. On a fail it’s banished to the Elemental Plane of Water for the concentration duration — but it’s native to the Material Plane only if summoned, so if it’s a *bound* guardian it returns to its space when the spell ends. Lean into that: the water drains from the vault, then floods back in a column when it reappears.',
  },
]

export const suggestionChips = [
  'Build a Hard encounter for 4 level-5 PCs',
  'Stat a homebrew CR 3 monster',
  'How does Grappling work in 5e?',
  'Roll a magic item (DMG table F)',
  'Recap last session',
]

// Example "campaign memory" cards shown in the co-DM panel. Intentionally generic
// placeholders — the app does not assume any particular setting.
export const memoryFacts = [
  { tag: 'NPC', text: 'A local official owes the party a favor after they resolved a recent crisis.' },
  { tag: 'Quest', text: 'The party is tracking a faction that wants an artifact they currently hold.' },
  { tag: 'PC', text: 'One PC has a personal oath or vendetta driving their choices.' },
  { tag: 'World', text: 'A recurring regional event is coming up in a few in-game days.' },
  { tag: 'Loot', text: 'An unidentified magic item is pending an Identify (possibly cursed).' },
]

export const shopItems = [
  { name: 'Cloak of the Manta Ray', price: '—', rarity: 'uncommon', note: 'Breathe water, swim 60 ft.' },
  { name: 'Potion of Water Breathing', price: '180 gp', rarity: 'uncommon', note: '1 hour, up to 5 creatures.' },
  { name: '+1 Trident', price: '900 gp', rarity: 'uncommon', note: 'Requires attunement.' },
  { name: 'Driftglobe', price: '750 gp', rarity: 'uncommon', note: 'Casts Light / Daylight.' },
  { name: 'Cap of Water Breathing', price: '400 gp', rarity: 'common', note: 'No attunement.' },
]

export const sessionNotes = [
  'Party (4 × level 5) descended into the flooded Hollowmere vault at dusk.',
  'Mira disarmed the brine-glyph (DEX save trap) — Nat 20 on Thieves’ Tools.',
  'Water Elemental rose from the cistern — Brother Aldous opened with Spirit Guardians.',
  'Kaelen recognized the Drowned Choir’s sigil from his sister’s locket.',
  'Lyra is down to one 3rd-level spell slot; short rest needed.',
]

export const canvasCards = [
  { id: 'init', type: 'initiative', x: 40, y: 60, w: 320, title: 'Initiative — Round 3' },
  { id: 'map', type: 'map', x: 410, y: 40, w: 440, title: 'Hollowmere Vault (5 ft grid)' },
  { id: 'npc', type: 'npc', x: 905, y: 70, w: 300, title: 'Statblock — Water Elemental' },
  { id: 'shop', type: 'shop', x: 70, y: 430, w: 360, title: 'Hollowmere Magic Shop' },
  { id: 'notes', type: 'notes', x: 470, y: 470, w: 360, title: 'Session 12 — Notes' },
  { id: 'roll', type: 'roll', x: 880, y: 440, w: 300, title: 'Roll Tables' },
]

export const tiers = [
  {
    name: 'Adventurer',
    tagline: 'For solo prep & one-shots',
    price: 0,
    period: 'forever',
    accent: 'from-white/10 to-white/5',
    cta: 'Start free',
    highlight: false,
    features: [
      'Infinite canvas (1 campaign)',
      '5e initiative tracker & dice roller',
      'Magic shop & NPC generators',
      '25 AI co-DM prompts / month',
      'Local-first autosave',
    ],
  },
  {
    name: 'Archmage',
    tagline: 'For weekly 5e campaigns',
    price: 12,
    period: 'per month',
    accent: 'from-aether-300/30 to-amethyst-400/30',
    cta: 'Start 14-day trial',
    highlight: true,
    features: [
      'Everything in Adventurer',
      'Unlimited campaigns & canvases',
      'Unlimited AI co-DM (5e NPCs, lore, encounters)',
      'CR-balanced 5e encounter builder',
      'Campaign Memory assistant',
      'Dual-screen player map display',
      '5e SRD rules lookup (spells, conditions, actions)',
    ],
  },
  {
    name: 'Worldsmith',
    tagline: 'For pro DMs & playtest tables',
    price: 29,
    period: 'per month',
    accent: 'from-rune-300/25 to-amethyst-400/25',
    cta: 'Start 14-day trial',
    highlight: false,
    features: [
      'Everything in Archmage',
      'Shared campaigns & co-DM seats (up to 5)',
      'Custom AI lore-tuning on your setting',
      'Homebrew 5e statblock builder & importer',
      'Player-facing handout publishing',
      'Priority generation & early features',
    ],
  },
]

export const testimonials = [
  {
    quote:
      'I asked for a Deadly encounter for my four level-7 PCs and AETHER handed me a balanced statblock with tactics. It reads my campaign notes like a co-DM who never sleeps.',
    name: 'Dana R.',
    role: 'Forever DM · 5e West Marches',
  },
  {
    quote:
      'Mid-combat rules calls used to stall my table. Now I just ask “how does Grappling work?” and get the 5e rule with the page. Prep dropped to 20 minutes a session.',
    name: 'Marcus T.',
    role: 'Professional 5e DM',
  },
  {
    quote:
      'The infinite canvas replaced three apps, and the AI co-DM improvised a villain monologue my players still quote. It never contradicts my own lore.',
    name: 'Priya S.',
    role: 'Homebrew 5e worldbuilder',
  },
]

export const compareRows = [
  { feature: 'Infinite-canvas workspace', legacy: true, aether: true },
  { feature: '5e initiative tracker & dice', legacy: true, aether: true },
  { feature: 'Magic shop & NPC generators', legacy: true, aether: true },
  { feature: 'Dual-screen player map', legacy: true, aether: true },
  { feature: 'Works fully offline / local-first', legacy: 'full', aether: 'partial' },
  { feature: 'No account required', legacy: true, aether: false },
  { feature: 'AI co-DM (NPCs, lore, dialogue)', legacy: false, aether: true },
  { feature: 'CR-balanced 5e encounter builder', legacy: false, aether: true },
  { feature: 'D&D 5e monster & statblock library', legacy: false, aether: true },
  { feature: '5e SRD rules lookup (natural language)', legacy: false, aether: true },
  { feature: 'Campaign Memory assistant', legacy: false, aether: true },
  { feature: 'Cloud sync across devices', legacy: false, aether: true },
]
