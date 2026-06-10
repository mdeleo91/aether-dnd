// Player-display sync. The DM "pushes" content (a battle map, etc.) and any
// open /play view reflects it.
//
// Today: same-origin sync via BroadcastChannel (cross-tab) + a localStorage
// mirror (so a freshly opened /play tab gets the last pushed state, and the
// `storage` event covers browsers without BroadcastChannel). This works on the
// live site with no backend — open /play in another tab on the same machine.
//
// When Supabase is configured we also relay over a Realtime broadcast channel,
// which enables true cross-device sync. Cross-device requires Supabase.
import { supabase, isSupabaseConfigured } from './supabase.js'

const LS_KEY = 'aether:player'
const CHANNEL = 'aether-player'

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

let rt = null
function realtime() {
  if (!isSupabaseConfigured) return null
  if (!rt) {
    try {
      rt = supabase.channel(CHANNEL, { config: { broadcast: { self: false } } })
      rt.subscribe()
    } catch {
      rt = null
    }
  }
  return rt
}

export function publishPlayer(payload) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), payload }))
  } catch {
    /* ignore */
  }
  if (bc) bc.postMessage(payload)
  const ch = realtime()
  if (ch) {
    try {
      ch.send({ type: 'broadcast', event: 'push', payload })
    } catch {
      /* ignore */
    }
  }
}

export function readPlayer() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw).payload : null
  } catch {
    return null
  }
}

export function subscribePlayer(cb) {
  const initial = readPlayer()
  if (initial) cb(initial)

  const onBC = (e) => cb(e.data)
  const onStorage = (e) => {
    if (e.key === LS_KEY && e.newValue) {
      try {
        cb(JSON.parse(e.newValue).payload)
      } catch {
        /* ignore */
      }
    }
  }
  if (bc) bc.addEventListener('message', onBC)
  window.addEventListener('storage', onStorage)

  let ch = null
  if (isSupabaseConfigured) {
    try {
      ch = supabase.channel(CHANNEL + '-sub', { config: { broadcast: { self: false } } })
      ch.on('broadcast', { event: 'push' }, ({ payload }) => cb(payload)).subscribe()
    } catch {
      ch = null
    }
  }

  return () => {
    if (bc) bc.removeEventListener('message', onBC)
    window.removeEventListener('storage', onStorage)
    if (ch) {
      try {
        supabase.removeChannel(ch)
      } catch {
        /* ignore */
      }
    }
  }
}
