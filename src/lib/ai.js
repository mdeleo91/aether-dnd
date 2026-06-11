// Client helper for AI content generation. Calls the serverless /api/generate
// endpoint, which uses the server-side AI_API_KEY. Returns one of:
//   { data }   - generated structured content
//   { demo: true } - no AI key configured on the server
//   { error }  - request/parse failure
//
// Callers should NEVER fall back to hardcoded content on { demo } — show a
// "set AI_API_KEY" state instead.
//
// `campaign` is OPTIONAL theme context. It defaults to '' so a fresh campaign
// produces VARIED, unanchored results — generation is NOT tied to any built-in
// setting. Steer a single result with the per-card guiding prompt (params.prompt),
// or pass real campaign details here to theme everything.
export async function aiGenerate(kind, params = {}, campaign = '') {
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

// Send a PHOTO of a D&D 5e character sheet to the vision model and get back
// structured stats. `image` is raw base64 (no data: prefix). Same result shape
// as aiGenerate: { data } | { demo: true } | { error }.
export async function aiParseCharSheet(image, mediaType = 'image/jpeg') {
  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'charsheet', params: { image, mediaType } }),
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

// Read a File (image) and downscale it to a manageable JPEG, returning
// { base64, mediaType }. Keeps the request well under serverless body limits.
export function fileToScaledBase64(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file does not look like an image'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
