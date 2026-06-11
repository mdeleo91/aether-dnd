// D&D 5e character sheet model + deterministic computations.
//
// A party member is a full 5e sheet. Base fields are stored; derived values
// (ability modifiers, proficiency bonus, save/skill totals, passive perception)
// are computed on the fly so they stay correct as you edit — with optional
// overrides where the user might disagree (proficiency bonus, initiative).

export const ABILS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
export const SAVES = ABILS

// 18 skills with their governing ability.
export const SKILLS = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' },
  { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' },
  { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' },
  { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' },
  { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Survival', ability: 'WIS' },
]
const SKILL_ABILITY = Object.fromEntries(SKILLS.map((s) => [s.name, s.ability]))

export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const num = (v, d = 0) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : d
}

// ---- deterministic 5e math --------------------------------------------------
export function abilityMod(score) {
  const n = parseInt(score, 10)
  return Number.isFinite(n) ? Math.floor((n - 10) / 2) : 0
}

export function fmtMod(n) {
  return (n >= 0 ? '+' : '') + n
}

// Proficiency bonus by total level: 1-4 = +2, 5-8 = +3, ... 17-20 = +6.
export function profBonusForLevel(level) {
  const l = Math.max(1, Math.min(20, num(level, 1)))
  return Math.ceil(l / 4) + 1
}

export function getProfBonus(m) {
  const o = parseInt(m.profBonusOverride, 10)
  return Number.isFinite(o) ? o : profBonusForLevel(m.level)
}

export function saveTotal(m, ability) {
  return abilityMod(m.abilities[ability]) + (m.saves[ability] ? getProfBonus(m) : 0)
}

// skill proficiency level: 0 none, 1 proficient, 2 expertise
export function skillTotal(m, skillName) {
  const ability = SKILL_ABILITY[skillName]
  const lvl = num(m.skills[skillName], 0)
  return abilityMod(m.abilities[ability]) + lvl * getProfBonus(m)
}

export function passivePerception(m) {
  return 10 + skillTotal(m, 'Perception')
}

export function initiativeValue(m) {
  const o = parseInt(m.initiativeOverride, 10)
  return Number.isFinite(o) ? o : abilityMod(m.abilities.DEX)
}

// ---- model normalization ----------------------------------------------------
function emptyAbilities() {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
}
function emptySaves() {
  return { STR: false, DEX: false, CON: false, INT: false, WIS: false, CHA: false }
}
function emptySkills() {
  const o = {}
  SKILLS.forEach((s) => (o[s.name] = 0))
  return o
}
function emptySpellSlots() {
  const o = {}
  SPELL_LEVELS.forEach((l) => (o[l] = { total: '', used: '' }))
  return o
}

// Match a loosely-spelled skill name (from AI import) to a canonical one.
function matchSkill(raw) {
  if (!raw) return null
  const k = String(raw).toLowerCase().replace(/[^a-z]/g, '')
  return SKILLS.find((s) => s.name.toLowerCase().replace(/[^a-z]/g, '') === k)?.name || null
}

function normalizeSkills(s) {
  const out = emptySkills()
  if (Array.isArray(s)) {
    s.forEach((n) => {
      const key = matchSkill(n)
      if (key) out[key] = Math.max(out[key], 1)
    })
  } else if (s && typeof s === 'object') {
    Object.keys(s).forEach((raw) => {
      const key = matchSkill(raw)
      if (key) {
        const v = s[raw]
        out[key] = v === true ? 1 : Math.max(0, Math.min(2, num(v, 0)))
      }
    })
  }
  return out
}

function normalizeSaves(s) {
  const out = emptySaves()
  if (Array.isArray(s)) {
    s.forEach((n) => { const k = String(n).toUpperCase().slice(0, 3); if (out[k] !== undefined) out[k] = true })
  } else if (s && typeof s === 'object') {
    ABILS.forEach((a) => { out[a] = Boolean(s[a] ?? s[a.toLowerCase()]) })
  }
  return out
}

function normalizeSpellSlots(s) {
  const out = emptySpellSlots()
  if (s && typeof s === 'object') {
    SPELL_LEVELS.forEach((l) => {
      const v = s[l] ?? s[String(l)]
      if (v && typeof v === 'object') out[l] = { total: v.total ?? '', used: v.used ?? '' }
      else if (v !== undefined && v !== null && v !== '') out[l] = { total: v, used: '' }
    })
  }
  return out
}

function emptySpellsByLevel() {
  const o = {}
  SPELL_LEVELS.forEach((l) => (o[l] = ''))
  return o
}
function normalizeSpellsByLevel(s) {
  const out = emptySpellsByLevel()
  if (s && typeof s === 'object') {
    SPELL_LEVELS.forEach((l) => {
      const v = s[l] ?? s[String(l)]
      if (Array.isArray(v)) out[l] = v.filter(Boolean).join(', ')
      else if (typeof v === 'string') out[l] = v
    })
  }
  return out
}
function normalizeAllies(a) {
  if (Array.isArray(a)) return a.map((x) => (typeof x === 'string' ? { name: x, notes: '' } : { name: x.name || '', notes: x.notes || x.note || '' }))
  if (typeof a === 'string' && a.trim()) return [{ name: a.trim(), notes: '' }]
  return []
}
function asText(v) {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.filter(Boolean).join(', ')
  return ''
}

// Bring any member (old summary shape, AI import, or already-full) to the full
// 5e sheet shape. Unknowns are left blank; abilities default to 10.
export function normalizeMember(m = {}) {
  const ab = m.abilities || {}
  const abilities = emptyAbilities()
  ABILS.forEach((k) => { abilities[k] = num(ab[k] ?? ab[k.toLowerCase()], 10) })

  return {
    id: m.id,
    // identity
    name: m.name || 'New character',
    classes: m.classes || m.class || '',
    level: num(m.level, 1),
    race: m.race || '',
    background: m.background || '',
    alignment: m.alignment || '',
    playerName: m.playerName || '',
    xp: m.xp ?? '',
    // abilities + proficiency
    abilities,
    profBonusOverride: m.profBonusOverride ?? '',
    inspiration: Boolean(m.inspiration),
    saves: normalizeSaves(m.saves),
    skills: normalizeSkills(m.skills),
    // combat
    ac: m.ac ?? '',
    initiativeOverride: m.initiativeOverride ?? '',
    speed: m.speed || '',
    maxHp: m.maxHp ?? m.hp ?? '',
    hp: m.hp ?? m.maxHp ?? '',
    tempHp: m.tempHp ?? '',
    hitDice: m.hitDice || '',
    deathSaves: { successes: num(m.deathSaves?.successes, 0), failures: num(m.deathSaves?.failures, 0) },
    // attacks + spells
    attacks: Array.isArray(m.attacks) ? m.attacks.map((a) => ({ name: a.name || '', atk: a.atk ?? a.bonus ?? '', damage: a.damage || a.dmg || '' })) : [],
    spellClass: m.spellClass || '',
    spellSaveDC: m.spellSaveDC ?? '',
    spellAtkBonus: m.spellAtkBonus ?? '',
    spellSlots: normalizeSpellSlots(m.spellSlots),
    spells: typeof m.spells === 'string' ? m.spells : Array.isArray(m.spells) ? m.spells.join(', ') : '',
    // narrative (page 1)
    features: m.features || '',
    proficienciesLanguages: m.proficienciesLanguages || m.languages || '',
    equipment: m.equipment || '',
    personalityTraits: m.personalityTraits || '',
    ideals: m.ideals || '',
    bonds: m.bonds || '',
    flaws: m.flaws || '',
    // page 2 — character details / backstory
    age: m.age ?? '',
    height: m.height || '',
    weight: m.weight || '',
    eyes: m.eyes || '',
    skin: m.skin || '',
    hair: m.hair || '',
    portrait: m.portrait || '',
    backstory: m.backstory || m.notes || '',
    allies: normalizeAllies(m.allies),
    additionalFeatures: m.additionalFeatures || '',
    treasure: m.treasure || '',
    // page 3 — spell detail (spellClass/SaveDC/AtkBonus/Slots already above)
    spellcastingAbility: m.spellcastingAbility || '',
    cantrips: asText(m.cantrips),
    spellsByLevel: normalizeSpellsByLevel(m.spellsByLevel),
    // remembered page in the detail view (0/1/2)
    _page: Math.max(0, Math.min(2, num(m._page, 0))),
  }
}

export function blankMember() {
  return normalizeMember({ name: 'New character', level: 1 })
}

// Map a raw AI-vision extraction into the full member model (then normalize).
export function fromParsedSheet(d = {}) {
  const ap = d.appearance || {}
  return normalizeMember({
    name: d.name,
    classes: d.classes || d.class,
    level: d.level,
    race: d.race,
    background: d.background,
    alignment: d.alignment,
    playerName: d.playerName,
    xp: d.xp,
    abilities: d.abilities,
    profBonusOverride: d.profBonus,
    inspiration: d.inspiration,
    saves: d.saves || d.savingThrows,
    skills: d.skills,
    ac: d.ac,
    initiativeOverride: d.initiative,
    speed: d.speed,
    maxHp: d.maxHp ?? d.hpMax,
    hp: d.currentHp ?? d.hp ?? d.maxHp,
    tempHp: d.tempHp,
    hitDice: d.hitDice,
    attacks: d.attacks,
    spellClass: d.spellClass || d.spellcastingClass,
    spellSaveDC: d.spellSaveDC,
    spellAtkBonus: d.spellAtkBonus,
    spellSlots: d.spellSlots,
    spells: d.spells,
    features: d.features,
    proficienciesLanguages: d.proficienciesLanguages || d.languages,
    equipment: d.equipment,
    personalityTraits: d.personalityTraits,
    ideals: d.ideals,
    bonds: d.bonds,
    flaws: d.flaws,
    // page 2
    age: d.age ?? ap.age,
    height: d.height ?? ap.height,
    weight: d.weight ?? ap.weight,
    eyes: d.eyes ?? ap.eyes,
    skin: d.skin ?? ap.skin,
    hair: d.hair ?? ap.hair,
    backstory: d.backstory || d.notes,
    allies: d.allies || d.organizations || d.alliesOrganizations,
    additionalFeatures: d.additionalFeatures,
    treasure: d.treasure,
    // page 3
    spellcastingAbility: d.spellcastingAbility,
    cantrips: d.cantrips,
    spellsByLevel: d.spellsByLevel || d.spellsByLvl,
  })
}
