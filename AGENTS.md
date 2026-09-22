# STRIDETOBER — agent handoff

Everything a fresh agent needs to continue this project. **Read `docs/PLAN.md`
first** — it is the full design spec and implementation plan (§8 is the task
list). This file is the map, the weekly job, and the traps.

**Live:** https://stridetober.vercel.app (once the Vercel project is linked —
Task 1, needs Dammy's go) · static site, no build, no framework, zero deps.
**Preview locally:** `python3 -m http.server 4173 -d public` ·
**Demo mode:** append `?demo=1` to any URL (fictional tree-named walkers).

---

## 1. What this is

An October step challenge. $20 buy-in by Venmo to Dammy; the pot pays three
places — **50% / 30% / 20%** (`challenge.split`, `challenge.payouts`).
Four weeks, **Sunday 00:00 → Saturday 23:59**; screenshots are due each Sunday
(Oct 11, 18, 25, Nov 1). Most total steps is crowned THE OCTOBER STEP CHAMPION
on Nov 1. Officiated by Dammy Henry, "The *Fairly* Impartial Judge" — he does
not compete by default.

## 2. The voice (most of why this site exists)

- Third person, mock-royal, dry, affectionate. The Judge never says "I" — he
  "notes", "rules", "is *fairly* certain".
- The word **fairly** is the running gag. Italicize it; never overuse it.
- Roast the effort, never the person. Numbers are sacred — never round them
  (`84,210` always; only chart ticks may say `84k`).
- Flyer phrases are verbatim canon (PLAN §6.2). Joke pools live in
  `public/data/copy.js` — extend them there, not in views.
- No Big Steppas names, houses or callbacks anywhere (`tests/data.test.js`
  enforces this).

## 3. The weekly job (Sundays: Oct 11, 18, 25, Nov 1)

1. Screenshots go in `checkins/week-N/<walker-id>/`. **Read every one** —
   money is on it.
2. Rules of evidence (identical every week, full text PLAN §9.2):
   - A week is Sun 00:00 → Sat 23:59. Apps whose week starts Monday misalign
     the headline — **read the per-day bars**.
   - A Saturday-evening screenshot is a partial Saturday.
   - Legend markers can sit on data points; re-read occluded bars.
   - Dailies must sum to the submitted total, or **stop and ask Dammy**.
   - Chart-measured splits go in `derived` and render `~`. Weekly totals are
     never derived.
   - **Never invent a number.** Ambiguous → ask Dammy.
3. Append the `WEEKS` entry in `public/data/weeks.js` (`steps` = authoritative
   weekly totals, `days` = 7 numbers **Sunday-first** or `null`), write the
   `judgeNote` (PLAN §6.11), set `champion`/`payoutSent` on week 4.
4. `npm test` → push → Vercel builds (tests are the deploy gate) → spot-check
   Ledger + Court + one dossier at 375px → tell Dammy.

## 4. Data model (`public/data/`)

`challenge.js` (dates, buy-in, champion) · `walkers.js` (roster; `paid:false` =
tribute pending, excluded from standings) · `weeks.js` (WEEKS + ANNOUNCEMENT) ·
`copy.js` (all pools) · `finds.js` (field journal; photos in `public/finds/`) ·
`demo.js` (`?demo=1` fixture only). Full schemas: PLAN §7.1.

## 5. Gotchas — each one cost time somewhere

- **Never** `new Date("2026-10-11")` — date-only ISO parses as UTC. Use
  `parseLocal()` from `src/lib/time.js`.
- Daily arrays are **Sunday-first** `[Sun…Sat]`. Big Steppas was Monday-first.
- Leaf-burst canvas sizes from `documentElement.clientWidth`, not `innerWidth`.
- Grids: `minmax(min(Npx,100%),1fr)` + `min-width:0` on children, or 320px
  overflows.
- Reduced motion uses **near-zero durations, never `animation:none`** (strands
  elements at opacity 0).
- No `html{scroll-behavior:smooth}`; `history.scrollRestoration="manual"` and
  `scrollTo({behavior:"instant"})` before route swaps.
- Check `{`/`}` balance after editing CSS. A bad slice ships an unstyled page.
- Highlight colors must never collide with a walker color — best day is a gold
  **outline** + 🔥, quietest is a hatch pattern + 😴.
- `esc()` every data-file string before it enters `innerHTML`.
- Fraunces ships at **weight 600 only** (opsz 72) to keep it ~41KB. Never ask it for 700;
  `tests/css.test.js` fails if a stylesheet does.
- Adding a module? Add its `<link rel="modulepreload">` to `index.html` too, or
  `tests/smoke.test.js` fails. Dynamic imports (`demo.js`) are the exception.
- Conventional commits: `feat:` `fix:` `style:` `data(week-N):` `docs:` `test:`.

## 6. Verify (do not skip)

Phone-first: 99% of traffic is small iPhones. After any UI change run the
§9.4 console sweep at **375px and 320px** on every route — target: empty array.
Widths: 320/375/390/430/768/1024/1280/1440. Themes: light+dark × reduced motion
(`?motion=reduce`). `data-eve` on Oct 31.

## 7. Deploy

Today: `npm test`, commit to `main`, push, then `vercel --prod --scope
dammys-projects-9bcc048a`. Vercel runs `npm test` as the build command, so a red
test cannot deploy. Never force past it. Once Vercel's Git integration is connected,
`main` → production and every branch/PR → preview.
