# Project AETHER 

An **AI co-Dungeon Master for Dungeons & Dragons 5e** — an infinite-canvas DM command
center with an AI co-DM, CR-balanced encounters, 5e statblocks, magic items, and SRD
rules lookup. Built as a polished, clickable product with real auth and an optional live AI
backend.

> The app runs fully in **demo mode** with no setup. Add the env vars in
> [`SETUP.md`](./SETUP.md) to switch on real Supabase auth, Google sign-in, and live AI.

## Stack
- **Vite + React 18** (SPA) · **Tailwind CSS v3** · **React Router v6**
- **Supabase Auth** (email/password + Google OAuth + anonymous player sessions)
- **Vercel serverless function** (`/api/cogm`) for the live AI co-DM (OpenAI or Anthropic)

## Screens (routes)
| Route | Screen |
|-------|--------|
| `/` | Landing / marketing page (hero, features, AI co-DM showcase, "Why AETHER" positioning, pricing CTA, testimonials) |
| `/pricing` | Subscription tiers, monthly/annual toggle, FAQ |
| `/login` | **DM** login / signup (email + password, Google, demo fallback) |
| `/join` | **Player** join screen (name + game code) |
| `/app` | In-app infinite-canvas DM dashboard — **DM-only, auth-gated** |
| `/play` | Player-facing display — **player-only, auth-gated** |

## In-app (`/app`) interactions
- **Pan:** middle-mouse-button drag · **Zoom:** Ctrl + scroll wheel (or the zoom controls)
- **Move a card:** drag its header · **Close a card:** the ✕ button on its header
- **Full screen:** the Fullscreen button in the top bar, or press **F**
- **Add cards:** left tool rail spawns initiative trackers, maps, NPCs, shops, notes, roll tables
- **AI co-DM panel:** type a prompt → calls `/api/cogm`; shows **● Live AI** when a key is
  configured, otherwise **Demo mode** with scripted on-canon replies. Generated encounter
  cards can be added to the canvas.
- **Sign out** / **Player display** toggle in the top bar

## Auth & roles
Auth lives in `src/auth/AuthProvider.jsx`. Users have a **role**: `dm` or `player`.
`ProtectedRoute` gates `/app` (DM) and `/play` (player). Without Supabase keys the provider
runs a **local demo session** so the mockup stays fully clickable.

## Run locally
```bash
npm install
cp .env.example .env   # optional — fill in to enable real services
npm run dev            # http://localhost:5173
```
> In local dev the `/api/cogm` function isn't served by Vite, so the co-DM stays in demo
> mode. Use `vercel dev` (or deploy) to exercise the live AI path.

## Build
```bash
npm run build          # outputs to dist/
npm run preview
```

## Deploy
Vercel-ready: `vercel.json` has the SPA rewrite and `/api/cogm` is a serverless function.
Import the repo at vercel.com (auto-detects Vite, build `npm run build`, output `dist`), then
set the environment variables from [`SETUP.md`](./SETUP.md) in the Vercel project.

---
Dungeons & Dragons and D&D are trademarks of Wizards of the Coast. AETHER is an independent
tool built on the 5e SRD and is not affiliated with or endorsed by Wizards of the Coast. This
project is a product mockup/demo.


<!-- redeploy: sync HEAD (3-page character sheet) to production -->
