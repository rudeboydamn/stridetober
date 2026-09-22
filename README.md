# 🍂 Stridetober

The official ledger of the October Steps Challenge. $20 buy-in, four weeks,
top three split the pot 50/30/20. Officiated by Dammy Henry, The *Fairly* Impartial Judge.

> **Picking this up as an agent?** Read [AGENTS.md](AGENTS.md) first, then the
> full spec + task list in [docs/PLAN.md](docs/PLAN.md).

**Challenge window:** Sun Oct 4 2026 → **midnight Sun Nov 1 2026** (4 weeks)
**Check-ins:** screenshots to Dammy each Sunday — Oct 11, 18, 25, and Nov 1 (final)

## Stack

Static HTML/CSS/JS in `public/`. No framework, no build step, zero npm
dependencies. Hand-rolled SVG charts, a `<canvas>` leaf burst, Google Fonts
(Fraunces / Inter / Caveat). Node ≥ 20 is used only for tests.

## Quickstart

```bash
python3 -m http.server 4173 -d public   # local preview → http://localhost:4173
npm test                                # the deploy gate (Vercel runs this)
```

Preview the whole challenge before it starts: `http://localhost:4173/?demo=1`
loads fictional walkers and four posted weeks so every phase renders. Inside demo
mode, `&now=2026-10-18T10:00` time-travels (e.g. `2026-10-31T23:30` for Hallowed
Eve, `2026-11-01T09:00` for counting). `?motion=reduce` previews reduced motion.

## Regenerating the OG image and icons

`tools/og.html` and `tools/icon.html` are the sources. Render them with headless Chrome:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=1200,630 --screenshot=public/og.png tools/og.html
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=512,512 --screenshot=public/icon-512.png tools/icon.html
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=192,192 --screenshot=public/icon-192.png tools/icon.html
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=180,180 --screenshot=public/apple-touch-icon.png tools/icon.html
```

## Deploy

Git integration is connected: `main` deploys production, every branch/PR gets a
preview. Vercel's build command is `npm test`, so bad data
cannot ship. Manual fallback: `vercel --prod`.

## Posting a week (the only recurring job)

Sundays: screenshots land in `checkins/week-N/` (git-ignored) → apply the rules of evidence
(PLAN §9.2) → append to `WEEKS` in `public/data/weeks.js` → `npm test` → push.

## Exposure

Public but unlisted: `noindex` everywhere, no phone numbers, no emails, Venmo
is a plain link. Still — no secrets in this repo.
