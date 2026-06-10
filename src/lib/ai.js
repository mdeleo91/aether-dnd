// Client helper for AI content generation. Calls the serverless /api/generate
// endpoint, which uses the server-side AI_API_KEY. Returns one of:
//   { data }   - generated structured content
//   { demo: true } - no AI key configured on the server
//   { error }  - request/parse failure
//
// Callers should NEVER fall back to hardcoded content on { demo } — show a
// "set AI_API_KEY" state instead.
const CAMPAIGN =
  'The Sunken Crown — a flooded D&D 5e town (Hollowmere) menaced by the Drowned Choir, a cult trying to summon a kraken. A party of four level-5 adventurers.'

export async function aiGenerate(kind, params = {}, campaign = CAMPAIGN) {
  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, params, campaign }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      return { error: j.error || `Request failed (${r.status})` }
    }
    const j = await r.json()
    if (j.demo) return { demo: true }
    if (j.data) return { data: j.data }
    return { error: 'No content returned' }
  } catch (e) {
    return { error: e?.message || 'Network error' }
  }
}
