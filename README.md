# Project AETHER — front-end mockup

A clickable, visually-polished front-end **mockup** for *Project AETHER*, the subscription,
internet-connected, login-gated **AI co-Dungeon Master for Dungeons & Dragons 5e** — a competitor
to MITHOS (a local-first digital DM screen). All content is D&D 5e specific: 5e classes/races,
monsters & statblocks, CR-balanced encounters, spells, magic items, and SRD rules lookup.

This is a front-end only draft — **mock data, no real auth/AI backend.**

## Stack
- **Vite + React 18** (SPA)
- **Tailwind CSS v3** (custom "arcane SaaS" theme)
- **React Router v6**
- Zero runtime data deps — all content is mock data in `src/data/mock.js`

## Screens (routes)
| Route | Screen |
|-------|--------|
| `/` | Landing / marketing page (hero, features, AI co-GM showcase, MITHOS comparison, pricing CTA, testimonials) |
| `/app` | In-app **infinite-canvas DM dashboard** — pannable board with draggable cards (initiative tracker, battle map, NPC, shop, notes, roll tables), left tool rail, and the live **AI co-GM panel** |
| `/pricing` | Subscription tiers (Apprentice / Archmage / Worldsmith), monthly/annual toggle, FAQ |
| `/login` | Login / sign-up auth gate (OAuth buttons + email) — any button enters `/app` |

### Interactive bits in `/app`
- Drag the canvas background to **pan**; drag a card header to **move** it
- **Initiative tracker**: "Next turn" advances the active combatant and round
- **AI co-GM panel**: type or tap a suggestion chip → canned, on-canon replies; generated
  encounter cards can be **"Added to canvas"**
- Left rail buttons **spawn new cards** onto the canvas
- Zoom controls, "Player display" toggle, Memory tab

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
```

## Build
```bash
npm run build    # outputs to dist/
npm run preview
```

## Deploy to Vercel
This repo is Vercel-ready (`vercel.json` includes the SPA rewrite). It just needs **your**
Vercel auth — pick one:

```bash
# Option A — interactive
npm i -g vercel
vercel login
vercel --prod

# Option B — token (CI / non-interactive)
npm i -g vercel
vercel --prod --yes --token YOUR_VERCEL_TOKEN
```

Or, simplest: push this folder to a GitHub repo and **Import Project** at vercel.com —
Vercel auto-detects Vite (build `npm run build`, output `dist`).
