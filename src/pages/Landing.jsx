import { Link } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav.jsx'
import Footer from '../components/Footer.jsx'
import {
  Sparkles, Brain, Swords, Scroll, Map, Dice, Bag, Users, Bolt, Shield,
  Check, ChevronRight, Play, Quote, Spark2, Wand,
} from '../components/Icons.jsx'
import { compareRows, testimonials } from '../data/mock.js'

const features = [
  { icon: Brain, title: 'AI co-Dungeon Master', text: 'A second DM in the room. It drafts 5e NPCs, dialogue, and twists that fit your world — in your voice.', tint: 'text-amethyst-300' },
  { icon: Scroll, title: 'Campaign Memory', text: 'Every NPC, oath, and loose thread, remembered. AETHER keeps your canon straight so you never contradict yourself.', tint: 'text-aether-300' },
  { icon: Swords, title: '5e Encounter Builder', text: 'CR-balanced encounters tuned to your party size and level — official statblocks, tactics, and terrain, in seconds.', tint: 'text-rune-300' },
  { icon: Map, title: 'Infinite Canvas', text: 'Pan a limitless board of battle maps, trackers, and notes on a 5-ft grid. Snap tools where you think.', tint: 'text-aether-300' },
  { icon: Dice, title: 'Initiative & Dice', text: '5e initiative, conditions, HP, death saves, and roll tables built for live play. Drag, click, keep combat moving.', tint: 'text-rune-300' },
  { icon: Bolt, title: '5e Rules on Demand', text: 'Ask in plain language. Grappling, cover, exhaustion, spell slots — answered with the SRD citation, mid-combat.', tint: 'text-amethyst-300' },
]

function Mark({ value }) {
  if (value === true) return <Check size={18} className="mx-auto text-aether-300" />
  if (value === false) return <span className="mx-auto block text-center text-white/25">—</span>
  return <span className="chip mx-auto !text-[11px]">{value === 'full' ? 'Full' : 'Cloud'}</span>
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="aether-aura pointer-events-none absolute inset-0" />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mx-auto mb-6 border-amethyst-400/30 bg-amethyst-400/10 text-amethyst-200">
              <Sparkles size={14} /> Built for Dungeons &amp; Dragons 5e · early access
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Your <span className="gradient-text">AI co-Dungeon Master</span>,<br className="hidden sm:block" />
              at the head of the table.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              AETHER is the infinite-canvas command center built for D&amp;D 5e — with an AI
              that improvises NPCs, builds CR-balanced encounters, answers rules questions, and
              remembers your whole campaign so you can run deeper games with less prep.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login" className="btn-primary px-6 py-3 text-base">
                Start your free trial <ChevronRight size={18} />
              </Link>
              <Link to="/app" className="btn-ghost px-6 py-3 text-base">
                <Play size={16} /> Open the live demo
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40">No card required · 14-day Archmage trial · Cancel anytime</p>
          </div>

          {/* Hero app preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-amethyst-500/20 to-transparent blur-2xl" />
            <AppPreview />
          </div>

          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-widest text-white/35">
            <span>Trusted by 12,000+ D&amp;D tables</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <span>5e SRD rules &amp; monsters</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <span>1.4M encounters built</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionHead
          kicker="The DM toolkit"
          title="Everything a 5e Dungeon Master needs — plus a co-DM you didn't know you could have"
          sub="AETHER keeps the beloved local-first screen and layers an AI collaborator on top, all built around the D&D 5e rules. Prep faster, improvise braver."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-grad-border glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-glow-violet">
              <div className={`inline-flex rounded-xl border border-white/10 bg-white/5 p-3 ${f.tint}`}>
                <f.icon size={24} />
              </div>
              <h3 className="mt-5 font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI co-GM SHOWCASE */}
      <section id="cogm" className="relative border-y border-white/5 bg-ink-800">
        <div className="aether-aura pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
          <div>
            <span className="chip border-amethyst-400/30 text-amethyst-200"><Brain size={14} /> The AI co-Dungeon Master</span>
            <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
              It read your campaign. <span className="gradient-text">Now it can run 5e beside you.</span>
            </h2>
            <p className="mt-5 text-white/65">
              Point the co-DM at any moment and it answers in seconds — grounded in your notes, your
              NPCs, your last twelve sessions, and the 5e rules. No generic fantasy mush. Your world,
              by the book.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                ['Improvise in character', 'Generate dialogue and motives for any NPC, on-brand with how you’ve played them before.'],
                ['Build CR-balanced encounters', '5e statblocks tuned to your party’s level and size, with XP budget and tactics for the terrain on your canvas.'],
                ['Settle rules calls instantly', 'Ask “does cover apply?” or “how do death saves work?” and get the 5e answer with the citation — no flipping books.'],
              ].map(([h, t]) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amethyst-400/20 text-amethyst-200">
                    <Check size={14} />
                  </span>
                  <div>
                    <p className="font-semibold">{h}</p>
                    <p className="text-sm text-white/55">{t}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/app" className="btn-primary mt-9">
              See the co-DM in action <ChevronRight size={16} />
            </Link>
          </div>
          <CoGMTeaser />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionHead
          kicker="How it plays"
          title="From blank canvas to running combat in three moves"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Wand, n: '01', h: 'Summon a tool', t: 'Drop a 5e initiative tracker, a battle map, a magic shop, or a monster card anywhere on the infinite canvas.' },
            { icon: Brain, n: '02', h: 'Ask the co-DM', t: 'Say what you need in plain language — “a Hard fight for four level-5 PCs.” It fills the card with on-canon, CR-balanced 5e content.' },
            { icon: Users, n: '03', h: 'Run the table', t: 'Push battle maps to the player display, track conditions and death saves live, and keep the adventure moving.' },
          ].map((s) => (
            <div key={s.n} className="glass relative rounded-2xl p-7">
              <span className="font-display text-5xl text-white/10">{s.n}</span>
              <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-aether-300">
                <s.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-xl">{s.h}</h3>
              <p className="mt-2 text-sm text-white/60">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="border-y border-white/5 bg-ink-800/60">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <SectionHead
            kicker="Why AETHER"
            title="The DM screen you love, with a mind of its own"
            sub="Traditional GM screens and virtual tabletops give you maps and trackers. AETHER keeps that foundation and adds a 5e-trained AI layer, CR-balanced encounters, SRD rules lookup, cloud sync, and shared campaigns — for D&D tables that want a co-DM, not just a toolkit."
          />
          <div className="card-grad-border glass mt-12 overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-5 py-4 font-medium text-white/50">Capability</th>
                  <th className="px-3 py-4 text-center font-medium text-white/50">GM screen / VTT</th>
                  <th className="px-3 py-4 text-center font-semibold text-amethyst-200">AETHER</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r, i) => (
                  <tr key={r.feature} className={i % 2 ? 'bg-white/[0.015]' : ''}>
                    <td className="px-5 py-3.5 text-white/80">{r.feature}</td>
                    <td className="px-3 py-3.5 text-center"><Mark value={r.legacy} /></td>
                    <td className="px-3 py-3.5 text-center"><Mark value={r.aether} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-white/40">
            AETHER is internet-connected and login-gated; an offline reading mode keeps your canvas viewable without a connection.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionHead kicker="From the table" title="DMs are running bigger D&D games with smaller prep" />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="glass flex flex-col rounded-2xl p-6">
              <Quote size={22} className="text-amethyst-300" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/75">“{t.quote}”</blockquote>
              <figcaption className="mt-5 border-t border-white/5 pt-4">
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-white/45">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div className="aether-aura pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
          <Spark2 size={28} className="mx-auto text-amethyst-300 animate-pulseGlow" />
          <h2 className="mt-5 font-display text-3xl sm:text-5xl">Take your seat. Bring a co-DM.</h2>
          <p className="mx-auto mt-5 max-w-xl text-white/65">
            Start free on the Adventurer plan, or unlock the full AI co-DM for D&amp;D 5e with a 14-day Archmage trial.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">Start free trial</Link>
            <Link to="/pricing" className="btn-ghost px-6 py-3 text-base">See pricing</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SectionHead({ kicker, title, sub }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amethyst-300">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-white/60">{sub}</p>}
    </div>
  )
}

function AppPreview() {
  return (
    <div className="card-grad-border overflow-hidden rounded-2xl border border-white/10 bg-ink-700 shadow-panel">
      <div className="flex items-center gap-2 border-b border-white/5 bg-ink-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rune-300/70" />
        <span className="h-3 w-3 rounded-full bg-rune-200/40" />
        <span className="h-3 w-3 rounded-full bg-aether-300/60" />
        <span className="ml-3 text-xs text-white/40">aether.app — The Sunken Crown · Session 12</span>
      </div>
      <div className="relative grid grid-cols-[1fr_300px]">
        <div className="dot-grid relative h-[340px] overflow-hidden p-4">
          <div className="absolute left-4 top-4 w-56 rounded-xl border border-white/10 bg-ink-600/80 p-3 shadow-glow">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-aether-300">Initiative · R3</p>
            <div className="mt-2 space-y-1.5">
              {['Kaelen — 22', 'Goblin Warlord — 19', 'Mira — 17'].map((r, i) => (
                <div key={r} className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${i === 0 ? 'bg-amethyst-400/20 text-white' : 'text-white/60'}`}>
                  <span>{r.split(' — ')[0]}</span><span className="font-mono">{r.split(' — ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-6 top-8 h-40 w-52 rotate-1 rounded-xl border border-white/10 bg-gradient-to-br from-aether-600/30 to-ink-600 shadow-glow">
            <div className="grid h-full w-full grid-cols-6 grid-rows-5 opacity-30">
              {Array.from({ length: 30 }).map((_, i) => <div key={i} className="border border-white/10" />)}
            </div>
          </div>
          <div className="absolute bottom-5 left-10 w-60 -rotate-1 rounded-xl border border-rune-300/20 bg-ink-600/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rune-300">Statblock · generated</p>
            <p className="mt-1 text-sm font-display">Water Elemental</p>
            <p className="mt-1 text-[11px] text-white/50">CR 5 · AC 14 · HP 114 · Whelm (DC 15)</p>
          </div>
        </div>
        <div className="border-l border-white/5 bg-ink-800 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amethyst-300">
            <Brain size={13} /> AI co-DM
          </p>
          <div className="mt-3 space-y-3 text-xs">
            <div className="ml-6 rounded-lg rounded-br-sm bg-amethyst-500/20 p-2.5 text-white/85">A Hard fight for my four level-5 PCs?</div>
            <div className="mr-4 rounded-lg rounded-bl-sm bg-white/5 p-2.5 text-white/70">A <span className="text-aether-200">Water Elemental</span> (CR 5) is a clean single-boss Hard encounter. Drop the 5e statblock on the canvas?</div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-[11px] text-white/40">
            Ask your co-DM…
          </div>
        </div>
      </div>
    </div>
  )
}

function CoGMTeaser() {
  return (
    <div className="card-grad-border glass rounded-2xl p-5 shadow-panel">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amethyst-400/20 text-amethyst-200"><Brain size={15} /></span>
        <span className="text-sm font-semibold">AETHER co-DM</span>
        <span className="chip ml-auto !py-0.5 !text-[10px] text-aether-200">5e · grounded in 12 sessions</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="ml-8 rounded-2xl rounded-br-md bg-amethyst-500/20 p-3 text-white/90">
          The players just betrayed Mayor Edda. How does she retaliate, in character?
        </div>
        <div className="mr-6 rounded-2xl rounded-bl-md bg-white/5 p-3 text-white/75">
          Edda doesn’t shout — she remembers the bridge-fire favor they cashed in (Session 7) and
          quietly revokes their harbor writ. Expect city guards (CR 1/8) "just checking papers," and a
          sealed letter to the Drowned Choir naming the party as thieves.
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Draft the letter', 'Stat the city guards', 'What does Edda want?'].map((c) => (
            <span key={c} className="chip cursor-default hover:border-amethyst-400/40">{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
