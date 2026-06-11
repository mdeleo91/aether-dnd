// Serverless AI content generator for the in-app tools.
// POST { kind, params, campaign } -> { data } | { demo: true } | { error }
//
// kinds: 'npc' | 'shop' | 'rolltable' | 'encounter' | 'location' | 'charsheet'
//   - 'charsheet' is a VISION request: params.image is base64 (no data: prefix)
//     and params.mediaType is e.g. 'image/jpeg'. The model reads a photo of a
//     D&D 5e character sheet and returns structured stats.
// Uses server-side env vars (never hardcode keys):
//   AI_API_KEY   - required to generate content (OpenAI or Anthropic key)
//   AI_PROVIDER  - 'openai' (default) or 'anthropic'
//   AI_MODEL     - optional model override
const CHARSHEET_PROMPT =
  'Read this Dungeons & Dragons 5e character sheet image and extract the character. ' +
  'Return JSON: {"name":string,"class":string,"race":string,"level":number,' +
  '"abilities":{"STR":number,"DEX":number,"CON":number,"INT":number,"WIS":number,"CHA":number},' +
  '"ac":number,"hp":number,"maxHp":number,"skills":[string up to 6 notable proficiencies],"notes":string (one short line of anything else useful)}. ' +
  'Use ability SCORES (e.g. 16), not modifiers. If a value is unreadable, make a sensible estimate.'

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
  location: (p, c) =>
    `Generate ONE evocative D&D 5e location for this campaign: ${c}. Type/biome: ${p.kind || 'any'}. ${p.note || ''} ` +
    `Return JSON: {"name":string,"type":string (short, e.g. "drowned chapel"),"description":string (2-3 sentences of atmosphere),` +
    `"features":[3-5 short notable features or points of interest],"hooks":[2-3 one-line adventure hooks],` +
    `"read_aloud":string (a short boxed-text passage the DM can read to players)}.`,
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
  const isCharSheet = kind === 'charsheet'
  const build = PROMPTS[kind]
  if (!isCharSheet && !build) {
    res.status(400).json({ error: `Unknown kind: ${kind}` })
    return
  }
  if (isCharSheet && !params.image) {
    res.status(400).json({ error: 'No character-sheet image provided' })
    return
  }

  const system = isCharSheet
    ? 'You read Dungeons & Dragons 5e character sheets from images and output ONLY valid minified JSON matching the requested shape. No markdown, no code fences, no commentary.'
    : 'You are a Dungeons & Dragons 5e content generator. Respond with ONLY valid minified JSON matching the requested shape. No markdown, no code fences, no commentary.'
  // Optional GUIDING PROMPT — free text the user typed to steer the result.
  // When present it's woven into the model prompt so the output reflects it,
  // while the structured JSON shape is preserved. When empty, generation is
  // fully random (unchanged behavior).
  const guide = (params.prompt ?? params.userPrompt ?? '').toString().trim().slice(0, 600)
  const baseText = isCharSheet ? CHARSHEET_PROMPT : build(params, campaign)
  const userText =
    !isCharSheet && guide
      ? `${baseText} IMPORTANT — the user wants this to match the following request: "${guide}". Honor this guidance closely while still returning ONLY the exact JSON shape described above.`
      : baseText

  try {
    let text = ''
    if (provider === 'anthropic') {
      const content = isCharSheet
        ? [
            { type: 'image', source: { type: 'base64', media_type: params.mediaType || 'image/jpeg', data: params.image } },
            { type: 'text', text: userText },
          ]
        : userText
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content }],
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        res.status(502).json({ error: j.error?.message || 'AI provider error' })
        return
      }
      text = (j.content || []).map((b) => b.text || '').join('')
    } else {
      const userContent = isCharSheet
        ? [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: `data:${params.mediaType || 'image/jpeg'};base64,${params.image}` } },
          ]
        : userText
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          ...(isCharSheet ? {} : { response_format: { type: 'json_object' } }),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userContent },
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
