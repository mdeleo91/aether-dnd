// Vercel serverless function: the AI co-DM backend.
// POST { system: string, messages: [{ role: 'user'|'assistant', content }] }
//   -> { reply: string }            when an AI key is configured
//   -> { demo: true }               when no key (client falls back to scripted replies)
//
// Configure with environment variables (never hardcode keys):
//   AI_API_KEY   - required to enable live AI (OpenAI or Anthropic key)
//   AI_PROVIDER  - 'openai' (default) or 'anthropic'
//   AI_MODEL     - optional override (default gpt-4o-mini / claude-3-5-haiku-latest)

// Knowledge of the AETHER app itself, appended to whatever system prompt the
// client sends. This makes the co-DM double as an in-app guide: besides running
// D&D 5e, it can answer "how do I…" questions about using the platform. Keep this
// in sync with the real UI — do not list features that don't exist.
const AETHER_GUIDE = `
=== ABOUT THE AETHER APP (you are also a guide to using this platform) ===
Besides being a D&D 5e co-Dungeon Master, you are an expert on the AETHER app and help the user operate it. When they ask how to do something in the app, give concrete, step-by-step guidance that references the real UI (the left tool rail, the specific card/window, and the actual buttons). Keep it concise. Do not invent features beyond what is listed here; if you're unsure, say so.

AETHER is a web app: an infinite-canvas command center for running D&D 5e games, with an AI co-DM (that's you) and on-demand content generators.

CANVAS & WINDOWS:
- The workspace is an infinite canvas. Tools open as macOS-style windows ("cards") with three traffic-light dots top-left: red = close, yellow = minimize, green = maximize.
- Move a card by dragging its title bar. Resize it from its right edge or the bottom-right corner handle.
- Pan the canvas by middle-click dragging. Zoom with Ctrl + scroll wheel (it zooms toward the cursor). Press F to toggle fullscreen.

TOOL RAIL (left side): click a tool to open it; the rail toggles a SINGLE instance — clicking the same tool again closes it. Tools:
- Initiative tracker — add/edit combatants, advance with "Next turn", and "+ Party" to drop the whole party in.
- Dice roller & Roll tables — roll expressions like "1d20+5"; generate and roll random tables.
- Shop generator — generate a shop's inventory.
- NPC / statblock generator — generate an NPC or monster statblock.
- Location generator — generate an evocative location.
- Session notes — keep running notes.
- Battle map — add and drag tokens, toggle fog of war, and push the map to the player screen.
- Co-DM panel — chat with you for rulings, ideas, and improv.

AI GENERATORS: every generator (NPC, Location, Shop, Roll table, Encounter) has an optional GUIDING-PROMPT field ("describe what you want…") to steer the result; leave it blank for a fully random result. Generated NPCs and Locations can be saved to per-campaign LIBRARIES with the "★ Save" button and re-added later from the Library tool.

CAMPAIGNS: you can create and switch between campaigns from the campaign menu. Each campaign is a fresh slate with its own canvas layout, party, and libraries. Work auto-saves per campaign.

PARTY & CHARACTER SHEETS: open the Party tool to see the roster. Click a member to open their full, official-style 3-page 5e character sheet (page 1 core/combat, page 2 details/backstory, page 3 spells) — every field is editable and modifiers compute automatically. Add a member with "Add", or "Import sheet" to upload a PHOTO of a real character sheet and let AI vision read it in. Use the initiative tool's "+ Party" to add the party to combat.

ACCOUNTS & PLAYERS: sign in with email/password or Google. Players join a session at /join (entering a name) and see a read-only player view at /play; the DM pushes content (like the battle map) to them.

AI features (you, plus the generators and photo import) require the deployment's AI key, which is already configured here.
=== END AETHER APP GUIDE ===`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.AI_API_KEY
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  const model =
    process.env.AI_MODEL || (provider === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini')

  // No key configured → tell the client to use its built-in demo mode.
  if (!key) {
    res.status(200).json({ demo: true })
    return
  }

  let body = req.body
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}')
    } catch {
      body = {}
    }
  }
  const messages = Array.isArray(body.messages) ? body.messages : []
  const baseSystem = typeof body.system === 'string' && body.system.trim()
    ? body.system
    : 'You are the AETHER co-Dungeon Master, an expert, improvisational Dungeons & Dragons 5e assistant. Help the DM with rulings, NPCs, encounters, and story on the fly. Be concise and practical.'
  // Always append the platform guide so the co-DM can also answer how-to
  // questions about using the AETHER app itself.
  const system = `${baseSystem}\n${AETHER_GUIDE}`

  try {
    let reply = ''
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: 600, system, messages }),
      })
      const j = await r.json()
      if (!r.ok) {
        res.status(502).json({ error: j.error?.message || 'AI provider error' })
        return
      }
      reply = (j.content || []).map((b) => b.text || '').join('').trim()
    } else {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        res.status(502).json({ error: j.error?.message || 'AI provider error' })
        return
      }
      reply = j.choices?.[0]?.message?.content?.trim() || ''
    }
    res.status(200).json({ reply })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
