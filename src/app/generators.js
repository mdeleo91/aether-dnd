// Pure mechanics — dice math, ids, table rolling. No content here; content is
// AI-generated (see src/lib/ai.js + /api/generate).

let _n = 0
export const newId = (p = 'id') => `${p}_${Date.now().toString(36)}_${(_n++).toString(36)}`

export function rollDie(sides) {
  return 1 + Math.floor(Math.random() * sides)
}

// Parse and roll an expression like "1d20+5", "2d6", "d8-1".
export function parseDice(expr) {
  const m = String(expr).trim().match(/^(\d*)\s*[dD]\s*(\d+)\s*([+-]\s*\d+)?$/)
  if (!m) return null
  const n = Math.min(50, Math.max(1, parseInt(m[1] || '1', 10)))
  const sides = Math.min(1000, Math.max(2, parseInt(m[2], 10)))
  const mod = m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0
  const rolls = Array.from({ length: n }, () => rollDie(sides))
  const total = rolls.reduce((a, b) => a + b, 0) + mod
  return { n, sides, mod, rolls, total, label: `${n}d${sides}${mod ? (mod > 0 ? '+' : '') + mod : ''}` }
}

// Roll on an AI-generated table { die, entries:[{min,max,text}] }.
export function rollOnTable(table) {
  const die = table?.die || 20
  const roll = rollDie(die)
  const entry = (table?.entries || []).find(
    (e) => roll >= (e.min ?? e.roll) && roll <= (e.max ?? e.roll),
  )
  return { roll, die, text: entry ? entry.text : '(no matching entry)' }
}

// Roll initiative from a DEX modifier string like "+2".
export function rollInitiative(mod) {
  const m = parseInt(String(mod).replace(/[^\d+-]/g, ''), 10)
  return rollDie(20) + (Number.isFinite(m) ? m : 0)
}
