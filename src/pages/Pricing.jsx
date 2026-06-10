import { useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav.jsx'
import Footer from '../components/Footer.jsx'
import { Check, Crown, Sparkles, ChevronRight } from '../components/Icons.jsx'
import { tiers } from '../data/mock.js'

const faqs = [
  ['Is there really a free plan?', 'Yes. The Adventurer plan is free forever and includes the full local-first 5e screen plus 25 AI co-DM prompts a month — enough for a one-shot or light prep.'],
  ['What counts as an “AI co-DM prompt”?', 'Any generation: a 5e NPC, a monster statblock, a CR-balanced encounter, a lore answer, a rules lookup, or a memory query. Paid plans are unlimited within fair-use.'],
  ['Is this official D&D / Wizards of the Coast?', 'No — AETHER is an independent tool built around the D&D 5e System Reference Document (SRD) under the Creative Commons / Open Gaming License. It is not affiliated with or endorsed by Wizards of the Coast.'],
  ['Can my players use it too?', 'Worldsmith includes up to 5 co-DM seats for shared campaigns. Players can also open read-only handouts and maps you publish.'],
  ['Does it work offline?', 'Your canvas stays viewable offline, and the initiative tracker and dice keep working. AI features, SRD rules lookup, and cloud sync require a connection.'],
  ['Which editions are supported?', 'AETHER is built specifically for D&D 5th Edition (2014 SRD), including the 5e monster library, conditions, actions, and spell references. Homebrew 5e statblock building is on Worldsmith.'],
  ['Can I cancel anytime?', 'Anytime, from billing settings. You keep access through the end of the period and your data stays exportable.'],
]

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <MarketingNav />
      <section className="relative overflow-hidden">
        <div className="aether-aura pointer-events-none absolute inset-0" />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-10 text-center sm:px-8">
          <span className="chip mx-auto mb-5 border-amethyst-400/30 text-amethyst-200"><Crown size={14} /> Plans for every table</span>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Pick your level of power</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            Start free. Upgrade when you want the AI co-DM running 5e every session. No card to try.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!annual ? 'bg-white/10 text-white' : 'text-white/55'}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${annual ? 'bg-white/10 text-white' : 'text-white/55'}`}
            >Annual <span className="text-aether-300">−20%</span></button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {tiers.map((t) => {
            const monthly = t.price
            const shown = annual ? Math.round(t.price * 0.8) : t.price
            return (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl p-7 ${t.highlight ? 'card-grad-border bg-ink-700 shadow-glow-violet lg:-mt-4 lg:mb-0' : 'glass'}`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-aether-300 to-amethyst-400 px-3 py-1 text-xs font-semibold text-ink-900">
                    Most popular
                  </span>
                )}
                <div className={`mb-5 inline-flex w-fit rounded-xl bg-gradient-to-br ${t.accent} p-2.5`}>
                  {t.highlight ? <Sparkles size={20} className="text-amethyst-100" /> : <Crown size={20} className="text-white/70" />}
                </div>
                <h3 className="font-display text-2xl">{t.name}</h3>
                <p className="mt-1 text-sm text-white/50">{t.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-4xl">${shown}</span>
                  <span className="mb-1 text-sm text-white/45">/ {t.price === 0 ? t.period : 'mo'}</span>
                </div>
                {t.price > 0 && (
                  <p className="mt-1 text-xs text-white/40">
                    {annual ? `Billed annually · was $${monthly}/mo` : 'Billed monthly'}
                  </p>
                )}
                <Link to="/login" className={`mt-6 ${t.highlight ? 'btn-primary' : 'btn-ghost'} w-full`}>
                  {t.cta} {t.highlight && <ChevronRight size={16} />}
                </Link>
                <ul className="mt-7 space-y-3 border-t border-white/5 pt-6 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-white/75">
                      <Check size={17} className="mt-0.5 shrink-0 text-aether-300" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-white/45">
          Building something bigger? <a href="#" className="text-amethyst-200 underline-offset-4 hover:underline">Talk to us about guild & studio plans →</a>
        </p>
      </section>

      <section className="border-t border-white/5 bg-ink-800/50">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <h2 className="text-center font-display text-3xl">Questions, answered</h2>
          <div className="mt-10 divide-y divide-white/5">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-left font-medium text-white/90">
                  {q}
                  <span className="text-amethyst-300 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
