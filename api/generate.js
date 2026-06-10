// Serverless AI content generator for the in-app tools.
// POST { kind, params, campaign } -> { data } | { demo: true } | { error }
//
// kinds: 'npc' | 'shop' | 'rolltable' | 'encounter'
// Uses server-side env vars (never hardcode keys):
//   AI_API_KEY   - required to generate content (OpenAI or Anthropic key)
//   AI_PROVIDER  - 'openai' (default) or 'anthropic'
//   AI_MODEL     - optional model override
const PROMPTS = {
  npc: (p, c) =>
    `Generate ONE D&D 5e NPC or monster for this campaign: ${c}. ${p.note || ''} Role/difficulty: ${p.role || 'any'}. ` +
    `Return JSON: {"name":string,"type":string (size + creature type + alignment),"cr":string,"ac":number,"hp":number,"speed":string,` +
    `"abilities":{"STR":string,"DEX":string,"CON":string,"INT":string,"WIS":string,"CHA":string} (signed modifiers like "+2"),` +
    `"traits":[up to 4 short statblock action/trait lines],"personality":string (one sentence),"appearance":string (one sentence)}.`,
  shop: (p, c) =>
    `Generate a shop inventory for this campaign: ${c}. Shop type: ${p.shopType || 'general store'}. Wealth level: ${p.level || 'Standard'}. ` +
    `Return JSON: {"shopName":string,"items":[{"name":string,"rarity":"common"|"uncommon"|"rare"|"very rare"|"legendary","price":string (include "gp"),"note":string (short flavor or effect)}]}. ` +
    `Provide ${p.count || 6} distinct items that fit the shop type and wealth.`,
  rolltable: (p, c) => {
    const die = p.die || 20
    return (
      `Generate a d${die} random table for a D&D 5e game. Theme: ${p.theme || 'campaign events and encounters'}. Campaign: ${c}. ` +
      `Return JSON: {"name":string,"die":${die},"entries":[{"min":number,"max":number,"text":string}]}. ` +
      `Entries MUST cover every value from 1 to ${die} with no gaps or overlaps. Keep each text short and evocative.`
    )
  },
  encounter: (p, c) =>
    `Generate a D&D 5e combat encounter for this campaign: ${c}. Party: ${p.party || 'four level-5 PCs'}. Difficulty: ${p.difficulty || 'medium'}. ` +
    `Return JSON: {"title":string,"summary":string (one sentence),"monsters":[{"name":string,"cr":string,"count":number,"ac":number,"hp":number,"init":string (DEX modifier like "+2")}]}. ` +
    `Keep it CR-balanced for the party.`,
}

function parseJson(s) {
  if (!s) return null
  let t = String(s).trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a >= 0 && b > a) t = t.slice(a, b + 1)
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.AI_API_KEY
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  const model =
    process.env.AI_MODEL || (provider === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini')

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
  const { kind, params = {}, campaign = '' } = body
  const build = PROMPTS[kind]
  if (!build) {
    res.status(400).json({ error: `Unknown kind: ${kind}` })
    return
  }

  const system =
    'You are a Dungeons & Dragons 5e content generator. Respond with ONLY valid minified JSON matching the requested shape. No markdown, no code fences, no commentary.'
  const user = build(params, campaign)

  try {
    let text = ''
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 900,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        res.status(502).json({ error: j.error?.message || 'AI provider error' })
        return
      }
      text = (j.content || []).map((b) => b.text || '').join('')
    } else {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: 900,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        res.status(502).json({ error: j.error?.message || 'AI provider error' })
        return
      }
      text = j.choices?.[0]?.message?.content || ''
    }

    const data = parseJson(text)
    if (!data) {
      res.status(502).json({ error: 'AI returned unparseable JSON' })
      return
    }
    res.status(200).json({ data })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
