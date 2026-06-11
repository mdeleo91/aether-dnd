// D&D 5e MONSTER / ENEMY model — a Monster-Manual-style stat block. This is a
// DIFFERENT entity from the PC/NPC character sheet (see dnd5e.js): monsters use
// the classic stat block (CR, traits/actions/legendary/lair actions, etc.).
//
// Ability MODIFIERS, proficiency bonus (from CR) and XP are computed; everything
// else is stored and freely editable. Mappers bring SRD API monsters (open5e /
// dnd5eapi) and AI-generated monsters into this shape.

export const ABILS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export const num = (v, d = 0) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : d
}

export function abilityMod(score) {
  const n = parseInt(score, 10)
  return Number.isFinite(n) ? Math.floor((n - 10) / 2) : 0
}
export function fmtMod(n) {
  return (n >= 0 ? '+' : '') + n
}

// "1/8" | "1/4" | "1/2" | "5" -> number
export function crToNumber(cr) {
  if (cr == null) return 0
  const s = String(cr).trim()
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number)
    return b ? a / b : 0
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

// Proficiency bonus by Challenge Rating (5e DMG).
export function profBonusForCR(cr) {
  const n = crToNumber(cr)
  if (n <= 4) return 2
  if (n <= 8) return 3
  if (n <= 12) return 4
  if (n <= 16) return 5
  if (n <= 20) return 6
  if (n <= 24) return 7
  if (n <= 28) return 8
  return 9
}

const XP_BY_CR = {
  '0': 10, '0.125': 25, '0.25': 50, '0.5': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
  '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000,
  '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
}
export function xpForCR(cr) {
  const n = crToNumber(cr)
  const xp = XP_BY_CR[String(n)]
  return xp != null ? xp.toLocaleString() : ''
}

// DEX-based initiative modifier for the tracker.
export function monsterInitMod(m) {
  return abilityMod((m.abilities || {}).DEX)
}

// ---- normalization ----------------------------------------------------------
function emptyAbilities() {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
}
function entryList(v) {
  if (!Array.isArray(v)) return []
  return v
    .map((e) => (typeof e === 'string' ? { name: '', desc: e } : { name: e.name || '', desc: e.desc || e.description || e.text || '' }))
    .filter((e) => e.name || e.desc)
}
const asText = (v) => {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.filter(Boolean).join(', ')
  return ''
}

export function normalizeMonster(m = {}) {
  const ab = m.abilities || {}
  const abilities = emptyAbilities()
  ABILS.forEach((k) => { abilities[k] = num(ab[k] ?? ab[k.toLowerCase()], 10) })
  return {
    id: m.id,
    name: m.name || 'New monster',
    size: m.size || 'Medium',
    type: m.type || 'humanoid',
    subtype: m.subtype || '',
    alignment: m.alignment || 'unaligned',
    ac: m.ac ?? '',
    acType: m.acType || m.armorDesc || '',
    hp: m.hp ?? '',
    hitDice: m.hitDice || '',
    speed: m.speed || '',
    abilities,
    saves: asText(m.saves),
    skills: asText(m.skills),
    damageVulnerabilities: asText(m.damageVulnerabilities),
    damageResistances: asText(m.damageResistances),
    damageImmunities: asText(m.damageImmunities),
    conditionImmunities: asText(m.conditionImmunities),
    senses: m.senses || '',
    passivePerception: m.passivePerception ?? (10 + abilityMod(abilities.WIS)),
    languages: m.languages || '',
    cr: m.cr != null ? String(m.cr) : '',
    traits: entryList(m.traits),
    actions: entryList(m.actions),
    bonusActions: entryList(m.bonusActions),
    reactions: entryList(m.reactions),
    legendaryActions: entryList(m.legendaryActions),
    legendaryDescription: m.legendaryDescription || '',
    lairActions: entryList(m.lairActions),
  }
}

export function blankMonster() {
  return normalizeMonster({ name: 'New monster', type: 'humanoid', cr: '1' })
}

// ---- AI mapper --------------------------------------------------------------
export function fromAiMonster(d = {}) {
  return normalizeMonster({
    name: d.name,
    size: d.size,
    type: d.type,
    subtype: d.subtype,
    alignment: d.alignment,
    ac: d.ac ?? d.armorClass,
    acType: d.acType || d.armorDesc,
    hp: d.hp ?? d.hitPoints,
    hitDice: d.hitDice,
    speed: d.speed,
    abilities: d.abilities,
    saves: d.saves || d.savingThrows,
    skills: d.skills,
    damageVulnerabilities: d.damageVulnerabilities,
    damageResistances: d.damageResistances,
    damageImmunities: d.damageImmunities,
    conditionImmunities: d.conditionImmunities,
    senses: d.senses,
    passivePerception: d.passivePerception,
    languages: d.languages,
    cr: d.cr ?? d.challengeRating,
    traits: d.traits || d.specialTraits || d.specialAbilities,
    actions: d.actions,
    bonusActions: d.bonusActions,
    reactions: d.reactions,
    legendaryActions: d.legendaryActions,
    legendaryDescription: d.legendaryDescription || d.legendaryDesc,
    lairActions: d.lairActions,
  })
}

// ---- SRD: open5e mapper -----------------------------------------------------
function speedFromObject(sp) {
  if (!sp) return ''
  if (typeof sp === 'string') return sp
  const parts = []
  if (sp.walk != null) parts.push(`${sp.walk} ft.`)
  ;['burrow', 'climb', 'fly', 'swim'].forEach((k) => {
    if (sp[k] != null) parts.push(`${k} ${sp[k]} ft.${k === 'fly' && sp.hover ? ' (hover)' : ''}`)
  })
  return parts.join(', ')
}
function savesFromOpen5e(d) {
  const map = [['STR', 'strength_save'], ['DEX', 'dexterity_save'], ['CON', 'constitution_save'], ['INT', 'intelligence_save'], ['WIS', 'wisdom_save'], ['CHA', 'charisma_save']]
  return map.filter(([, k]) => d[k] != null).map(([a, k]) => `${a} ${fmtMod(d[k])}`).join(', ')
}
function skillsFromOpen5e(skills) {
  if (!skills || typeof skills !== 'object') return ''
  return Object.entries(skills)
    .map(([k, v]) => `${k.replace(/(^|\s)\S/g, (c) => c.toUpperCase())} ${fmtMod(v)}`)
    .join(', ')
}

export function fromSrdMonster(d = {}) {
  return normalizeMonster({
    name: d.name,
    size: d.size,
    type: d.type,
    subtype: d.subtype,
    alignment: d.alignment,
    ac: d.armor_class,
    acType: d.armor_desc,
    hp: d.hit_points,
    hitDice: d.hit_dice,
    speed: speedFromObject(d.speed),
    abilities: { STR: d.strength, DEX: d.dexterity, CON: d.constitution, INT: d.intelligence, WIS: d.wisdom, CHA: d.charisma },
    saves: savesFromOpen5e(d),
    skills: skillsFromOpen5e(d.skills),
    damageVulnerabilities: d.damage_vulnerabilities,
    damageResistances: d.damage_resistances,
    damageImmunities: d.damage_immunities,
    conditionImmunities: d.condition_immunities,
    senses: d.senses,
    languages: d.languages,
    cr: d.challenge_rating ?? d.cr,
    traits: d.special_abilities,
    actions: d.actions,
    bonusActions: d.bonus_actions,
    reactions: d.reactions,
    legendaryActions: d.legendary_actions,
    legendaryDescription: d.legendary_desc,
  })
}

// ---- SRD: dnd5eapi mapper (fallback; richer/awkward shape) -------------------
export function fromDnd5eApiMonster(d = {}) {
  const acFirst = Array.isArray(d.armor_class) ? d.armor_class[0] : null
  const saves = (d.proficiencies || [])
    .filter((p) => /Saving Throw/i.test(p.proficiency?.name || ''))
    .map((p) => `${(p.proficiency.name.match(/:\s*(\w+)/) || [])[1] || ''} ${fmtMod(p.value)}`)
    .join(', ')
  const skills = (d.proficiencies || [])
    .filter((p) => /Skill/i.test(p.proficiency?.name || ''))
    .map((p) => `${(p.proficiency.name.split(':')[1] || '').trim()} ${fmtMod(p.value)}`)
    .join(', ')
  const speed = d.speed && typeof d.speed === 'object'
    ? Object.entries(d.speed).map(([k, v]) => (k === 'walk' ? v : `${k} ${v}`)).join(', ')
    : asText(d.speed)
  return normalizeMonster({
    name: d.name,
    size: d.size,
    type: d.type,
    subtype: d.subtype,
    alignment: d.alignment,
    ac: acFirst?.value,
    acType: acFirst?.type,
    hp: d.hit_points,
    hitDice: d.hit_dice ? `${d.hit_dice}` : '',
    speed,
    abilities: { STR: d.strength, DEX: d.dexterity, CON: d.constitution, INT: d.intelligence, WIS: d.wisdom, CHA: d.charisma },
    saves,
    skills,
    damageVulnerabilities: asText(d.damage_vulnerabilities),
    damageResistances: asText(d.damage_resistances),
    damageImmunities: asText(d.damage_immunities),
    conditionImmunities: (d.condition_immunities || []).map((c) => c.name).join(', '),
    senses: d.senses ? Object.entries(d.senses).map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`).join(', ') : '',
    passivePerception: d.senses?.passive_perception,
    languages: d.languages,
    cr: d.challenge_rating,
    traits: d.special_abilities,
    actions: d.actions,
    reactions: d.reactions,
    legendaryActions: d.legendary_actions,
  })
}
