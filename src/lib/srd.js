// SRD monster search. Queries the open5e API (full stat blocks in results),
// falling back to dnd5eapi (index-only; needs a second fetch on select).
// Only SRD (System Reference Document) monsters are available — that's expected.

const OPEN5E = 'https://api.open5e.com/v1/monsters/'
const DND5EAPI = 'https://www.dnd5eapi.co/api/monsters'

// Returns { source, results } or { error }.
//   open5e results are FULL monster objects (have .armor_class etc.)
//   dnd5eapi results are index entries { index, name, url } -> need fetchSrdMonsterByRef
export async function searchSrdMonsters(query, { cr, type } = {}) {
  // --- primary: open5e ---
  try {
    const p = new URLSearchParams()
    if (query) p.set('search', query)
    if (cr != null && cr !== '') p.set('challenge_rating', String(cr))
    if (type) p.set('type', type)
    p.set('limit', '25')
    p.set('ordering', 'name')
    const r = await fetch(`${OPEN5E}?${p.toString()}`)
    if (r.ok) {
      const j = await r.json()
      return { source: 'open5e', results: j.results || [] }
    }
  } catch {
    /* fall through */
  }
  // --- fallback: dnd5eapi (name filter only) ---
  try {
    const url = query ? `${DND5EAPI}?name=${encodeURIComponent(query)}` : DND5EAPI
    const r = await fetch(url)
    if (r.ok) {
      const j = await r.json()
      return { source: 'dnd5eapi', results: j.results || [] }
    }
  } catch {
    /* fall through */
  }
  return { error: 'Could not reach the SRD monster API. Check your connection and try again.' }
}

// For a dnd5eapi index entry, fetch the full stat block.
export async function fetchDnd5eApiMonster(ref) {
  const url = ref?.url ? `https://www.dnd5eapi.co${ref.url}` : `${DND5EAPI}/${ref?.index}`
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}
