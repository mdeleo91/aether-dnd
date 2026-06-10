import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

const cols = [
  {
    title: 'Product',
    items: ['Infinite Canvas', 'AI co-DM', 'Campaign Memory', '5e Encounter Builder', 'Player Display'],
  },
  { title: 'Resources', items: ['Docs', '5e Monster Library', 'SRD Rules Reference', 'Community', 'Changelog'] },
  { title: 'Company', items: ['About', 'Careers', 'Blog', 'Press Kit', 'Contact'] },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-900">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              The AI co-Dungeon Master for D&amp;D 5e. Run deeper games, improvise fearlessly, and
              never lose the thread of your campaign.
            </p>
            <div className="mt-5 flex gap-2">
              <span className="chip">SOC 2 ready</span>
              <span className="chip">Cloud-synced</span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-white/60 transition hover:text-white">{i}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/5 pt-6 text-xs text-white/40">
          <p className="max-w-3xl text-center text-[11px] text-white/30">
            Dungeons &amp; Dragons and D&amp;D are trademarks of Wizards of the Coast. AETHER is an
            independent tool built on the 5e SRD and is not affiliated with or endorsed by Wizards of
            the Coast. This site is a demo product mockup.
          </p>
        </div>
        <div className="mt-3 flex flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Aether Interactive, Inc.</p>
          <div className="flex gap-5">
            <Link to="/pricing" className="hover:text-white/70">Pricing</Link>
            <a href="#" className="hover:text-white/70">Privacy</a>
            <a href="#" className="hover:text-white/70">Terms</a>
            <a href="#" className="hover:text-white/70">Status</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
