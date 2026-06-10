// Vercel serverless function: the AI co-DM backend.
// POST { system: string, messages: [{ role: 'user'|'assistant', content }] }
//   -> { reply: string }            when an AI key is configured
//   -> { demo: true }               when no key (client falls back to scripted replies)
//
// Configure with environment variables (never hardcode keys):
//   AI_API_KEY   - required to enable live AI (OpenAI or Anthropic key)
//   AI_PROVIDER  - 'openai' (default) or 'anthropic'
//   AI_MODEL     - optional override (default gpt-4o-mini / claude-3-5-haiku-latest)
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
  const system = typeof body.system === 'string' ? body.system : ''

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
