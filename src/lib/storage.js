// Campaign persistence.
//
// Each CAMPAIGN is a single JSON blob (cards, party, NPC library, locations
// library, player display) keyed per **user + campaign**:
//     aether:campaign:<userId>:<campaignId>
// A lightweight INDEX lists a user's campaigns and which one is selected:
//     aether:campaigns:<userId>   ->  { campaigns:[{id,name,createdAt}], currentId }
//
// Today this is localStorage, so a DM's workspace survives a refresh with no
// backend. It stays Supabase-ready: each campaign is one self-contained blob,
// so a future adapter can `upsert` it to a `campaigns` row (keyed by user +
// campaign id) and load it back without changing any caller — just swap the
// bodies of load/save below.
const PREFIX = 'aether:campaign:'
const INDEX_PREFIX = 'aether:campaigns:'

const uid = (userId) => userId || 'guest'
const campaignKey = (userId, campaignId) => `${PREFIX}${uid(userId)}:${campaignId}`
const indexKey = (userId) => `${INDEX_PREFIX}${uid(userId)}`

// ---- Campaigns index ------------------------------------------------------
export function loadCampaignsIndex(userId) {
  try {
    const raw = localStorage.getItem(indexKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCampaignsIndex(userId, index) {
  try {
    localStorage.setItem(indexKey(userId), JSON.stringify(index))
  } catch {
    /* quota / unavailable — ignore */
  }
}

// ---- A single campaign blob ----------------------------------------------
export function loadCampaign(userId, campaignId) {
  try {
    const raw = localStorage.getItem(campaignKey(userId, campaignId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let _timer
let _pending = null
// Debounced save for the active campaign (called on every edit).
export function saveCampaign(userId, campaignId, campaign) {
  _pending = { userId, campaignId, campaign }
  clearTimeout(_timer)
  _timer = setTimeout(() => {
    _pending = null
    try {
      localStorage.setItem(campaignKey(userId, campaignId), JSON.stringify(campaign))
    } catch {
      /* ignore */
    }
  }, 150)
}

// Immediate, synchronous save — used before switching campaigns so no edit is
// lost to the debounce window.
export function saveCampaignNow(userId, campaignId, campaign) {
  clearTimeout(_timer)
  _pending = null
  try {
    localStorage.setItem(campaignKey(userId, campaignId), JSON.stringify(campaign))
  } catch {
    /* ignore */
  }
}

export function deleteCampaign(userId, campaignId) {
  try {
    localStorage.removeItem(campaignKey(userId, campaignId))
  } catch {
    /* ignore */
  }
}

// One-time migration: the pre-campaigns build stored a single blob at
// `aether:campaign:<userId>` (no campaign id). Read it so we can seed it as the
// user's first campaign.
export function loadLegacyCampaign(userId) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${uid(userId)}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
