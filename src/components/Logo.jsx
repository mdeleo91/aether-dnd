import { Link } from 'react-router-dom'

export default function Logo({ size = 30, withWordmark = true, to = '/' }) {
  const mark = (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0">
      <defs>
        <linearGradient id="aetherLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fd2ec" />
          <stop offset="1" stopColor="#8a5cf0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#100e1d" stroke="rgba(255,255,255,0.08)" />
      <path d="M32 12 L50 50 L40 50 L32 32 L24 50 L14 50 Z" fill="url(#aetherLogoGrad)" />
      <circle cx="32" cy="40" r="3.6" fill="#eab559" />
    </svg>
  )
  const content = (
    <span className="inline-flex items-center gap-2.5">
      {mark}
      {withWordmark && (
        <span className="font-display text-xl font-bold tracking-[0.18em] text-white">
          AETHER
        </span>
      )}
    </span>
  )
  if (to) return <Link to={to} className="group">{content}</Link>
  return content
}
