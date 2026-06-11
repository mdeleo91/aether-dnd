import { useEffect } from 'react'
import PartyCard from './PartyCard.jsx'
import { Users, X } from '../Icons.jsx'

// The Party roster + full 3-page 5e character sheet, shown as a large centered
// modal over the whole app so the sheet has room to breathe. The roster → member
// → sheet flow (with its 1/2/3 navigator and ← Roster) all happens inside here.
export default function PartyModal({ lib, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      // Don't close the party modal while a confirm dialog is open on top of it.
      if (e.key === 'Escape' && !document.querySelector('[data-confirm-open]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-ink-800/90 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-aether-300">
            <Users size={15} /> Party &amp; Character Sheets
          </span>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <PartyCard lib={lib} />
        </div>
      </div>
    </div>
  )
}
