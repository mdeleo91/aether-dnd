import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import { Menu, ChevronRight } from './Icons.jsx'

const links = [
  { to: '/#features', label: 'Features' },
  { to: '/#cogm', label: 'AI co-DM' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/#compare', label: 'Why AETHER' },
]

export default function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className="text-sm font-medium text-white/65 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-medium text-white/70 transition hover:text-white">
            Log in
          </Link>
          <Link to="/login" className="btn-primary">
            Start free trial <ChevronRight size={16} />
          </Link>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-white/10 p-2 text-white/80 md:hidden"
          aria-label="Menu"
        >
          <Menu />
        </button>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-ink-800 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.label} href={l.to} onClick={() => setOpen(false)} className="text-white/75">
                {l.label}
              </a>
            ))}
            <Link to="/login" className="btn-primary mt-2">Start free trial</Link>
          </div>
        </div>
      )}
    </header>
  )
}
