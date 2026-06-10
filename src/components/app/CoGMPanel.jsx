import { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, Scroll, Swords, Bag } from '../Icons.jsx'
import { suggestionChips, memoryFacts } from '../../data/mock.js'

const cannedReplies = [
  {
    text: 'For your four level-5 PCs, a Hard fight is ~1,100 XP. A **Water Elemental** (CR 5, 1,800 XP) makes a clean single-boss encounter — bound to the vault by the Drowned Choir. Drop the 5e statblock on the canvas?',
    card: {
      kind: '5e Encounter · Hard',
      title: 'Water Elemental',
      meta: 'Large elemental · CR 5 · AC 14 · HP 114',
      lines: ['Multiattack: two slams, +7 to hit, 2d8+4 bludgeoning', 'Whelm (recharge 4–6): DC 15 STR, 5d8 bludgeoning, engulf & grapple', 'Resistant to nonmagical B/P/S; immune to grappled, prone, poison'],
    },
  },
  {
    text: '**Grappling (5e):** make a special melee attack — an Athletics check contested by the target’s Athletics or Acrobatics (their choice). On a success the target is **Grappled** (speed 0). The target only needs to be no more than one size larger than you. It’s not an attack roll, so no advantage from Reckless Attack — but you can replace one attack of a Multiattack with a grapple. *(PHB p.195)*',
  },
  {
    text: 'Three Hollowmere rumors your players can overhear:\n• "The tide came in red last new moon — and didn’t go back out."\n• "Old Brennick sells maps to the vault. Half are forged. He won’t say which."\n• "They say the bells still ring under the water. They say you shouldn’t answer."',
  },
]

export default function CoGMPanel({ onSpawnCard }) {
  const [tab, setTab] = useState('chat')
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'I’ve read all 12 sessions of *The Sunken Crown* (D&D 5e). Ask me for a 5e NPC, a CR-balanced encounter, lore, or a rules call — I’ll keep it on-canon and on-the-rules.' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [replyIdx, setReplyIdx] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const send = (text) => {
    const content = (text ?? input).trim()
    if (!content) return
    setMsgs((m) => [...m, { role: 'gm', text: content }])
    setInput('')
    setTyping(true)
    const reply = cannedReplies[replyIdx % cannedReplies.length]
    setReplyIdx((i) => i + 1)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { role: 'ai', ...reply }])
    }, 1100)
  }

  return (
    <div className="flex h-full flex-col bg-ink-800">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-3">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aether-400/40 to-amethyst-500/40 text-amethyst-100">
          <Brain size={17} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-aether-300 ring-2 ring-ink-800 animate-pulseGlow" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">AI co-DM</p>
          <p className="truncate text-[11px] text-white/40">grounded in “The Sunken Crown” · 12 sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3">
        {[['chat', 'Chat'], ['memory', 'Memory']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {msgs.map((m, i) =>
              m.role === 'gm' ? (
                <div key={i} className="ml-7 rounded-2xl rounded-br-md bg-amethyst-500/25 px-3.5 py-2.5 text-sm text-white/90">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="mr-3">
                  <div className="flex items-center gap-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-amethyst-300">
                    <Sparkles size={11} /> co-DM
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed text-white/80">
                    <Rich text={m.text} />
                    {m.card && <GenCard card={m.card} onSpawn={onSpawnCard} />}
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="mr-3">
                <div className="flex items-center gap-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-amethyst-300">
                  <Sparkles size={11} /> co-DM
                </div>
                <div className="inline-flex gap-1 rounded-2xl rounded-bl-md bg-white/5 px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-amethyst-300" style={{ animationDelay: `${d * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2.5">
            {suggestionChips.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/65 transition hover:border-amethyst-400/40 hover:text-white"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/5 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-ink-700 p-2 focus-within:border-amethyst-400/50">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask your co-DM anything…"
                className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white placeholder:text-white/30 outline-none"
              />
              <button
                onClick={() => send()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900 transition hover:brightness-110 active:scale-95"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-white/30">AI can improvise — you’re always the final word at the table.</p>
          </div>
        </>
      ) : (
        <MemoryTab />
      )}
    </div>
  )
}

function Rich({ text }) {
  // Render **bold**, *italic*, and newlines.
  const parts = text.split('\n')
  return (
    <>
      {parts.map((line, i) => (
        <span key={i} className="block">
          {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((seg, j) => {
            if (seg.startsWith('**')) return <strong key={j} className="text-aether-100">{seg.slice(2, -2)}</strong>
            if (seg.startsWith('*')) return <em key={j} className="text-white/70">{seg.slice(1, -1)}</em>
            return <span key={j}>{seg}</span>
          })}
        </span>
      ))}
    </>
  )
}

function GenCard({ card, onSpawn }) {
  return (
    <div className="mt-3 rounded-xl border border-amethyst-400/30 bg-ink-700/80 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rune-300">
        <Swords size={12} /> {card.kind}
      </div>
      <p className="mt-1 font-display text-base text-white">{card.title}</p>
      <p className="text-[11px] text-white/45">{card.meta}</p>
      <ul className="mt-2 space-y-1">
        {card.lines.map((l) => (
          <li key={l} className="text-[11px] text-white/65">• {l}</li>
        ))}
      </ul>
      <button
        onClick={() => onSpawn?.(card)}
        className="mt-3 w-full rounded-lg bg-amethyst-400/20 py-1.5 text-xs font-semibold text-amethyst-100 transition hover:bg-amethyst-400/30"
      >
        + Add to canvas
      </button>
    </div>
  )
}

function MemoryTab() {
  const icons = { NPC: Brain, Plot: Scroll, Player: Sparkles, World: Sparkles, Loot: Bag }
  return (
    <div className="flex-1 overflow-auto px-4 py-4">
      <p className="text-xs leading-relaxed text-white/50">
        Campaign Memory tracks the facts your co-DM uses to stay on-canon. Auto-extracted from your notes & sessions.
      </p>
      <div className="mt-4 space-y-2.5">
        {memoryFacts.map((f, i) => {
          const Icon = icons[f.tag] || Sparkles
          return (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amethyst-400/20 text-amethyst-200">
                  <Icon size={12} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amethyst-300">{f.tag}</span>
              </div>
              <p className="mt-1.5 text-sm text-white/75">{f.text}</p>
            </div>
          )
        })}
      </div>
      <button className="mt-4 w-full rounded-lg border border-dashed border-white/10 py-2 text-xs text-white/45 hover:border-white/25 hover:text-white/70">
        + Pin a new memory
      </button>
    </div>
  )
}
