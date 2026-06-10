// Campaign persistence. Today this is localStorage keyed per user, so a DM's
// canvas (cards, positions/sizes, initiative, notes, AI-generated NPCs/shops/
// tables, map tokens, etc.) survives a page refresh with no backend.
//
// Supabase-ready: the whole campaign is a single JSON blob keyed by user id,
// so a future adapter can `upsert` it to a `campaigns` row and load it back
// without changing any caller. Swap the bodies of load/save to do that.
const PREFIX = 'aether:campaign:'

export function loadCampaign(userKey) {
  try {
    const raw = localStorage.getItem(PREFIX + (userKey || 'guest'))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let _timer
export function saveCampaign(userKey, campaign) {
  try {
    clearTimeout(_timer)
    _timer = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + (userKey || 'guest'), JSON.stringify(campaign))
      } catch {
        /* quota / unavailable — ignore */
      }
    }, 150)
  } catch {
    /* ignore */
  }
}

export function clearCampaign(userKey) {
  try {
    localStorage.removeItem(PREFIX + (userKey || 'guest'))
  } catch {
    /* ignore */
  }
}
