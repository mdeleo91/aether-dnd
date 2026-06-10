// Lightweight inline SVG icon set (no external dependency).
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) => function Icon({ size = 20, className = '', ...rest }) {
  return (
    <svg {...base} width={size} height={size} className={className} {...rest}>
      {paths}
    </svg>
  )
}

export const Sparkles = make(
  <>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
    <path d="M19 14l.7 1.9L21.6 17l-1.9.7L19 19.6l-.7-1.9L16.4 17l1.9-.7L19 14z" />
  </>,
)
export const Wand = make(
  <>
    <path d="M15 4V2M15 10V8M11 6H9M21 6h-2" />
    <path d="M5 21l11-11M14.5 6.5l3 3" />
  </>,
)
export const Brain = make(
  <>
    <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A2.5 2.5 0 0 0 7 17a2.5 2.5 0 0 0 2 1 2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A2.5 2.5 0 0 1 17 17a2.5 2.5 0 0 1-2 1 2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  </>,
)
export const Swords = make(
  <>
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m13 19 6-6M16 16l4 4M19 21l2-2" />
    <path d="M9.5 17.5 21 6V3h-3L6.5 14.5" />
    <path d="m5 19-2-2M8 16l-4 4" />
  </>,
)
export const Dice = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
  </>,
)
export const Map = make(
  <>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </>,
)
export const Scroll = make(
  <>
    <path d="M5 4h11a2 2 0 0 1 2 2v11a3 3 0 0 0 3 3H8a3 3 0 0 1-3-3V4z" />
    <path d="M5 4a2 2 0 0 0-2 2v2h4M9 9h6M9 13h5" />
  </>,
)
export const Bag = make(
  <>
    <path d="M6 8h12l1 12H5L6 8z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </>,
)
export const Users = make(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.7" />
  </>,
)
export const Bolt = make(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />)
export const Shield = make(
  <>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" />
    <path d="m9 12 2 2 4-4" />
  </>,
)
export const Check = make(<path d="M5 12l4.5 4.5L19 7" />)
export const Heart = make(<path d="M12 20s-7-4.6-9.2-9C1.3 7.6 3 4.5 6 4.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3 0 4.7 3.1 3.2 6.5C19 15.4 12 20 12 20z" />)
export const Plus = make(<path d="M12 5v14M5 12h14" />)
export const Send = make(<path d="M4 12 20 4l-6 16-2.5-6.5L4 12z" />)
export const Search = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
)
export const Menu = make(<path d="M4 7h16M4 12h16M4 17h16" />)
export const ChevronRight = make(<path d="m9 6 6 6-6 6" />)
export const Play = make(<path d="M7 5v14l11-7-11-7z" />)
export const Lock = make(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
)
export const Globe = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </>,
)
export const Layers = make(
  <>
    <path d="m12 3 9 5-9 5-9-5 9-5z" />
    <path d="m3 13 9 5 9-5M3 16l9 5 9-5" />
  </>,
)
export const Crown = make(<path d="M4 18h16M4 18 3 7l5 4 4-6 4 6 5-4-1 11" />)
export const Spark2 = make(<path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" />)
export const Quote = make(<path d="M7 7h4v6H7a2 2 0 0 1 2-6zM15 7h2v6h-4a2 2 0 0 1 2-6z" />)
export const Skull = make(
  <>
    <path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14z" />
    <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </>,
)
export const X = make(<path d="M6 6l12 12M18 6 6 18" />)
export const Expand = make(<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />)
export const Shrink = make(<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />)
export const LogOut = make(
  <>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </>,
)
export const UserPlus = make(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M19 8v6M16 11h6" />
  </>,
)
