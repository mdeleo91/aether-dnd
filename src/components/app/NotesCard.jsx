import { useState } from 'react'
import { newId } from '../../app/generators.js'
import { Plus, X } from '../Icons.jsx'

export default function NotesCard({ card, onData }) {
  const notes = card.data?.notes || []
  const [draft, setDraft] = useState('')

  const set = (fn) => onData(card.id, { notes: fn(notes) })

  const add = (e) => {
    e?.preventDefault?.()
    const t = draft.trim()
    if (!t) return
    set((n) => [...n, { id: newId('n'), text: t }])
    setDraft('')
  }
  const update = (id, text) => set((n) => n.map((x) => (x.id === id ? { ...x, text } : x)))
  const remove = (id) => set((n) => n.filter((x) => x.id !== id))

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-1.5 overflow-auto">
        {notes.length === 0 && <li className="py-3 text-center text-xs text-white/40">No notes yet. Jot something below — it saves automatically.</li>}
        {notes.map((n) => (
          <li key={n.id} className="group flex items-start gap-2 rounded-md bg-white/[0.02] px-2 py-1.5">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amethyst-300" />
            <textarea
              value={n.text}
              onChange={(e) => update(n.id, e.target.value)}
              rows={1}
              className="min-h-0 flex-1 resize-none bg-transparent text-[12px] leading-relaxed text-white/75 outline-none focus:text-white"
              style={{ height: 'auto' }}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />
            <button onClick={() => remove(n.id)} title="Delete note" className="mt-0.5 text-white/25 opacity-0 transition group-hover:opacity-100 hover:text-red-300"><X size={12} /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-ink-700 px-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amethyst-400/50"
        />
        <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amethyst-400/20 text-amethyst-100 hover:bg-amethyst-400/30"><Plus size={14} /></button>
      </form>
    </div>
  )
}
