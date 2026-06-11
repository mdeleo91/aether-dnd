import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { X } from '../Icons.jsx'

// A single, app-wide confirmation dialog used for every destructive action.
// Usage:
//   const confirm = useConfirm()
//   if (await confirm({ title, body, confirmLabel })) { ...do the delete... }
// The provider renders one dialog on top of everything; consumers just await it.

const ConfirmCtx = createContext(null)

export function useConfirm() {
  const ctx = useContext(ConfirmCtx)
  // Defensive fallback if used outside the provider.
  return ctx || (({ body } = {}) => Promise.resolve(window.confirm(body || 'Are you sure?')))
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const confirm = useCallback((opts = {}) => new Promise((resolve) => setState({ resolve, ...opts })), [])
  const close = (result) => {
    setState((s) => { s?.resolve(result); return null })
  }
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          title={state.title}
          body={state.body}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          tone={state.tone}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
        />
      )}
    </ConfirmCtx.Provider>
  )
}

export function ConfirmDialog({
  title = 'Are you sure?',
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel?.() }
      else if (e.key === 'Enter') { e.preventDefault(); onConfirm?.() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel, onConfirm])

  const confirmCls =
    tone === 'danger'
      ? 'bg-red-500/90 text-white hover:bg-red-500'
      : 'bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900 hover:brightness-110'

  return (
    <div
      data-confirm-open
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onCancel} className="-mr-1 -mt-1 text-white/30 hover:text-white"><X size={16} /></button>
        </div>
        {body && <p className="px-5 pt-2 text-sm leading-relaxed text-white/65">{body}</p>}
        <div className="mt-5 flex justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3">
          <button onClick={onCancel} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">{cancelLabel}</button>
          <button onClick={onConfirm} autoFocus className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${confirmCls}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
