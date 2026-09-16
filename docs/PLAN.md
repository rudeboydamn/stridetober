# Stridetober — Design Spec & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax. **First action of Task 1:** copy this file into the repo as `docs/PLAN.md` so every agent works from the same plan.

**Goal:** A phone-first, desktop-gorgeous site for Stridetober, the October step challenge ($20 buy-in, four weeks). It runs the buy-in drive now, posts weekly results from screenshots, and crowns the October Step Champion on November 1.

**Architecture:** Static site: no framework, no build step, native ES modules, served from `public/` by Vercel. Weekly data lives in plain JS data files that an agent edits from screenshots. Everything else (ranks, honours, charts, phases, countdowns) is computed in the browser from those files plus the viewer's clock. Pure logic lives in `public/src/lib/` and is covered by `node --test`. Vercel runs the tests as its build command, so bad data cannot deploy.

**Tech stack:** HTML, CSS custom properties, vanilla JS modules, hand-rolled SVG charts, a `<canvas>` leaf burst, Google Fonts (Fraunces, Inter, Caveat), Node ≥ 20 `node:test`, Vercel Git integration, private GitHub repo. Zero npm dependencies.

**Spec:** this document. The design spec and the plan are one file on purpose.

**Contents:** 1 Context & decisions · 2 Architecture · 3 Design system · 4 Motion · 5 Screens · 6 Copy deck · 7 Data & logic · 8 Tasks · 9 Agent docs, runbook & verification · 10 Open knobs

---

## 1. Context & decisions

### 1.1 Context
- **The flyer is already out:** "October Steps Challenge — Walk it. Track it. Win it!" Oct 4 until 12:00 AM Nov 1. $20 by Venmo to Dammy before Oct 4. Screenshots go directly to Dammy, not the group chat. Most total steps wins, and the winnings go out by Venmo on Nov 1.
- **Predecessor:** `../big-steppas` (Aug 17 – Sep 12 2026), a static vanilla site. The user loved its mock-royal Judge voice and the agent-posts-weekly workflow. Reuse its proven *patterns*, which are cited per task. Never reuse its names, houses or jokes.
- **Calendar pressure:** today is Wed Sep 16 2026. Kickoff is Sun Oct 4, 18 days away. The first screenshots are due Sun Oct 11. The buy-in page ships first.
- **Many agents** will build and maintain the site concurrently. That calls for small focused files, one shared `AGENTS.md`, a preview deploy per branch, and tests as the deploy gate.

### 1.2 Locked decisions (answered by Dammy)
1. **Schedule.** A week runs Sunday 12:00 AM → Saturday 11:59 PM, so "Saturday night is when the week ends." Screenshots are due **Sunday** for the week that just ended.

   | Week | Walk | Screenshots due |
   |---|---|---|
   | 1 | Sun Oct 4 – Sat Oct 10 | Sun Oct 11 |
   | 2 | Sun Oct 11 – Sat Oct 17 | Sun Oct 18 |
   | 3 | Sun Oct 18 – Sat Oct 24 | Sun Oct 25 |
   | 4 (final; its last day is Halloween) | Sun Oct 25 – Sat Oct 31 | Sun Nov 1 |

   Oct 4, which the flyer calls "Check-in #1", is **Kickoff** and the buy-in deadline. At 12:00 AM on Nov 1 the clock strikes midnight and walking stops.
2. **Walkers.** A brand-new group. No Big Steppas names, houses, callbacks or references appear anywhere on the site. The roster fills in as people pay.
3. **Voice.** "The *Fairly* Impartial Judge" returns: mock-royal, third person, dry and affectionate, now dressed for fall. The word "Fairly" is the running gag.
4. **Pipeline.** Dammy collects screenshots. An agent reads them, edits `public/data/weeks.js`, writes the Judge's note and pushes, and Vercel deploys. No database, no logins, no API.

### 1.3 Defaults chosen (Dammy can override before Task 1)
- **Hosting:** private GitHub repo `rudeboydamn/stridetober`, linked to Vercel project `stridetober` in team `team_kIfFmKlwOwuG0sniRCGfMwiY`. This is the same Git-integration pattern as henrymoney and keystonevale. `main` deploys production, and every branch or PR gets a preview URL. **Confirm with Dammy before creating the repo or the project.**
- **Stack:** static with zero dependencies. It worked for Big Steppas, loads instantly on an iPhone, and has nothing to upgrade mid-challenge.
- **Themes:** light "Parchment", an automatic dark "Harvest Moon", and a one-day "Hallowed Eve" accent on the final day, Oct 31.
- **Time:** all times are the viewer's local wall-clock time, because steps are counted by each walker's own phone calendar. The site never converts time zones.
- **Missing screenshot:** 0 steps for that week, shown as "NO SCREENSHOT", per the flyer's "No screenshot = No steps!"
- **Exposure:** public but unlisted. `noindex`, no phone numbers, no emails, and no payment forms (Venmo is a plain link).

### 1.4 Global constraints (every task implicitly includes these)
- Zero npm dependencies, runtime or dev. Node ≥ 20, used only for tests.
- Only `public/` is deployed. Screenshots (`checkins/`), `docs/`, `tools/` and `tests/` never ship.
- Mobile-first. Verify at 320, 375, 390, 430, 768, 1280 and 1440 px. No horizontal page scroll at any width.
- Text is at least 12px, and body text is 16px. Tap targets are at least 44×44px.
- Text contrast ≥ 4.5:1 and graphics/UI contrast ≥ 3:1 in both themes, enforced by `tests/css.test.js`.
- Animations touch only `transform` and `opacity`, and each one has a `prefers-reduced-motion: reduce` fallback.
- **Step counts are never rounded in the UI.** Always print full digits with commas (`84,210`). Only chart axis ticks may abbreviate (`80k`). This is canon: "NO rounding up".
- Color never carries meaning alone. Pair it with an arrow, emoji, label or pattern.
- Never write `new Date("2026-10-11")`. A date-only ISO string parses as UTC midnight, which is Saturday evening in the Americas. Use `parseLocal()` from `public/src/lib/time.js`.
- Daily arrays are **Sunday-first**: `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]`. Big Steppas was Monday-first, so do not copy its arrays.
- Any string that comes from data files is escaped with `esc()` before it enters `innerHTML`.
- All copy follows the voice guide (§6.1). The flyer phrases in §6.2 appear verbatim.
- **Never invent a step number.** If a screenshot is ambiguous, ask Dammy.
- Commits use conventional prefixes (`feat:`, `fix:`, `style:`, `data(week-N):`, `docs:`, `test:`).

---

## 2. Architecture

### 2.1 File map
```
stridetober/
├── AGENTS.md                 canonical agent handoff: voice, data, weekly runbook, gotchas (§9.1)
├── CLAUDE.md                 one line: @AGENTS.md
├── README.md                 human quickstart: preview, test, deploy, post a week
├── docs/PLAN.md              this plan, copied verbatim
├── package.json              {"name":"stridetober","private":true,"type":"module","scripts":{"test":"node --test"}}
├── vercel.json               framework null, buildCommand "npm test", outputDirectory "public", headers
├── .gitignore                .vercel .DS_Store node_modules .env*
├── .claude/launch.json       local preview: python3 -m http.server 4173 -d public
├── checkins/week-N/<id>/     screenshot evidence, tracked in the private repo, never deployed
├── tools/
│   ├── og.html               1200×630 link-preview card, screenshotted to public/og.png
│   └── icon.html             512×512 app icon, screenshotted to public/icon-*.png
├── tests/
│   ├── time.test.js          schedule and phase math
│   ├── stats.test.js         standings, ranks, honours, conversions
│   ├── data.test.js          integrity of the real data files (the deploy gate)
│   └── css.test.js           brace balance plus WCAG contrast of theme tokens
└── public/                   ← the only deployed directory
    ├── index.html            shell: header, <main id="view">, tab bar, footer, leaf layer, burst canvas
    ├── manifest.webmanifest
    ├── og.png  icon-192.png  icon-512.png  apple-touch-icon.png
    ├── assets/sprite.svg     inline-able SVG symbols (§3.6)
    ├── styles/
    │   ├── tokens.css        raw palette, semantic theme mapping, type, space, radius, motion tokens
    │   ├── base.css          reset, typography, layout primitives, focus, sr-only, skip link
    │   ├── components.css    card, button, seal, ribbon, chip, countdown, timeline, tab bar, toast, sheet
    │   ├── views.css         per-view layout, one commented block per view
    │   └── motion.css        keyframes, leaf layer, reveal/stamp classes, reduced-motion rules
    ├── data/
    │   ├── challenge.js      CHALLENGE: dates, check-ins, buy-in, judge, champion, payoutSent
    │   ├── walkers.js        WALKERS: roster (starts empty)
    │   ├── weeks.js          WEEKS + ANNOUNCEMENT: the weekly edit
    │   ├── copy.js           every joke pool and templated line (§6)
    │   ├── finds.js          FALL_FINDS field journal (R3; starts empty)
    │   └── demo.js           fictional fixture used only with ?demo=1
    └── src/
        ├── main.js           boot, context, router, 1s tick, chrome (header chip, tab bar, sheet)
        ├── lib/
        │   ├── time.js       parseLocal, schedule, phaseOf, countdown split, daypart
        │   ├── stats.js      standings, rankMoves, honours, together
        │   ├── format.js     n, ord, esc, plural, fmtDay, fmtRange, pick, fresh
        │   ├── charts.js     climbChart, harvestChart, totalsChart, dailyChart (SVG strings)
        │   └── fx.js         leaves, burst, countUp, reveal, stamp, toast, flip
        └── views/
            ├── court.js      #/            home, per phase
            ├── ledger.js     #/ledger
            ├── dossier.js    #/walker/:id
            ├── checkin.js    #/check-in
            ├── decree.js     #/rules
            ├── compare.js    #/compare/:a/:b
            ├── excuses.js    #/excuses
            ├── finds.js      #/finds
            └── summons.js    #/invite
```

### 2.2 Module contracts
- **Views** export `render(ctx, params) → string`, which is the view's HTML, and `mount(root, ctx, params) → void`, which wires events and fx after the HTML is inserted. Views never read the clock, `location` or `localStorage` directly. Everything arrives in `ctx`.
- **`ctx`** is built by `main.js` → `buildContext(now)` and has the shape `{ now, phase, challenge, walkers, weeks, standings, prevStandings, honours, copy, finds, demo, theme }`. It is rebuilt at boot, on route change, and whenever the phase signature changes (checked every second, see §7.4).
- **`lib/*`** modules are pure (no DOM), except `fx.js` and `charts.js`. `charts.js` returns strings and never touches the DOM.
- **Data files** import nothing. They `export const` plain objects and arrays so that Node tests can import them directly.
- **One tick:** `main.js` runs `setInterval(tick, 1000)`. The tick updates countdown digits in place and re-renders the current view only when `phaseSignature(ctx)` changes. This is the Big Steppas `tickBell()` pattern.

### 2.3 Why these boundaries
Agents working in parallel collide in shared files. One view per file, one data file per edit cadence (rare / roster / weekly / jokes), and view CSS kept in commented blocks keep concurrent work in separate hunks. The pure libs are the only shared logic, and tests guard them.

### 2.4 Release plan

| Release | Ship by | Contents |
|---|---|---|
| **R1 Muster** | Sat Sep 19 | Scaffold and deploy gate, tokens and chrome, leaf layer, Court (muster phase), The Decree, Check-in page, The Summons, OG image and icons |
| **R2 Walking** | Sat Oct 3 (before kickoff) | Stats lib, Court (walking phase), The Ledger with charts, Dossier, the Judge's Report, timeline states, demo data, fresh-results nudge, Court of Excuses, dry run of the weekly runbook |
| **R3 Finale** | Fri Oct 30 | Hallowed Eve, counting and crowned phases, coronation, the Reading of the Ledger, Settle It (compare), Fall Finds (built when the first photo arrives), birthday line (only if someone has a birthday Oct 4–Nov 1) |

**Parallel lanes:** Tasks 1–3 run in sequence. After Task 3, Tasks 4, 5, 6, 7 and 8 can run in parallel. After Task 9, Tasks 10–14 can run in parallel. R3 tasks are independent of each other.

---

## 3. Design system

### 3.1 Concept: "The Harvest Court"
The layout is clean editorial parchment: generous whitespace and one accent per screen. The cheek comes from four mock-royal autumn props, used as punctuation rather than decoration:
1. **The wax seal.** Maple red, with an embossed oak leaf. It is the Judge's mark on rulings, PAID, OVERRULED and the champion.
2. **Ribbon banners.** Olive, notched at both ends, like the flyer's "Walk it. Track it. Win it!" band. Used for kickers.
3. **Falling leaves.** The ambient layer. Sparse, and always behind content.
4. **Hand-lettered margin notes.** Written in Caveat with a drawn arrow, for example "suspiciously fast 👀".

**Restraint rules** (these are what keep the site "clean"):
- At most one wax seal per viewport.
- At most two margin notes per screen.
- At most 6 leaves on mobile and 10 on desktop.
- At most one looping animation in view besides the leaves.
- No marquees, neon, gradient text or emoji clutter. Headings get at most one emoji.

### 3.2 Color tokens (contrast measured with WCAG 2.x)
`styles/tokens.css` declares **raw** palette variables with a `--light-` or `--dark-` prefix, then maps them to **semantic** variables. `tests/css.test.js` reads the raw variables with a regex, so keep exactly this naming.

| Semantic | Light | Dark | Use | Contrast (light / dark) |
|---|---|---|---|---|
| `--bg` | `#FBF5EA` cream parchment | `#17110D` night walnut | page | — |
| `--surface` | `#FFFDF8` | `#221913` | cards | — |
| `--surface-2` | `#F3E8D6` oat | `#2C211A` | insets, rows, empty states | — |
| `--line` | `#E7D8C2` | `#3A2C22` | hairlines (decorative only) | — |
| `--line-strong` | `#A48A6E` | `#7A624C` | control borders, chart axes | 3.01 / 3.28 vs bg |
| `--ink` | `#2A1C13` espresso | `#F7ECDD` candlelit cream | primary text | 15.19 / 16.03 |
| `--ink-2` | `#5E4838` walnut | `#D2BFAB` | secondary text | 7.87 / 10.50 |
| `--ink-3` | `#7A6352` | `#A89280` | captions, axis labels | 5.18 / 6.32 (4.64 / 5.29 on surface-2) |
| `--accent` | `#E0661B` pumpkin | `#F28A3E` | primary buttons, progress fills | fill only |
| `--on-accent` | `#2A1C13` | `#17110D` | text on accent | 4.78 / 7.56 (**never white**: 3.45) |
| `--accent-ink` | `#A6420E` | `#F7A45F` | links, emphasis, focus ring | 5.68 / 9.29 |
| `--down` | `#A8321A` maple | `#EE7355` | ▼ deltas, urgent, "unpaid" | 6.17 / 6.43 |
| `--up` | `#56692A` olive | `#AFC06D` | ▲ deltas, paid, done | 5.61 / 9.43 |
| `--ribbon` / `--on-ribbon` | `#5F6F2E` / `#FBF5EA` | `#AFC06D` / `#17110D` | ribbon banners | 5.09 / 9.43 |
| `--gold` | `#C9961A` | `#F2C14E` | crown and 🔥 outlines (**always with an ink stroke** in light: 2.46 alone) | — / 11.15 |
| `--gold-ink` | `#8A5F07` | `#F2C14E` | gold text | 5.20 / 11.15 |
| `--eve` | `#5B2B45` plum | `#C99BC0` | Hallowed Eve accent text | 10.31 / 7.96 |
| `--seal` / `--on-seal` | `#A8321A` / `#FBF5EA` (both themes) | same | wax seal and its text | 6.17 |
| `--seal-ring` | `transparent` | `#A89280` | seal outline on dark (the seal alone is 2.79 on dark bg) | — / 6.32 |

**Walker palette.** These are fills and chart lines, assigned in roster order. The walker's color key goes in the data file (`color: "spruce"`). Every fill is ≥ 3:1 against `--bg`.

| Key | Light | Dark | Light vs bg | Dark vs bg |
|---|---|---|---|---|
| `cranberry` | `#A3303F` | `#E0677A` | 6.34 | 5.69 |
| `goldenrod` | `#A87A0B` | `#EBC04F` | 3.55 | 10.86 |
| `moss` | `#5E7F32` | `#9DBF5E` | 4.25 | 8.95 |
| `spruce` | `#2E6E68` | `#5FB3A9` | 5.46 | 7.58 |
| `denim` | `#4B6FA0` | `#86A8D8` | 4.74 | 7.67 |
| `fig` | `#6E3F73` | `#B98AC4` | 7.38 | 6.68 |
| `cinnamon` | `#8F4B29` | `#D08A5E` | 6.04 | 6.66 |
| `rosehip` | `#B34D6B` | `#E68AA6` | 4.62 | 7.62 |

- Pumpkin is deliberately **not** a walker color, so a walker's color can never be mistaken for the brand accent.
- With more than 8 walkers, reuse colors in order. Walkers 9+ get dashed chart lines (`stroke-dasharray: 7 4`) and are still told apart by crest.
- Semantic highlights never recolor a walker's bar. Big Steppas shipped a "worst day" color that matched a walker and made that day invisible. Here, the best day is a `--gold` 2px outline plus 🔥, and the quietest day is a diagonal-hatch `<pattern>` overlay plus 😴.

**`tokens.css` skeleton** (fill in every row from the tables above):
```css
:root {
  /* raw — light */
  --light-bg:#FBF5EA; --light-surface:#FFFDF8; --light-surface-2:#F3E8D6; --light-line:#E7D8C2; --light-line-strong:#A48A6E;
  --light-ink:#2A1C13; --light-ink-2:#5E4838; --light-ink-3:#7A6352;
  --light-accent:#E0661B; --light-on-accent:#2A1C13; --light-accent-ink:#A6420E;
  --light-down:#A8321A; --light-up:#56692A; --light-ribbon:#5F6F2E; --light-on-ribbon:#FBF5EA;
  --light-gold:#C9961A; --light-gold-ink:#8A5F07; --light-eve:#5B2B45; --light-seal-ring:transparent;
  --light-walker-cranberry:#A3303F; --light-walker-goldenrod:#A87A0B; --light-walker-moss:#5E7F32; --light-walker-spruce:#2E6E68;
  --light-walker-denim:#4B6FA0; --light-walker-fig:#6E3F73; --light-walker-cinnamon:#8F4B29; --light-walker-rosehip:#B34D6B;
  /* raw — dark */
  --dark-bg:#17110D; --dark-surface:#221913; --dark-surface-2:#2C211A; --dark-line:#3A2C22; --dark-line-strong:#7A624C;
  --dark-ink:#F7ECDD; --dark-ink-2:#D2BFAB; --dark-ink-3:#A89280;
  --dark-accent:#F28A3E; --dark-on-accent:#17110D; --dark-accent-ink:#F7A45F;
  --dark-down:#EE7355; --dark-up:#AFC06D; --dark-ribbon:#AFC06D; --dark-on-ribbon:#17110D;
  --dark-gold:#F2C14E; --dark-gold-ink:#F2C14E; --dark-eve:#C99BC0; --dark-seal-ring:#A89280;
  --dark-walker-cranberry:#E0677A; --dark-walker-goldenrod:#EBC04F; --dark-walker-moss:#9DBF5E; --dark-walker-spruce:#5FB3A9;
  --dark-walker-denim:#86A8D8; --dark-walker-fig:#B98AC4; --dark-walker-cinnamon:#D08A5E; --dark-walker-rosehip:#E68AA6;
  /* theme-independent */
  --seal:#A8321A; --on-seal:#FBF5EA;
  --leaf-1:#C0452A; --leaf-2:#E0661B; --leaf-3:#D9A21B; --leaf-4:#7C8B3F;

  /* semantic — light (default) */
  color-scheme: light;
  --bg:var(--light-bg); --surface:var(--light-surface); /* …map every raw light token 1:1… */
  --walker-cranberry:var(--light-walker-cranberry); /* …all 8… */
  --shadow-1: 0 1px 0 rgb(42 28 19 / .06), 0 10px 24px -14px rgb(42 28 19 / .28);
  --grain-opacity: .05;
}
/* Dark mapping: write this block ONCE and paste it identically under BOTH selectors below. */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  color-scheme: dark;
  --bg:var(--dark-bg); --surface:var(--dark-surface); /* …map every raw dark token 1:1… */
  --shadow-1: 0 1px 0 rgb(0 0 0 / .4), 0 12px 28px -14px rgb(0 0 0 / .7);
  --grain-opacity: .04;
}}
:root[data-theme="dark"] { /* identical to the block above */ }
```

**Sky tint.** A soft band at the top of the hero, set by `html[data-daypart]`. It only ever sits behind `--ink` text.

| daypart (local hour) | Light | Dark |
|---|---|---|
| `morning` (5–10) | `#FBE7D2` | `#2A2019` |
| `afternoon` (11–16) | `#FCE2B6` | `#2E2316` |
| `dusk` (17–19) | `#F7CDA8` | `#331F1A` |
| `night` (20–4) | `#E6DCD0` | `#1F1A2A` |
| `html[data-eve]` (Oct 31, overrides) | `#EADCE6` | `#241A2C` |

Hero background: `linear-gradient(180deg, var(--sky) 0%, transparent 70%)`.

**Paper grain.** `body::before` is `position:fixed; inset:0; pointer-events:none; z-index:0; opacity:var(--grain-opacity)`. Its background is a 160×160 SVG data-URI tile containing `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>`. It is an image tile, so no live filter runs on scroll.

### 3.3 Typography
One stylesheet request (verified to return HTTP 200):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,600..700,100,0;1,9..144,600..700,100,1&family=Inter:wght@400..700&family=Caveat:wght@600&display=swap">
```

| Role | Font | Settings |
|---|---|---|
| Display (h1–h3, big numbers) | Fraunces | wght 600, SOFT 100, `font-optical-sizing:auto`, letter-spacing −0.01em, line-height 1.04 |
| Wordmark | Fraunces | "Stride" upright wght 700; "tober" *italic*, which carries WONK 1 via the URL, in `--accent-ink` |
| UI and body | Inter | 400 body, 600 labels, 700 emphasis. Numbers use `font-variant-numeric: tabular-nums` |
| Kicker | Inter | 600, 12px, uppercase, letter-spacing .14em, `--ink-2` |
| Margin notes | Caveat | 600, 21px (24px ≥1024), `--accent-ink`, `rotate(-3deg)` |

Fluid type scale (`tokens.css`):
```css
--step--1: clamp(.75rem, .72rem + .15vw, .8125rem);   /* 12–13  captions (floor 12px) */
--step-0:  clamp(1rem, .96rem + .2vw, 1.0625rem);     /* 16–17  body */
--step-1:  clamp(1.1875rem, 1.1rem + .45vw, 1.375rem);/* 19–22  card titles */
--step-2:  clamp(1.5rem, 1.3rem + 1vw, 2rem);         /* 24–32  section heads */
--step-3:  clamp(2.125rem, 1.7rem + 2.2vw, 3.25rem);  /* 34–52  page titles, dossier totals */
--step-4:  clamp(2.75rem, 2rem + 4.5vw, 5.5rem);      /* 44–88  hero line, countdown digits */
```
- Text wrapping: `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs (progressive enhancement).
- Count-up numbers set `min-width: <final length>ch` before animating, so Fraunces' proportional digits cannot jitter.

### 3.4 Space, radius, layout
- Spacing: `--s-1:4px --s-2:8px --s-3:12px --s-4:16px --s-5:24px --s-6:32px --s-7:48px --s-8:64px --s-9:96px`
- Radius: `--r-sm:8px --r-md:14px --r-lg:22px --r-pill:999px`
- Gutter: `--gutter` is 16px at the base, 20px ≥480, 32px ≥768 and 48px ≥1024. `.wrap { width:min(100% - 2*var(--gutter), var(--max)); margin-inline:auto }`, where `--max` is 1120px, rising to 1200px ≥1440.
- Section rhythm: 48px between sections on mobile, 72px on desktop.
- Grids: always `repeat(auto-fill, minmax(min(160px, 100%), 1fr))`, and give every grid child `min-width:0`. Both are Big Steppas gotchas.
- `html { overflow-x: clip; -webkit-text-size-adjust: 100% }`. Fixed decorative layers can otherwise widen the page on iOS.
- Breakpoints: **base** 320–767, where the bottom tab bar is present · **768** gives two-column tiles · **1024** swaps the tab bar for top navigation and enables split layouts · **1440** widens `--max`.

### 3.5 Components (visual spec)
- **Card.** `--surface` background, 1px `--line` border, `--r-md` radius, padding 24/16 on mobile and 32 on desktop. An interactive card adds `--shadow-1`. Hover (pointer devices only) lifts it: `translateY(-2px)`, 200ms.
- **Buttons.**
  - *Primary:* pill, min-height 48px, padding 0 22px, `--accent` background, `--on-accent` text, Inter 600 16px, `box-shadow: inset 0 -2px 0 rgb(0 0 0 / .12)`.
  - *Secondary:* transparent, 1.5px `--line-strong` border, `--ink` text.
  - *Text link:* `--accent-ink`, underline offset 3px, thickness 1.5px.
  - *Press* (all buttons): `scale(.97) translateY(1px)`, 120ms.
- **Focus.** `outline: 3px solid var(--accent-ink); outline-offset: 3px; border-radius: inherit`. Never removed.
- **Ribbon.** `--ribbon` background, `--on-ribbon` Inter 700 12px uppercase with .16em tracking, padding 6px 20px, `clip-path: polygon(0 0,100% 0,calc(100% - 10px) 50%,100% 100%,0 100%,10px 50%)`, `rotate(-1.5deg)`.
- **Wax seal.** Built on the `#seal` symbol (a scalloped circle with 18 lobes). Sizes are 36, 56 and 96px.
  - Fill `--seal`; `stroke: var(--seal-ring)` at 1.5px.
  - Emboss: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / .28), transparent 45%)` overlay plus `drop-shadow(0 1px 0 rgb(0 0 0 / .25))`.
  - Text is `--on-seal`, Inter 800, 9–12px uppercase, on two short lines (e.g. `PAID` / `$20`). A small oak leaf is embossed above the text on 56px+ seals.
  - The seal sits at `rotate(-8deg)`.
- **Ink stamp** (rectangular: "NO SCREENSHOT = NO STEPS", "OVERRULED", "UNPAID"). 2px `--down` border and text, Inter 800 uppercase, `rotate(-6deg)`. The inked texture is `-webkit-mask-image` / `mask-image` using the grain tile at 92% alpha.
- **Walker crest.** A 40px circle (56px in the dossier hero) filled with `color-mix(in srgb, var(--c) 18%, var(--surface))`, a 2px `var(--c)` ring, and the emoji at 22px. The markup is `style="--c:var(--walker-<key>)"`.
- **Chips.** 32px visual height with a 44px hit area via `padding-block` and an `::after` inset of −6px. A walker chip shows crest + short name.
- **Harvest line** (progress bar). 10px track in `--surface-2`, fill `var(--c, var(--accent))`, radius pill. `::after` draws a 14px leaf at the end cap.
- **Countdown.** Four cells: DAYS, HRS, MIN, SEC. Each digit sits in its own box, 0.62em wide, with Fraunces `--step-4` digits and an Inter 600 11px uppercase `--ink-3` label. Cells are separated by colons in `--ink-3`. Card padding is 24px.
- **Timeline.** Vertical on mobile, horizontal at ≥768. Nodes are 28px circles connected by a 2px `--line-strong` rail.
  - Node states: `done` (olive ✓), `today` (accent ring with candle flicker), `counting` (tally icon), `upcoming` (hollow), `final` (🎃 badge).
- **Toast** ("a missive from the bench"). Parchment card with a 36px seal on the left. `role="status"`. Sits above the tab bar (`bottom: calc(76px + env(safe-area-inset-bottom))`). Max width 420px.
- **Sheet** (mobile "More"). Slides up from the bottom, has a 24px grabber, focus trap, and closes on Escape or scrim tap. Reuse the Big Steppas `setDrawer()` reflow pattern: force a reflow, then toggle a class (no rAF).
- **Charts.**
  - Gridlines `--line`, dashed `3 4`. Axis labels Inter 12px `--ink-3`.
  - Lines 3px with round caps. Points r4.5 with a 2px `--surface` stroke. Bars have `rx 4`.
  - Averages are a 2px dashed `--accent-ink` line whose label sits in the caption **below** the chart, never inside the plot.
  - On phones, the SVG `viewBox` shrinks (396 wide vs 620) so labels render near 1:1. This is Big Steppas `chartDims()`.
  - Every chart is `role="img"` with an `aria-label` summary, followed by a `<details><summary>See the numbers</summary><table>…</table></details>`.

### 3.6 Iconography & illustration
`public/assets/sprite.svg` holds `<symbol>`s. Each is single-color and uses `currentColor` unless noted:
- `leaf-maple`, `leaf-oak`, `leaf-birch`, `acorn`, `pumpkin`, `jack` (jack-o'-lantern)
- `seal` (scalloped), `gavel`, `wreath` (oak-leaf crown, two-tone `--gold` plus an `--ink` stroke)
- `sneaker`, `candle`, `moon`, `bat`, `tally` (four strokes and a slash), `bottle` (the flyer's water bottle)
- UI: `check`, `chevron`, `share`, `copy`, `lock`

Other rules:
- Walkers use fall emoji as crests: 🍁 🍂 🎃 🌰 🍎 🦊 🦉 🐿️ 🍄 🌽 🥧 🦔 🍐 🧣 🦃 🌾 🍯 ☕. Each crest is unique per walker.
- **No Venmo logo** (trademark). The pay button is text plus a coin glyph (🪙).
- The favicon is an SVG data URI containing the 🍂 emoji. The home-screen icon is a pumpkin rounded square with a cream maple leaf and a small "S" set in Fraunces.

---

## 4. Motion system — "leaves, not lasers"
Things settle the way something light lands. UI feedback is fast (120–320ms), ceremonies are medium (560–900ms), and ambience is slow (12–22s).
- Animate only `transform` and `opacity`. The single exception is `stroke-dashoffset` draw-ons on small SVG icons.
- Every motion has a reduced-motion fallback.

### 4.1 Tokens (`tokens.css`)
```css
--ease-settle: cubic-bezier(.22,1,.36,1);   /* entrances, fills, FLIP */
--ease-swing:  cubic-bezier(.45,.05,.55,.95);/* sway loops */
--ease-stamp:  cubic-bezier(.2,.9,.3,1.35);  /* seals, pops — slight overshoot */
--ease-exit:   cubic-bezier(.4,0,1,1);
--dur-press:120ms; --dur-quick:200ms; --dur-enter:320ms; --dur-stamp:560ms; --dur-count:900ms;
```

### 4.2 Reduced motion (`motion.css`)
Use near-zero durations, **not** `animation:none`. `animation:none` strands elements on their first keyframe (opacity 0), whereas a near-zero duration lets `both`/`forwards` land on the final state.
```css
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .leaves{display:none}
}
html[data-motion="reduce"] *, html[data-motion="reduce"] *::before, html[data-motion="reduce"] *::after {
  animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important }
html[data-motion="reduce"] .leaves{display:none}
```
In JS, `fx.reduced()` returns `matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'`. Every fx function checks it first. `?motion=reduce` sets `data-motion` for QA.

### 4.3 Keyframes (`motion.css`, verbatim)
```css
@keyframes leaf-fall   {from{transform:translate3d(0,-12vh,0)}to{transform:translate3d(0,112vh,0)}}
@keyframes leaf-sway   {0%,100%{transform:translateX(-18px) rotate(-8deg)}50%{transform:translateX(18px) rotate(10deg)}}
@keyframes leaf-flutter{0%,100%{transform:rotateX(0) rotateY(0)}50%{transform:rotateX(55deg) rotateY(25deg)}}
@keyframes view-in     {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fade-out    {to{opacity:0}}
@keyframes settle      {from{opacity:0;transform:translateY(14px) rotate(-.4deg)}to{opacity:1;transform:none}}
@keyframes digit-out   {to{opacity:0;transform:translateY(60%) rotate(6deg)}}
@keyframes digit-in    {from{opacity:0;transform:translateY(-60%) rotate(-4deg)}to{opacity:1;transform:none}}
@keyframes seal-stamp  {0%{opacity:0;transform:scale(1.8) rotate(-18deg)}60%{opacity:1;transform:scale(.94) rotate(-6deg)}80%{transform:scale(1.03) rotate(-9deg)}100%{transform:scale(1) rotate(-8deg)}}
@keyframes slam        {0%{opacity:0;transform:scale(2.2) rotate(-14deg)}55%{opacity:1;transform:scale(.92) rotate(-5deg)}100%{transform:scale(1) rotate(-6deg)}}
@keyframes thud        {0%,100%{transform:none}30%{transform:translateY(2px)}60%{transform:translateY(-1px)}}
@keyframes gavel       {0%{transform:rotate(0)}40%{transform:rotate(-35deg)}70%{transform:rotate(10deg)}100%{transform:rotate(0)}}
@keyframes draw        {to{stroke-dashoffset:0}}
@keyframes ring        {from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(1.18)}}
@keyframes flicker     {0%,100%{opacity:1}42%{opacity:.88}47%{opacity:.62}52%{opacity:.94}70%{opacity:.8}}
@keyframes blink       {50%{opacity:.35}}
@keyframes tally       {0%,12%{stroke-dashoffset:var(--len)}20%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:0;opacity:0}}
@keyframes nope        {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes pop         {from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes bob         {0%,100%{transform:translateY(-2px)}50%{transform:translateY(2px)}}
@keyframes crown-drop  {0%{opacity:0;transform:translateY(-40px) rotate(-10deg)}70%{opacity:1;transform:translateY(3px) rotate(2deg)}100%{transform:none}}
@keyframes flap        {0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}}
@keyframes toast-in    {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes tittle-sway {0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes pulse       {50%{opacity:.6}}
```

### 4.4 Motion catalog

| # | Name | Trigger / where | Spec | Reduced motion |
|---|---|---|---|---|
| M1 | **Leaf fall** | Always on, every page | See §4.5. 6 leaves under 768px, 10 at ≥768. Each leaf is 3 nested layers: `leaf-fall` (linear, 14–22s) › `leaf-sway` (swing ease, 3.2–4.6s) › `leaf-flutter` (1.8–2.6s). Opacity .75 light / .55 dark. Behind all content (`z-index:0`, content `z-index:1`). | Layer hidden |
| M2 | **Leaf burst** | Week results reveal, coronation, "Summon the Leaves", sworn kit list, gavel easter egg | Canvas particles, see §4.6 | 400ms `pulse` on the trigger element |
| M3 | **Route change** | Hash change | `document.startViewTransition(swap)`. `::view-transition-old(root)` gets `fade-out 160ms var(--ease-exit)`, and `::view-transition-new(root)` gets `view-in 320ms var(--ease-settle)`. Fallback: `.view-enter{animation:view-in 320ms var(--ease-settle) both}`. Before swapping, always `scrollTo({top:0,behavior:"instant"})` with `history.scrollRestoration="manual"`, and **never** set `html{scroll-behavior:smooth}` (both are Big Steppas gotchas). | Instant swap |
| M4 | **Settle-in reveal** | Sections and tiles with `[data-reveal]` as they enter the viewport | IntersectionObserver (threshold .15, rootMargin `0px 0px -10% 0px`, unobserve after the first hit) adds `.is-in`, which runs `settle 560ms var(--ease-settle) both` with `animation-delay: calc(min(var(--i,0),8) * 60ms)`. Hide before reveal **only** under `html.js [data-reveal]:not(.is-in){opacity:0}`, so the page still works without JS. | Opacity only |
| M5 | **Count-up** | Big totals, the purse, "together" tiles on first reveal | rAF from `from` (default 0) to `to` over 900ms, easeOutCubic `1-(1-t)**3`, formatted with `n()`. Set `aria-label` to the final value immediately, and set `min-width` in `ch` first. | Final value shown at once |
| M6 | **Falling digits** | Countdown digit changes | Each digit is a `display:inline-grid; overflow:hidden` cell. The old glyph runs `digit-out 380ms` and is removed on `animationend`; the new glyph runs `digit-in 380ms`, both on `--ease-settle`. Only changed digits animate. | Text swap |
| M7 | **Urgency** | Under 48h to the target | Colons `blink 1s steps(1) infinite`; cell borders and the header chip turn `--down`. **Witching hour** (under 1h): card background `color-mix(in srgb,var(--eve) 10%,var(--surface))` and the candle icon `flicker 3s infinite`. | Static colors |
| M8 | **Wax seal stamp** | PAID seals on the Roll, champion seal, sworn kit list | `.stamp{animation:seal-stamp var(--dur-stamp) var(--ease-stamp) both; animation-delay:calc(var(--i,0)*90ms)}`. The parent card runs `thud 240ms` starting 310ms after its seal. | Seal appears at −8° |
| M9 | **Ink slam** | OVERRULED, NOPE, NO SCREENSHOT stamps | `slam 480ms var(--ease-stamp) both` plus parent `thud` | Appears at −6° |
| M10 | **Gavel** | Judge crest tap; a ruling in the Court of Excuses | `gavel 280ms var(--ease-settle)`, `transform-origin: 80% 80%` | None |
| M11 | **Margin note** | Parent section reveal | The note fades in over 300ms, then its SVG arrow runs `stroke-dasharray:var(--len); stroke-dashoffset:var(--len); animation: draw 700ms ease-out 200ms forwards`. Set `--len` from `path.getTotalLength()`. | Instant |
| M12 | **Harvest line** | Progress bars on reveal | The fill starts at `transform:scaleX(0)` with `transform-origin:left` and transitions to `scaleX(var(--p))` over 900ms `--ease-settle`. The leaf end-cap rides a sibling that moves `translateX(calc(var(--p) * 100%))`. | Final width |
| M13 | **Reading of the Ledger** | First visit after a new week is posted (R3) | See §4.7 | Final order, deltas visible |
| M14 | **Buttons** | Hover (pointer devices) / press / buy-in CTA | Hover `translateY(-1px)` 200ms. Press `scale(.97) translateY(1px)` 120ms. During the muster phase only, the Venmo CTA has a `::after` ring (`box-shadow:0 0 0 2px var(--accent)`) running `ring 2.4s var(--ease-settle) infinite`. | Static |
| M15 | **Tab leaf** | Active tab change | A 12px leaf on `.tabbar::before` moves `translateX(calc(var(--tab) * 100%))` over 320ms; the active icon lifts `translateY(-2px)`. | Jumps |
| M16 | **Header auto-hide** | Scroll | rAF-throttled, passive listener. Hide when `y>120 && y>lastY+5`; show when `y<lastY-5 \|\| y<120`. `translateY(-100%)` over 240ms. Bottom tab bar never hides. | Header stays |
| M17 | **Toast** | `fx.toast(html)` | `toast-in 320ms`; out is opacity 0 + `translateY(8px)` over 200ms. Auto-dismiss after 6s. Only one at a time. | Fade only |
| M18 | **Counting tally** | "The Judge is counting" states | Five tally strokes, each `tally 2.4s infinite` staggered 120ms | Static tally |
| M19 | **Group-chat decoy** | Tap "Post it in the group chat" | `nope 360ms` on the button, the label becomes "NOPE." for 1500ms, and a toast (§6.9) appears | Label and toast only |
| M20 | **Water bottle** | Tap the bottle sticker | `rotate(-18deg)` over 300ms, back over 400ms. A speech bubble `pop`s with a random `BOTTLE` line and hides after 3s. | Bubble only |
| M21 | **Rake the leaves** | Pointer moving across the footer leaf pile | See §4.8 | Tap increments the counter only |
| M22 | **Wordmark** | Always | The dot of the "i" in "Stride" is a 7px maple leaf with `tittle-sway 3s ease-in-out infinite` and `transform-origin: 50% 100%`. On Hallowed Eve, the "o" in "tober" becomes the `jack` symbol with `flicker 3s infinite`. | Static |
| M23 | **Bats** | Hallowed Eve only | 2 of the leaves swap to the `bat` symbol with `flap 180ms infinite`, tinted `--ink-2` | Hidden |
| M24 | **Coronation** | Crowned phase, first view per device | The wreath runs `crown-drop 700ms var(--ease-stamp)` then `bob 3s ease-in-out infinite`. The seal stamps at +500ms and a 110-leaf burst fires at +300ms. `localStorage["stridetober:crowned-seen"]="1"`; later views only bob. | Static crown |
| M25 | **Candle** | Timeline "today" node, witching hour | `flicker 3s infinite` | Static |

### 4.5 Leaf layer (`fx.leaves(container, { eve })`)
- Markup per leaf: `<span class="leaf" style="--x:12%;--dur:17s;--delay:-6s;--sway:3.8s;--flip:2.2s;--size:22px;--tint:var(--leaf-2)"><span class="leaf-sway"><svg class="leaf-flip"><use href="/assets/sprite.svg#leaf-maple"/></svg></span></span>`
- Random values come from a seeded PRNG (`mulberry32(1004)`), so layouts are identical between reloads and screenshots are deterministic.
- Ranges: `--x` 0–96% · `--dur` 14–22s · `--delay` between −dur and 0 (the screen is already populated at load) · `--sway` 3.2–4.6s · `--flip` 1.8–2.6s · `--size` 14–28px · `--tint` one of `--leaf-1…4` · shape one of maple/oak/birch.
```css
.leaves{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;contain:strict}
.leaf{position:absolute;top:0;left:var(--x);width:var(--size);height:var(--size);color:var(--tint);opacity:.75;
  animation:leaf-fall var(--dur) linear var(--delay) infinite;will-change:transform}
.leaf-sway{display:block;animation:leaf-sway var(--sway) var(--ease-swing) infinite}
.leaf-flip{display:block;width:100%;height:100%;animation:leaf-flutter var(--flip) ease-in-out infinite}
```

### 4.6 Leaf burst (`fx.burst({ x, y, count })`)
- **Canvas.** `#burst` is `position:fixed; inset:0; z-index:90; pointer-events:none`. Size it from `document.documentElement.clientWidth/clientHeight`, **not** `innerWidth`, which includes the scrollbar and widened the page on Big Steppas. Scale by `dpr = Math.min(2, devicePixelRatio)`.
- **Sprites.** On first use, pre-render 3 leaf shapes × 4 tints onto 32×32 offscreen canvases. `fx.js` holds the Path2D strings.
- **Particles.** Each one is `{x, y, vx: rand(-6,6), vy: rand(-11,-6), rot: rand(0,2π), vr: rand(-.12,.12), phase: rand(0,2π), s: rand(.6,1.1), sprite}`.
- **Per frame.**
  - `vx *= .985; vy = vy*.985 + .18; x += vx + Math.sin(t*.05 + phase)*.6; y += vy; rot += vr`
  - Draw each particle with `setTransform` + `drawImage`, and drop it once `y > h + 40`.
  - When no particles remain, clear the canvas and stop the rAF loop.
- **Defaults.** `count` is 60 under 768px and 110 at ≥768. The origin is `(w/2, h*.25)` unless given.

### 4.7 Reading of the Ledger (`fx.flip(listEl, applyNewOrder)`)
1. On the Ledger and in the Court's ledger preview, compare `localStorage["stridetober:last-seen-week"]` (wrapped in try/catch) with the latest posted week. If it is lower, render the rows in the **previous** week's order with deltas hidden and a "Skip ▸" text button. Then wait 600ms.
2. Record each `[data-id]` row's `getBoundingClientRect().top`. Call `applyNewOrder()`, which re-appends the rows in their new order. Set each row's `transform: translateY(oldTop - newTop)` with no transition, force a reflow (`void el.offsetWidth`), then apply `transition: transform 700ms var(--ease-settle) calc(var(--i) * 40ms)` and `transform: none`.
3. At 700ms, the ▲▼ deltas `pop` (240ms `--ease-stamp`). If the leader changed, run `fx.burst()` and toast "A new name at the top of the ledger. The Judge is as surprised as you are."
4. Write the new week to `last-seen-week`. "Skip ▸" jumps straight to the final state.

### 4.8 Rake the leaves (footer)
- **Pile.** `.leaf-pile` holds 14 static sprite leaves at fixed positions and has `touch-action: pan-y`, so the page still scrolls vertically.
- **Kick.** On `pointermove`, every leaf within 48px of the pointer gets `--kx`/`--ky` (±10–26px away from the pointer) and `--kr` (±40deg). Transition 260ms `--ease-settle`. After 1200ms without movement, all leaves return over 900ms.
- **Counter.** It counts kicked leaves: "Leaves raked: 37 · Steps credited: 0 · The Judge checked."

## 5. Screens

All screens share the chrome in §5.1, render into `<main id="view">`, and obey the restraint rules in §3.1. Every screen has a per-phase content matrix; phases come from `phaseOf()` (§7.4). Views are strings from `render()` plus a `mount()` for wiring (§2.2).

### 5.1 Chrome (shared)

- **Header.** `.wrap` row, height 64px. Left: wordmark "Stridetober" — "Stride" Fraunces 700 upright, "tober" Fraunces 700 italic in `--accent-ink`; the dot of the "i" is the leaf tittle (M22). Right: the phase chip — a 32px pill in `--surface-2` with Inter 600 12px uppercase text in `--ink-2` (`MUSTER`, `WEEK 1`…`WEEK 4`, `COUNTING`, `EVE 🎃`, `CROWNED`). On Hallowed Eve the chip goes `--eve`. Auto-hides on scroll (M16); the header is `position:sticky; top:0; z-index:40` with a `backdrop-filter: blur(10px)` over `color-mix(in srgb, var(--bg) 82%, transparent)`.
- **Nav.** `<1024px`: bottom tab bar, fixed, `z-index:50`, `--surface` with a 1px `--line` top border, `padding-bottom: env(safe-area-inset-bottom)`. Four tabs: **Court** (gavel icon), **Ledger** (tally icon), **Check-in** (check icon), **More** (chevron — opens the sheet). 56px icon+label columns, active tab in `--accent-ink`, tab leaf indicator (M15). `≥1024`: the tab bar is replaced by inline links in the header (Court · Ledger · Check-in · Decree · Excuses · Finds · Summons — only links to built views; Finds appears in R3), and "More" disappears.
- **Sheet** ("More", mobile only). Slides up (§3.5 Sheet): The Decree, Settle It, Court of Excuses, Fall Finds (R3), The Summons, then a **Theme** row cycling Auto → Dark → Light, persisted in `localStorage["stridetober:theme"]` and applied as `html[data-theme]`. Focus trap, Escape and scrim close, reflow-toggle pattern from Big Steppas `setDrawer()`.
- **Footer.** `.wrap`, `margin-top: var(--s-9)`, 1px `--line` top border. Contents: the leaf pile (M21, 48px tall) with the rake counter line; then a two-line sign-off — `"Fairly impartial. Entirely unforgiving." — The Judge` in Caveat `--ink-2`, and the tiny print `Stridetober · Oct 4 – Nov 1 · unlisted, noindex, judge's rulings fairly final`. `margin-bottom` clears the tab bar on mobile (`calc(72px + env(safe-area-inset-bottom))`).
- **Announcement banner.** A slot directly under the header, rendered when `ANNOUNCEMENT` is live (§7.1). Card in `--surface` with a `--gold-ink` kicker. `mode:"getwell"` replaces the Court's standings preview entirely (Big Steppas pattern — the banner *is* the news); `mode:"note"` is a dismissible banner (dismissal remembered in `localStorage["stridetober:anno-dismissed:<hash>"]`).
- **Leaf layer + burst canvas** (§4.5, §4.6) exist once in `index.html`, behind everything (`z-index:0`) and above everything (`z-index:90`) respectively.
- **Route map.**

  | Hash | View file | Title pattern |
  |---|---|---|
  | `#/` | court.js | Stridetober |
  | `#/ledger` | ledger.js | The Ledger — Stridetober |
  | `#/walker/:id` | dossier.js | `<Name>` — Stridetober |
  | `#/check-in` | checkin.js | Check-in — Stridetober |
  | `#/rules` | decree.js | The Decree — Stridetober |
  | `#/compare` `#/compare/:a/:b` | compare.js | Settle It — Stridetober |
  | `#/excuses` | excuses.js | Court of Excuses — Stridetober |
  | `#/finds` | finds.js | Fall Finds — Stridetober |
  | `#/invite` | summons.js | The Summons — Stridetober |

- **Unknown route** renders a card: heading `Off the trail.`, body `This path is not on the map. The Judge suggests turning back.`, primary button `Back to Court` → `#/`.
- **Document title** updates on every route change via `document.title`. Route change uses M3.

### 5.2 The Court — `#/`

Home. Its content is a stack of cards in `.wrap` (single column mobile; two-column `[1.2fr .8fr]` grid for secondary cards at ≥1024 — hero and countdown always full-width). Section spacing per §3.4.

**Muster phase** (now → Oct 4 00:00), top to bottom:

1. **Hero.** Sky tint band (§3.2) behind a `.wrap` block, `padding-block: var(--s-8)`. Olive ribbon kicker `OCTOBER STEPS CHALLENGE` (§3.5 ribbon). H1 `--step-4`: `Walk it. Track it. Win it!` Sub in `--ink-2` `--step-1`: `Four weeks. Twenty dollars. One champion. The leaves are watching.` Right of it ≥1024 (stacked below on mobile): the pair-of-sneakers + water bottle vignette — `sneaker` symbol 120px next to the `bottle` sticker (tap → M20). Margin note on the hero: `stretch now, thank us later` with a drawn arrow to the CTA row (M11).
2. **Countdown card.** Label `until the walking begins` (§6.4), target Oct 4 00:00 local, four-cell countdown (§3.5), falling digits (M6), urgency states (M7).
3. **Buy-in card.** Left: wax seal 56px embossed `$20`. Right: heading `The Tribute`, body `Send your $20 to Dammy BEFORE October 4th!` (verbatim), primary button `Pay the Tribute 🪙` → `CHALLENGE.venmoUrl` (new tab, `rel="noopener"`), with the muster-only pulse ring (M14). Under the button, caption `--ink-3`: `Venmo @Dammyhenry`. Bottom-right of the card, ink stamp `NO $20 = NO COMPETING!` (§3.5 stamp, static here).
4. **The Roll.** Heading `The Roll of the Sworn`, sub `Walkers appear here as their tribute lands.` Roster grid (`auto-fill, minmax(min(160px,100%),1fr)`): each card = 40px crest, name, and either a PAID wax seal (stamp M8, `thud` on the card) or a hollow `--line-strong` outline seal captioned `tribute pending`. Empty state: centered card, hollow seal, `The Roll awaits its first tribute.` + margin note `the early bird avoids the guilt`.
5. **What you need.** Heading `The Sworn Kit`. Three check rows: `A step tracker` ✓, `Two functioning feet` ✓, then `NO EXCUSES` rendered as a red ink stamp, not a checkbox. Each ✓ draws on (M11-style `draw`) as the card reveals.
6. **How it works** — three compact cards in a row (stack on mobile): `Walk` `Oct 4 – Nov 1. Every step counts.` / `Report` `Screenshot your week. Send it DIRECTLY TO DAMMY — NOT THE GROUP CHAT!` / `Win` `Most total steps takes the pot. Crowned November 1.` Link `Read the full Decree →` to `#/rules`.
7. **Dammy's Job** card — kicker `DAMMY'S JOB:`, the five flyer bullets verbatim (§6.2).

**Walking phase** (Oct 4 → Nov 1 00:00):

1. Hero compresses: ribbon `WEEK n OF 4`, H1 from `COURT_WALKING` pool (§6.4), sky tint stays.
2. Countdown → `nextMilestone()` (§7.4): mid-week `until the week is called` (Sat 23:59:59); on Sunday with an unposted week, `until screenshots are past due` (Sun 23:59:59) plus the tally (M18) beside the label `The Judge is counting`.
3. **Announcement slot** if live.
4. **Ledger preview** card — top 3 rows only (rank medallion, crest, name, total `n()`, Δ arrow), `See the full Ledger →`. If the newest week is unposted, rows show previous posted standings and a `--ink-3` caption `as last counted`. If a `getwell` announcement is live this card is replaced by it.
5. **The Judge's Report** card — wax seal 36px left, the latest `judgeNote` in Caveat-sized Fraunces italic (20px), caption `— The Fairly Impartial Judge, Week n`.
6. **Together** tile — group total with M5 count-up, then three small stat chips: `≈ n miles`, `n marathons`, and one rotating fun conversion from `TOGETHER_LINES` (§6.6).
7. Margin note under the ledger preview, from `MARGIN_NOTES`.

**Counting phase** (Nov 1 00:00 → week 4 posted): hero `The Final Bell has rung.` + sub `The Judge is counting. The ledger is frozen-ish.` Countdown card swaps to the tally animation (M18) — no digits. Ledger preview labeled `unofficial`. Margin note: `he counts in cash and in steps`.

**Crowned phase** (week 4 posted): **Coronation hero** (M24): the `wreath` symbol crown-drops over the champion's 56px crest; H1 `THE OCTOBER STEP CHAMPION`; the champion's name and total (M5); a 96px wax seal stamps `CHAMPION` at +500ms; 110-leaf burst at +300ms (once per device — `localStorage["stridetober:crowned-seen"]`). Below: podium card (top 3, medal emoji 🥇🥈🌰 — third place gets a chestnut, this is canon), `Full Ledger →`, and a payout line: `payoutSent ? "The pot has been sent. The matter is settled." : "Dammy will send the pot by Venmo on November 1st."` Then the standard together tile and Judge's Report.

### 5.3 The Ledger — `#/ledger`

The standings. Heading `The Ledger`, kicker ribbon `WEEK n OF 4` (or phase-appropriate).

- **Muster:** empty state card — hollow seal, `The ledger opens at kickoff.`, countdown chip to Oct 4, link to the Roll on `#/`.
- **Walking/counting/crowned:** standings first, charts second.
  - **Rows, mobile:** card per walker — rank numeral (Fraunces `--step-1`), 40px crest, name (short on ≤375), total `n()` right-aligned tabular-nums, Δ vs previous posted week (`▲2` `--up` / `▼1` `--down` / `—` `--ink-3`; always a glyph, never color alone), and a harvest line (§3.5) scaled to the leader's total. A `NO SCREENSHOT` week shows a 28px ink stamp on the row, and its week cell shows the stamp not a dash.
  - **Rows, ≥768:** real `<table>`: Rank · Walker · W1 · W2 · W3 · W4 · Total · Δ. Totals column in Fraunces. Champion row (crowned phase) gets a 2px `--gold` outline + `wreath` icon.
  - **Reading of the Ledger** (M13/§4.7) applies to this list.
  - **Charts:** `climbChart` — cumulative steps per walker across posted weeks (walker colors, 9+ walkers dashed §3.2); `totalsChart` — horizontal bars, same scale. Charts per §3.5 rules: `role="img"`, `aria-label`, `<details>` data table below.
  - **Honours shelf** under the charts — chip row of awarded honours (§7.5): `🍂 Top of the Leaf Pile — <name>` etc. Unawarded honours are not shown.
  - Counting phase adds the banner `The Judge is counting — nothing below is final.` Crowned phase changes the kicker to `FINAL` and the sub to `So ordered. The Judge is *fairly* confident in the arithmetic.`

### 5.4 Dossier — `#/walker/:id`

One walker, examined.

- **Hero card:** 56px crest, name (Fraunces `--step-3`), rank chip `3rd` + Δ, and the Judge's one-line assessment picked from `DOSSIER_LINES` by rank band (§6.5). Stats row: `TOTAL` (count-up M5) · `PER DAY AVG` · `GAP TO LEAD` (`n` behind / `the lead` / `n clear`).
- **Week cards:** one per posted week — `WEEK n`, total, and `dailyChart` (7 bars, **Sunday-first** `S M T W T F S` labels; best day = 2px `--gold` outline + 🔥, quietest = diagonal-hatch `<pattern>` + 😴 — §3.2). `days[id] === null` → `dailies pending — the Judge accepted the total` caption. `steps[id] === null` → `NO SCREENSHOT` stamp on the card and zero-height bars. `derived` weeks get the `~` marks and the `DERIVED_NOTE` details-block (same rules as Big Steppas — totals are never derived, only splits).
- **Honours card:** this walker's honours as chips, or `No honours yet. The Judge is watching. Fairly.`
- **Head-to-head card:** vs every other paid walker — `vs <name>`: week wins `2–1` and gap `+n`/`-n`; each row links to `#/compare/<id>/<other>`.
- One margin note from `MARGIN_NOTES` on the hero (max one — §3.1).
- **Unknown `:id`:** card `No such walker has sworn in.` + `See the Roll →`.

### 5.5 Check-in — `#/check-in`

The flyer's Saturday-night ritual, as a page.

- Heading `Check-in`, kicker `SATURDAY NIGHT RITUAL`. Lead verbatim: `Every Saturday night, before you go to sleep, send a picture/screenshot of your step count` then bolded `DIRECTLY TO DAMMY — NOT THE GROUP CHAT!` Below, a `--ink-3` line resolving the flyer/locked-decision mismatch: `The flyer said Saturday night. The Judge, in his fairness, accepts Sunday too — a full week is a full week. But Saturday night is tradition.`
- **Check-in dates list** (the timeline component §3.5, vertical): the four `due` dates from `CHALLENGE.weeks` — `Oct 11`, `Oct 18`, `Oct 25`, `Nov 1` — plus a first `Kickoff · Oct 4` node. Node states per §3.5 (done ✓ / today with candle flicker M25 / upcoming / final 🎃 on Nov 1).
- **How to submit** card: `1. Open your step tracker. 2. Screenshot the week (Sunday → Saturday, all seven days showing). 3. Send it straight to Dammy — iMessage, WhatsApp, wherever you already bother him.` Then `What the Judge needs to see`: the full week, per-day numbers visible, sent after the week ends (`A Saturday-evening screenshot is a partial week. The Judge has seen this trick before.`).
- **The Decoy:** secondary button `Post it in the group chat` → M19 (`nope` shake, label becomes `NOPE.` for 1500ms, toast from `DECOY_TOASTS`). Primary button beside it: `Add the check-ins to my calendar` → generates and downloads `stridetober-checkins.ics` client-side (Blob, `VEVENT` per due date, all-day, `SUMMARY:Stridetober check-in — screenshot to Dammy`).
- Ink stamp `No screenshot = No steps!` (verbatim) sits bottom-right of the submit card.

### 5.6 The Decree — `#/rules`

The rules, read aloud. Heading `The Decree`, kicker `SO ORDERED`. Sections as numbered cards with wax-seal numerals:

1. **The Season** — the week table (§1.2, verbatim): four weeks, Sun→Sat, screenshots due each Sunday; `Kickoff October 4 · The clock strikes 12:00 AM on November 1st`.
2. **The Tribute** — `$20 to Dammy by Venmo before October 4th.` + `NO $20 = NO COMPETING!` stamp. Venmo button (text + 🪙).
3. **The Evidence** — `Send your screenshot DIRECTLY TO DAMMY — NOT THE GROUP CHAT!` + `No screenshot = No steps!` stamp.
4. **The Reckoning** — `The person with the MOST TOTAL STEPS at the end of the challenge will be crowned… THE OCTOBER STEP CHAMPION!` + `Dammy will send the funds through Venmo to the person with the most steps on November 1st.`
5. **The Fine Print** — verbatim: `No participation trophies. No sympathy points. And there will definitely be NO rounding up because you were "basically" at 10,000.` Plus the honour-system line: `The Judge trusts your tracker. He also, on occasion, asks questions.`
- Footer line in Caveat: `The Judge's word is fairly final.`

### 5.7 Settle It — `#/compare`, `#/compare/:a/:b`

Head-to-head. Heading `Settle It`, kicker `THE JUDGE ADJUDICATES`.

- No params: two chip grids (`Pick a walker` / `Pick the other`) → route updates to `#/compare/a/b`. Muster phase shows `There is nothing to settle yet. Walk first.` with a link to the Roll.
- With params: two-column hero — each side: crest, name, total, rank. Center column: `VS` in Fraunces italic. Then `Weeks taken: a n–n b`, a shared `climbChart` with just these two walkers, best-day callouts, and the Judge's verdict line from `VERDICTS` chosen by margin (§6.7).
- `a === b`: `The Judge declines to adjudicate a walker against themselves. They would win. They would also lose.`
- Buttons: `Share this verdict` — `navigator.share({title, url})` with copy-link fallback + `COPIED_TOAST`; `Swap` → reverses the route.

### 5.8 Court of Excuses — `#/excuses`

The cheek centerpiece. Heading `Court of Excuses`, kicker `ALL PLEAS ARE HEARD. FEW ARE GRANTED.`

- A bench card: `gavel` symbol left, text `State your excuse. The Judge is *fairly* listening.`
- Primary button `Plead your case` → draws a random plea from `EXCUSES` (§6.8): the plea appears in a Caveat speech card (`pop`), the gavel strikes (M10), then the ruling lands — `OVERRULED` ink slam (M9) for most pleas, a `PARDONED` wax-seal stamp (M8) for the rare merciful ones (`pardon: true` in the pool; roughly 1 in 5). Each plea shows its `ruling` remark in `--ink-2` beneath the stamp.
- `Pleas heard: n` counter in `localStorage["stridetober:pleas"]`; at n≥10 add margin note `the Judge has heard everything. Everything.`

### 5.9 Fall Finds — `#/finds` (R3)

Field journal of things spotted mid-walk. Heading `Fall Finds`, kicker `THE FIELD JOURNAL`.

- Empty state: `The trail has yielded nothing yet. Suspicious.` + hollow seal.
- Entries: masonry-ish grid (CSS columns, 1→2→3 across breakpoints). Card: photo (`loading="lazy"`, `w`/`h` attrs from the entry to prevent CLS), catalogue number `№ n` in `--ink-3`, caption in Caveat, finder chips (crest + short name → dossier), date. Numbers assigned by date, oldest = №01; display newest first (Big Steppas convention).
- Missing/queued photo (`img:null`): a `developing the film` placeholder card with `--surface-2` fill and `tally` icon.

### 5.10 The Summons — `#/invite`

Recruitment card, built to be shared. Heading `The Summons`, kicker `YOU ARE HEREBY INVITED`.

- A parchment card that reads like the flyer condensed: `OCTOBER STEPS CHALLENGE`, `Oct 4 – Nov 1`, `$20 buy-in — Venmo @Dammyhenry before Oct 4`, `Weekly screenshots to Dammy`, `Most total steps takes the pot`. Wax seal `S`.
- Buttons: `Share the Summons` (`navigator.share`, copy fallback + toast) and `Pay the Tribute 🪙` → Venmo.
- Muster-only: after Oct 4 the card gains `The season has begun — latecomers may still pay tribute, but the walking will not wait for them.`

---

## 6. Copy deck

Every user-facing string lives in `public/data/copy.js` (or in the view markup where it's structural). Rule: if a string could be a joke, it's a data-file pool so agents can add to it without touching views.

### 6.1 Voice — The *Fairly* Impartial Judge

- Third person, always. The Judge never says "I". He "notes", "observes", "rules", "reckons", "is *fairly* certain".
- The word **fairly** is the running gag. Italicize it when markup allows: "fairly impartial", "fairly final", "fairly impressed". Use it no more than twice per screen — it's seasoning.
- Register: mock-royal dryness. Vocabulary: the Court, the Ledger, tribute, sworn, henceforth, so ordered, the bench, the accused is fine — "walker" is the neutral term. Seasons, not rounds. Reckoning, not results day.
- Affectionate, never cruel. Roast the *effort*, not the person. `He walks like he's being chased` is canon; `lazy` is not.
- Numbers are sacred. Never joke about fudging a count; never round (§1.4).
- Short sentences. Understatement over exclamation — the flyer does the shouting; the site does the eyebrow.
- Emoji: at most one per heading, at most one per sentence. The Judge favors 🍂.
- Examples of the register:
  - `The Judge has counted. He is fairly pleased.`
  - `Allegedly, steps were taken. The Ledger will decide.`
  - `No honours yet. The Judge is watching. Fairly.`

### 6.2 Verbatim flyer phrases (must appear word-for-word, punctuation intact)

- `Walk it. Track it. Win it!`
- `OCTOBER 4TH – NOVEMBER 1ST` / `The challenge officially ends when the clock strikes 12:00 AM on November 1st!`
- `Send your $20 to Dammy BEFORE October 4th!` · `NO $20 = NO COMPETING!`
- `A step tracker` · `Two functioning feet` · `NO EXCUSES`
- `DIRECTLY TO DAMMY — NOT THE GROUP CHAT!` · `No screenshot = No steps!`
- `THE OCTOBER STEP CHAMPION!`
- `No participation trophies. No sympathy points. And there will definitely be NO rounding up because you were "basically" at 10,000.`
- `Lace up those sneakers and GET MOVING!!!` — with its checklist: `Walk around the block.` `Walk around the house.` `Walk while you're on the phone.` `Walk when you're angry.` `Walk to avoid your responsibilities.` `Just get those steps!`
- `It's time to find out who has the most active feet… and who has been training professionally for the Couch Olympics.`
- `More Steps, Less Stress!` · `Same goal… healthier us!` · `Small steps make big changes` (the water bottle's label) · `Fall into Healthy Habits`
- Dammy's Job bullets: `Who's in the lead` · `Who has been permanently attached to the couch` · `Who's walking like they're being chased` · `Who is using this challenge to escape their children` · `And who suddenly became an Olympic-level walker overnight!`

### 6.3 Phase & hero lines (`PHASE_LINES`, `COURT_WALKING`)

```js
PHASE_LINES = {
  muster:   { kick:"OCTOBER STEPS CHALLENGE", head:"Walk it. Track it. Win it!",
              sub:"Four weeks. Twenty dollars. One champion. The leaves are watching." },
  walking:  { kick:"WEEK {n} OF 4", head:null /* from COURT_WALKING */, sub:"Every step counts. The Judge counts them." },
  counting: { kick:"THE FINAL BELL", head:"The Final Bell has rung.", sub:"The Judge is counting. The ledger is frozen-ish." },
  crowned:  { kick:"ALL RISE", head:"THE OCTOBER STEP CHAMPION", sub:"So ordered. The pot is settled by Venmo." },
}
COURT_WALKING = [ // hero line, rotates by week number
  "The leaves fall. The walkers rise.",
  "October is short. The step counts should not be.",
  "Somewhere, a couch is being defended.",
  "Week {n}. The Judge expects briskness.",
]
```

### 6.4 Countdown labels (`COUNTDOWN_LABELS`)

```js
{ kickoff:"until the walking begins", weekEnd:"until the week is called",
  due:"until screenshots are past due", bell:"until the Final Bell",
  counted:"the Judge is counting", done:"the walking is done" }
```

### 6.5 Standings & dossier lines

```js
DOSSIER_LINES = { // picked by rank band, {name} interpolated
  lead:    ["{name} leads. The others may appeal to their feet.",
            "First place. The Judge is *fairly* impressed."],
  chase:   ["Within striking distance. The Judge has noticed.",
            "{name} is one good weekend from making this awkward."],
  mid:     ["Mid-pack. Comfortable. Suspiciously comfortable.",
            "The Judge files {name} under 'quietly plotting'."],
  bottom:  ["The couch sends its regards.",
            "There is still time. Technically. The Judge checked the calendar."],
}
NO_STEPS_WEEK = "NO SCREENSHOT"      // stamp text, verbatim flyer
AS_COUNTED = "as last counted"       // ledger preview caption
DERIVED_NOTE = { head:"Days measured from the chart",
  body:"This week's daily split was read off the submitted chart and scaled to the reported total. The total itself is as sworn. Days marked ~ are estimates, good to roughly ±1,000." }
```

### 6.6 Together tile (`TOGETHER_LINES` — one rotates per view)

```js
TOGETHER_LINES = [
  "roughly {mi} miles of October",
  "about {marathons} marathons, if anyone's counting (the Judge is)",
  "enough to out-walk a leaf blower",
  "the length of {n} very long regrets",
  "approximately one small migration",
]
```

### 6.7 Verdicts (`VERDICTS` — Settle It, chosen by margin)

```js
VERDICTS = {
  blowout: "The Judge has examined both. One of them has been walking. The other has been meaning to.",
  clear:   "The lead is real but not safe. The Judge recommends fewer stairs claimed, more stairs taken.",
  tight:   "Separated by {gap} steps — a lap around the block. The Judge leans in.",
  deadEven:"A dead heat. The Judge suggests a walk-off.",
}
```

### 6.8 Court of Excuses (`EXCUSES` — plea / ruling / pardon)

`pardon:true` = PARDONED wax seal; otherwise OVERRULED ink slam. Write exactly these (agents may append more in the same shape):

```js
EXCUSES = [
  { plea:"My dog ate my pedometer.", ruling:"The dog has been subpoenaed.", },
  { plea:"It was raining.", ruling:"Umbrellas exist. So do hallways.", },
  { plea:"I walked, I just forgot to track it.", ruling:"Untracked steps are tree-falling-in-the-forest steps.", },
  { plea:"Mercury is in retrograde.", ruling:"The Court does not recognize astrology. *Fairly* firm on that.", },
  { plea:"My tracker died.", ruling:"Chargers exist. The Judge is told they are inexpensive.", },
  { plea:"Sunday is a day of rest.", ruling:"Not in October. October is a month of receipts.", },
  { plea:"I was saving my knees.", ruling:"For what, precisely?", },
  { plea:"I did a marathon… on Netflix.", ruling:"The Court weeps. OVERRULED.", },
  { plea:"I walked 10,000 steps in my heart.", ruling:"The heart does not appear on the Ledger.", },
  { plea:"I take the stairs… emotionally.", ruling:"Emotional stair-climbing is not a recognized category.", },
  { plea:"I rallied all weekend.", ruling:"Evidence or it didn't happen.", },
  { plea:"The sidewalk was lava.", ruling:"That is fair.", pardon:true },
  { plea:"Chasing my toddler IS cardio.", ruling:"Granted. The Judge is not a monster.", pardon:true },
  { plea:"I was trick-or-treating.", ruling:"Seasonal. Accepted.", pardon:true },
  { plea:"All my steps were inside the house.", ruling:"Steps are steps. The Court is generous.", pardon:true },
  { plea:"I carried the groceries in one trip.", ruling:"Commendable. Still not a walk.", },
  { plea:"My watch and I are taking a break.", ruling:"Couples counseling for you and your watch is not the Court's problem.", },
  { plea:"It's too spooky out.", ruling:"Spookiness is not a defense. Especially not this week.", },
  { plea:"I was pacing during a call.", ruling:"Pacing counts. Show the screenshot next time.", pardon:true },
  { plea:"Big steps run in my family.", ruling:"Then the family may also pay tribute.", },
]
```

### 6.9 Toasts, decoys, bottle, rake (`TOASTS`, `DECOY_TOASTS`, `BOTTLE`, `RAKE_LINES`)

```js
TOASTS = {
  newLeader:  "A new name at the top of the ledger. The Judge is as surprised as you are.",
  weekPosted: "Week {n} has been counted. The Ledger is updated. Adjust your stride accordingly.",
  copied:     "Copied. Go forth and summon.",
  pardoned:   "A pardon! Rare as a quiet Saturday.",
}
DECOY_TOASTS = [
  "NOPE. The group chat is for memes. Screenshots go to Dammy.",
  "The Judge has seen this mistake before. DIRECTLY TO DAMMY.",
  "Absolutely not. Dammy. Directly. Him.",
]
BOTTLE = [
  "Small sips. Big steps.",
  "Hydration is a fairly serious matter.",
  "The Judge drinks water. You should too.",
  "Eight glasses a day keeps the cramps away.",
  "Refill me, coward.",
]
RAKE_LINES = [ // counter milestones; the counter line is always "Leaves raked: {n} · Steps credited: 0 · The Judge checked."
  { at:1,   note:"Rake the pile. It does nothing." },
  { at:25,  note:"The Judge is watching you rake. He is *fairly* impressed." },
  { at:100, note:"One hundred leaves. This is why you're behind." },
  { at:500, note:"Five hundred. The Judge suggests a walk instead." },
]
```

### 6.10 Margin notes & honours

```js
MARGIN_NOTES = [
  "suspiciously fast 👀", "walks like they're being chased", "the early bird avoids the guilt",
  "allegedly 'just errands'", "cardio? in this economy?", "the Judge has questions",
  "stretch first", "professional couch athlete — retired?",
]
HONOURS = [ // computed by stats.honours(); label is what renders on the chip
  { key:"leaf-pile",   label:"Top of the Leaf Pile",   desc:"most steps in a posted week" },
  { key:"longest",     label:"The Longest Walk",       desc:"biggest single day" },
  { key:"metronome",   label:"The Human Metronome",    desc:"smallest daily range in a full posted week" },
  { key:"weekender",   label:"The Weekender",          desc:"largest share of a week's steps on Sat + Sun" },
  { key:"second-wind", label:"The Second Wind",        desc:"biggest week-over-week gain" },
  { key:"photo-finish",label:"The Photo Finish",       desc:"won a week by the smallest margin" },
  { key:"rest-day",    label:"Court-Appointed Rest Day",desc:"a literal zero day, owned" },
  { key:"quiet",       label:"The Quiet Achiever",     desc:"most total steps without winning a week" },
]
```

### 6.11 Judge's Report format (guidance for whoever writes `judgeNote`)

1–3 sentences, Judge voice, about the week's actual story: the winner, the drama, a missing screenshot, a tight gap. Name at least one walker. End with a small flourish. Do not editorialize the math — the Ledger shows the math. Examples in the correct register:

- `Alicia came out swinging. Everyone else came out walking.`
- `Three walkers submitted before Sunday noon. The Judge notes this enthusiasm and finds it suspicious.`
- `A quiet week. The couch claims another soul — the Court offers condolences and a stamp.`

---

## 7. Data & logic

### 7.1 Data files (`public/data/`)

All are plain `export const` modules — no imports, no logic — so `node --test` can import them directly.

**`challenge.js`** — write literally:

```js
export const CHALLENGE = {
  title: "Stridetober",
  tagline: "Walk it. Track it. Win it!",
  buyIn: 20,
  venmoHandle: "Dammyhenry",
  venmoUrl: "https://venmo.com/Dammyhenry",
  kickoff: "2026-10-04T00:00",      // local wall-clock — parse via parseLocal()
  finalBell: "2026-11-01T00:00",    // "the clock strikes 12:00 AM"
  judge: { name: "Dammy Henry", title: "The Fairly Impartial Judge" },
  champion: null,                   // set to a walker id when week 4 posts
  payoutSent: false,                // flip when the Venmo goes out
  weeks: [                          // Sun 00:00 → Sat 23:59; screenshots due Sunday
    { n:1, start:"2026-10-04", end:"2026-10-10", due:"2026-10-11" },
    { n:2, start:"2026-10-11", end:"2026-10-17", due:"2026-10-18" },
    { n:3, start:"2026-10-18", end:"2026-10-24", due:"2026-10-25" },
    { n:4, start:"2026-10-25", end:"2026-10-31", due:"2026-11-01" }, // last day is Halloween
  ],
}
```

**`walkers.js`** — roster fills as tribute lands:

```js
export const WALKERS = [
  // { id:"sam", name:"Sam Reyes", short:"Sam", crest:"🦊", color:"spruce",
  //   paid:true, paidOn:"2026-09-30", birthday:null },   // "MM-DD", only if Oct 4–Nov 1
]
```

- `id` = lowercase slug, used in `#/walker/:id`. `crest` = unique emoji from §3.6's list. `color` = a §3.2 palette key, assigned in roster order. `paid:false` entries show `tribute pending` on the Roll and are **excluded from all standings/honours** — the Ledger only ever contains paid walkers.
- `birthday`: set only if a walker volunteers it and it falls Oct 4–Nov 1 (R3 banner).

**`weeks.js`** — the weekly edit:

```js
export const WEEKS = [
  // appended each Sunday, in order:
  // { week:1, posted:"2026-10-11T19:20",
  //   steps: { sam: 84210, jules: null },        // null = NO SCREENSHOT (counts 0)
  //   days:  { sam: [9,120, 12,004, ...], jules: null },  // 7 numbers SUNDAY-first, or null
  //   derived: [],                              // ids whose daily split was chart-measured
  //   judgeNote: "…" },
]
export const ANNOUNCEMENT = null
// or { until:"2026-10-20T00:00", mode:"note"|"getwell", who:"sam",
//      kicker:"…", title:"…", lead:"…", points:[[emoji,text],…], note:"…", cta:"…" }
```

- `steps` is authoritative (as submitted). `days` powers charts/honours; `null` = pending, never guess. `derived` ids get `~` marks and the `DERIVED_NOTE` block.
- `ANNOUNCEMENT.mode:"getwell"` replaces the Court's ledger preview; `mode:"note"` is a dismissible banner.

**`finds.js`** — `{ id:"f01", who:["sam"], date:"2026-10-12", img:"/finds/f01.jpg", w:1200, h:900, caption:"…" }` — photos live in `public/finds/` (EXIF-rotated, ≤1200px, JPEG q~75; a `tools` script may regenerate dims). `img:null` renders the "developing the film" card.

**`copy.js`** — exports every pool in §6 exactly as keyed there (`PHASE_LINES`, `COURT_WALKING`, `COUNTDOWN_LABELS`, `DOSSIER_LINES`, `NO_STEPS_WEEK`, `AS_COUNTED`, `DERIVED_NOTE`, `TOGETHER_LINES`, `VERDICTS`, `EXCUSES`, `TOASTS`, `DECOY_TOASTS`, `BOTTLE`, `RAKE_LINES`, `MARGIN_NOTES`, `HONOURS`).

**`demo.js`** — loaded **only** when `?demo=1` is in the URL; `main.js` swaps it in for walkers/weeks so every phase can be previewed pre-launch. Six fictional walkers named after trees — `ash` "Ash Alder" 🦉 spruce · `rowan` "Rowan Birch" 🍁 cranberry · `hazel` "Hazel Thorne" 🦊 goldenrod · `linden` "Linden Marsh" 🐿️ denim · `maple` "Maple Grove" 🍄 fig · `hollis` "Hollis Yew" 🦔 moss — two posted weeks of plausible numbers, one `null` screenshot, and one `derived` split, so every UI state is exercised. Demo mode shows a `DEMO` ribbon in the header so screenshots are never mistaken for real standings.

### 7.2 `lib/time.js`

```js
parseLocal(s)            // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm[:ss]" → Date in LOCAL time.
                         // Splits on non-digits and calls new Date(y, m-1, d, hh, mm, ss).
                         // NEVER pass a date-only ISO string to new Date() — §1.4.
endOfDay(s)              // parseLocal + set hours to 23:59:59.999
phaseOf(now, challenge, weeks)        // "muster" | "walking" | "counting" | "crowned"
weekStatus(wk, now, postedWeeks)      // "upcoming" | "walking" | "counting" | "posted"
currentWeek(challenge, now)           // the week object whose [start,end] contains now, else null
nextMilestone(ctx)                    // {label, target} — the earliest future of:
                                      //   week end (Sat 23:59:59), due (Sun 23:59:59), kickoff, finalBell
countdownParts(now, target)           // {d,h,m,s,totalMs} — clamped ≥0, zero-padded strings
daypart(now)                          // "morning"|"afternoon"|"dusk"|"night" per §3.2 table
isEve(now)                            // true on Oct 31 local
phaseSignature(ctx)                   // string that changes exactly when the view must re-render:
                                      // phase + currentWeek.n + postedWeeks.length + crowned-seen
```

Phase table:

| Condition | Phase |
|---|---|
| `now < kickoff` | `muster` |
| `kickoff ≤ now < finalBell` | `walking` |
| `finalBell ≤ now` and week 4 not in `WEEKS` | `counting` |
| week 4 posted | `crowned` |

`weekStatus`: `posted` if `wk.n` exists in `WEEKS`; `upcoming` if `now < wk.start`; `walking` if within `[start, end]`; `counting` if `now > end` and not yet posted.

### 7.3 `lib/format.js`

```js
n(x)             // 84210 → "84,210" (Intl.NumberFormat en-US). Never abbreviate except chart ticks.
tick(x)          // 84210 → "84k" — chart axis labels only
ord(x)           // 1→"1st", 2→"2nd", 3→"3rd", n→"nth" (11/12/13 → "th")
esc(s)           // escape &, <, >, ", ' — MANDATORY before any data-file string hits innerHTML
plural(x, one, many)      // plural(3,"leaf","leaves")
pick(arr, i)     // deterministic pick: arr[i % arr.length]
fmtDay(dateStr)  // "Oct 11"
fmtRange(a, b)   // "Oct 4 – 10" / "Oct 25 – Nov 1"
fresh(ts, now)   // "just now" / "3h ago" / "yesterday"
```

### 7.4 `lib/stats.js`

```js
paidWalkers(walkers)            // paid === true only
weekSteps(week)                 // {id: n} — null → 0
totals(weeks)                   // {id: cumulative n}
standings(walkers, weeks)       // sorted desc: [{walker,total,rank,prevRank,delta,byWeek:[n|null|"missing"],bestDay:{n,week,day}|null}]
rankMoves(weeks)                // per-id rank change between last two posted weeks
leader(standings)               // standings[0] or null
gapToLead(standings, id)        // n behind leader (0 if leader)
honours(walkers, weeks)         // [{key,label,who,detail}] per §6.10 criteria; skip when data insufficient
together(totals)                // {steps, miles, km, marathons} — MILE=2000 steps, MARATHON=26.2mi
shareUrl(...)                   // not stats — skip
```

Honours criteria (deterministic, ties → earliest `id` wins, all require `days` present unless noted): `longest` = max single day across posted weeks · `metronome` = min (max−min) daily range in a week with all 7 days · `weekender` = max `(days[0]+days[6])/weekTotal` · `second-wind` = max `week(n) − week(n−1)` for n≥2 · `photo-finish` = smallest winning margin in any posted week, awarded to that week's winner (uses `steps` only) · `rest-day` = a posted `0` day in a submitted week (most recent) · `quiet` = highest total among walkers who never won a week (crowned phase only) · `leaf-pile` = winner of the latest posted week (uses `steps` only).

### 7.5 `lib/charts.js` — pure string builders, no DOM

```js
chartDims()               // {w,h,pad} — w:396 under 768px, else 620 (Big Steppas rule: labels ~1:1)
climbChart(standings, weeks)   // cumulative-step polylines per walker, one <g> each;
                               // 9th+ walker: stroke-dasharray "7 4" (§3.2)
totalsChart(standings)         // horizontal bars
dailyChart(daysArray, opts)    // 7 bars; marks best (gold outline) & quietest (hatch pattern) days
```

All charts: `role="img"`, `aria-label` summarizing the takeaway, dashed `--line` gridlines `3 4`, axis labels Inter 12px `--ink-3` below/left of plot only, and every rendered chart is followed by `<details><summary>See the numbers</summary><table>`.

### 7.6 Integrity rules (`tests/data.test.js` — the deploy gate)

These run in Vercel's build; a violation blocks deploy:

- Every `steps` key exists in `WALKERS` and the walker is `paid`.
- `days[id]` is `null` or exactly 7 non-negative integers, and `days.reduce(+)===steps[id]` unless the id is in `derived` (then within ±1500).
- `WEEKS` are strictly `week:1..n` in order, each within `CHALLENGE.weeks[n-1]`'s dates.
- Every walker `color` is a §3.2 key, every `crest` unique, every `id` a valid slug.
- `CHALLENGE.champion`, when set, equals the week-4 `steps` leader.
- `FALL_FINDS` entries reference existing `public/finds/` files or `img:null`.
- `copy.js` exports every key listed in §7.1.
- `walkers.js` contains no Big Steppas names (`alicia|andrew|helen|mackenzie|sarah|lizzie|jekel|ramos|belling|hofferica`) — guard the "no callbacks" rule.

### 7.7 The tick

`main.js`: `setInterval(tick, 1000)`. Each tick: update countdown digit cells in place (M6 swaps only changed digits); recompute `phaseSignature(ctx)`; on change, rebuild ctx and re-render the current route. Retire the announcement, urgency states and `EVE`/`daypart` attributes the same way — an open page crosses midnight on its own (the `tickBell()` lesson).

---

## 8. Tasks

Conventions: every task ends green (`npm test` + the §9.4 visual sweep at 375px and 320px minimum). Commit per task with the §1.4 prefixes. Tasks marked 🔒 touch files nothing else touches that week — parallel lanes per §2.4.

> **Build status (updated 2026-09-16):** R1 "Muster" is built and deployed with the Vercel CLI (`vercel --prod`). Done: Tasks 2–6 and 10. Partly done: Task 1 (the GitHub repo and Git integration still need Dammy's go), Task 7 (ledger preview, Judge's Report and Together tile are done; `getwell` announcement mode is not), and Task 8 (standings rows/table and honours shelf are done; charts, `fx.flip` Reading and `fx.burst` wiring are not). Not started: Tasks 9, 11–15.
> Deviations from this plan, all deliberate:
> - §5.5 Check-in copy follows the locked §1.2 rule: the week *ends* Saturday night and screenshots are due Sunday. The "accepts Sunday too" line was dropped, and the kicker reads "Due every Sunday".
> - `stats.honours()` returns `{key, who, detail}`; views look up the label and description in `HONOURS`.
> - `nextMilestone({now, challenge, weeks})` takes the context fields rather than the whole context.
> - §7.6 rule "champion equals the week-4 steps leader" is implemented as the **overall total** leader, per the flyer's "MOST TOTAL STEPS".
> - `copy.js` gained `LEDGER_EMPTY`.
> - `/assets/*` is served `max-age=0, must-revalidate`, not `immutable`. The sprite is not content-hashed, so a year-long cache would strand returning phones on stale icons whenever a symbol is added. `/finds/*` stays immutable because photos get new filenames.

### Task 1 — Scaffold & deploy gate 🔒
- [x] Create the tree per §2.1 (empty `public/` is fine — placeholder `index.html` allowed, must be noindex).
- [ ] `package.json`, `vercel.json` (`framework:null`, `buildCommand:"npm test"`, `outputDirectory:"public"`, `headers`: `X-Robots-Tag: noindex` on all routes, `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and `/finds/*`), `.gitignore`, `tests/smoke.test.js` asserting `public/` and `data/` exist.
- [ ] Copy this file to `docs/PLAN.md`; write `AGENTS.md` per §9.1, `CLAUDE.md` (`@AGENTS.md`), `README.md` per §9.3.
- [ ] **With Dammy's confirmation only:** `gh repo create rudeboydamn/stridetober --private --source . --push`, then link Vercel project `stridetober` on team `team_kIfFmKlwOwuG0sniRCGfMwiY` (Vercel MCP `create_git_project` or dashboard). Confirm a preview deploy builds and `npm test` is the gate.
- Done when: pushing a branch yields a green preview deployment.

### Task 2 — Tokens, base & chrome
- [x] `styles/tokens.css` verbatim from §3.2–§3.4 (raw + semantic, dark block pasted under both selectors), `base.css`, `components.css` (card, buttons, ribbon, seal, stamp, crest, chips, harvest line, countdown, timeline, toast, sheet), `motion.css` (§4.3 verbatim + §4.2 reduced-motion).
- [x] `index.html` shell: fonts link (§3.3), meta (noindex, theme-color, og tags), header/wordmark/phase chip, `<main id="view">`, tab bar + More sheet, footer with `.leaf-pile`, `#burst` canvas, `.leaves` layer, grain `body::before`.
- [x] `assets/sprite.svg` — all §3.6 symbols, hand-drawn, `currentColor` (`seal`, `wreath` two-tone as specced).
- [x] `tests/css.test.js`: brace balance + WCAG contrast of every §3.2 pair (the values in the table are the assertions).
- Done when: the shell renders at 320–1440px in both themes with zero console errors.

### Task 3 — Data files & copy pools 🔒
- [x] `data/challenge.js` verbatim §7.1; `walkers.js`, `weeks.js`, `finds.js` empty per schema; `copy.js` complete per §6; `demo.js` per §7.1.
- Done when: `node --test` imports all six files cleanly.

### Task 4 — Pure libs (TDD) 🔒
- [x] Write `tests/time.test.js` + `tests/stats.test.js` first, covering §7.2/§7.4 incl. the Oct-31 `isEve`, the Saturday→Sunday status flip, DST-free local parsing, standings with `null` steps and `null` days.
- [x] Implement `lib/time.js`, `lib/format.js`, `lib/stats.js`.
- Done when: tests pass; `phaseOf` is correct at each boundary minute.

### Task 5 — Boot, router & Court (muster)
- [x] `src/main.js`: `buildContext`, hash router, 1s tick (§7.7), view-transition swap (M3), theme init, `?demo=1` and `?motion=reduce` params.
- [x] `lib/fx.js`: `reduced()`, `leaves()` (M1/§4.5 seeded `mulberry32(1004)`), `countUp` (M5), `reveal` (M4), `toast` (M17).
- [x] `views/court.js` muster phase per §5.2: hero+sky, countdown (M6/M7), tribute card (M14 ring), Roll with PAID stamps (M8), sworn kit, how-it-works, Dammy's Job.
- Done when: `?demo=1` shows a full muster Court; countdown ticks live; leaves fall.

### Task 6 — Decree, Check-in, Summons, OG/icons
- [x] `views/decree.js` (§5.6), `views/checkin.js` (§5.5 incl. decoy M19 + client-side `.ics`), `views/summons.js` (§5.10 + `navigator.share`/copy fallback).
- [x] `tools/og.html` → screenshot to `public/og.png` (1200×630); `tools/icon.html` → `icon-192/512`, `apple-touch-icon`, SVG favicon data-URI (🍂). `manifest.webmanifest`.
- **R1 "Muster" ships here.** Done when: all three routes + meta verify at every §9.4 width.

### Task 7 — Court: walking & counting phases
- [ ] Ledger preview, Judge's Report, Together tile (M5), announcement slot incl. `getwell` mode, counting-phase tally (M18), `phaseSignature` coverage.
- Done when: `?demo=1` + manipulated `now` (a `?now=YYYY-MM-DDTHH:mm` QA param — parse via `parseLocal`, demo-only) walks through every phase.

### Task 8 — The Ledger + charts + Reading
- [ ] `views/ledger.js` per §5.3; `lib/charts.js` `climbChart`/`totalsChart`; `fx.burst` (M2/§4.6 canvas, `clientWidth` not `innerWidth`); `fx.flip` (M13/§4.7 FLIP + `last-seen-week`).
- Done when: adding a demo week reorders rows with FLIP, deltas `pop`, new-leader burst fires once.

### Task 9 — Dossier
- [ ] `views/dossier.js` per §5.4: hero stats, `dailyChart` week cards (Sun-first, 🔥/😴 marks, derived `~`), honours chips, head-to-head rows.
- Done when: every demo dossier renders incl. a `NO SCREENSHOT` week and unknown-id state.
- **R2 "Walking" ships here** (demo data + runbook dry run, §9.2, rehearsed against fake screenshots).

### Task 10 — Court of Excuses
- [x] `views/excuses.js` per §5.8: plea draw, gavel M10, OVERRULED slam M9 / PARDONED seal M8, plea counter.
### Task 11 — Settle It
- [ ] `views/compare.js` per §5.7: picker, VS hero, two-walker `climbChart`, `VERDICTS`, share/copy, self-compare gag.
### Task 12 — Counting, crowned & coronation
- [ ] Crowned Court (§5.2): wreath `crown-drop` + `bob`, 96px CHAMPION seal, 110-leaf burst, `crowned-seen` flag, podium with 🥇🥈🌰, payout line honoring `payoutSent`.
- [ ] `birthday` banner (only if a `birthday` is set — §7.1).
### Task 13 — Hallowed Eve
- [ ] `html[data-eve]` on Oct 31 (`isEve`): `--eve` accents, `jack` wordmark (M22), bats swap (M23), `EVE 🎃` chip, sky override.
- Done when: `?demo=1&now=2026-10-31T20:00` shows the Eve state; Nov 1 reverts.
### Task 14 — Fall Finds
- [ ] `views/finds.js` + `public/finds/` pipeline (EXIF rotate, ≤1200px, q75, dims recorded in entry). Build when the first photo actually arrives.
### Task 15 — Final sweep
- [ ] §9.4 verification matrix end-to-end on preview; perf pass (fonts `display=swap`, no layout thrash — leaves are `will-change:transform` only); README/AGENTS.md final truth-check.
- **R3 "Finale" ships here.**

---

## 9. Agent docs, runbook & verification

### 9.1 `AGENTS.md` must contain (canonical handoff — write it in Task 1, keep it true)

1. What Stridetober is (2 lines) + live URL + `?demo=1` usage.
2. **The voice** — §6.1 condensed + the *fairly* gag + verbatim flyer phrases pointer.
3. **The weekly job** — §9.2 verbatim.
4. Data model — §7.1 field-by-field + "never invent a number; ambiguous → ask Dammy".
5. Gotchas — §1.4 list + the Big Steppas traps that still apply (date-only ISO, Monday-first arrays, `innerWidth`, `minmax` floor, `animation:none` stranding, house-color collisions, brace-balance check, scrollRestoration).
6. Verify — §9.4 snippet + widths.
7. Deploy — git-integration flow; `npm test` is the gate; **never** deploy past a red test.

### 9.2 The weekly runbook (Sundays: Oct 11, 18, 25, Nov 1)

1. Screenshots land in `checkins/week-N/<walker-id>/` (create dirs; filenames keep their timestamps). Read every one — money is on it.
2. **Rules of evidence** (adapted from Big Steppas, identical every week):
   - A week is **Sunday 00:00 → Saturday 23:59**. Apps whose week starts Monday show a headline spanning the wrong boundary — **read the per-day bars**.
   - A Saturday-evening screenshot is a **partial Saturday**; the flyer says "before you go to sleep" but settled numbers are what count. If the per-day bars show Saturday clearly lower than the pattern, ask Dammy whether a later shot exists.
   - Legend markers can sit on data points — re-read occluded bars.
   - Steps logged outside the tracker are additive only if not already counted — ask.
   - Dailies must sum to the submitted total, or stop and ask Dammy. Estimated splits go in `derived` and render `~`.
   - **Never invent a number.** Ambiguous → ask.
3. Append the `WEEKS` entry (`data(week-N): post week N results`), write the `judgeNote` per §6.11, flip `champion`/`payoutSent` when week 4 lands.
4. `npm test` → push → preview deploy → spot-check Ledger + Court + one dossier at 375px → tell Dammy it's live (he'll spread the word; that's the fun part).

### 9.3 `README.md` (human-facing)

Quickstart: `python3 -m http.server 4173 -d public` (no build); `npm test`; how a week gets posted; where the plan lives (`docs/PLAN.md`); Vercel link; "unlisted + noindex — still, no secrets in this repo".

### 9.4 Verification matrix (run per release, and after any UI change)

- **Widths:** 320, 375, 390, 430, 768, 1024, 1280, 1440 — no horizontal page scroll anywhere.
- **Routes:** every route in §5.1, in every reachable phase (`?demo=1` + `?now=`).
- **Themes × motion:** light/dark × `?motion=reduce`; `data-eve` on/off.
- **Console sweep** (adapted Big Steppas — Stridetober's floors are 12px text / 44px targets):

```js
const de=document.documentElement, bad=[];
document.querySelectorAll('#view *, .tabbar *, .site-head *').forEach(e=>{
  const r=e.getBoundingClientRect(); if(!r.width||!r.height) return;
  if(r.right>de.clientWidth+1){let c=false,n=e.parentElement;
    while(n&&n!==document.body){const o=getComputedStyle(n).overflowX;
      if(['auto','scroll','hidden','clip'].includes(o)){c=true;break}n=n.parentElement}
    if(!c)bad.push('OVERFLOW:'+e.className)}
  if(!e.children.length&&e.textContent.trim().length>2&&
     parseFloat(getComputedStyle(e).fontSize)<11.5)bad.push('TINY:'+e.className);
  if((e.tagName==='A'||e.tagName==='BUTTON')&&r.height<40)bad.push('TAP:'+e.className);
});
[...new Set(bad)]
```

Target: empty array.

---

## 10. Open knobs (decide before the relevant task; defaults are sane)

1. **Repo & Vercel project** — `rudeboydamn/stridetober` private repo + `stridetober` on team `team_kIfFmKlwOwuG0sniRCGfMwiY`. **Not yet created — needs Dammy's go** (Task 1). Verified 2026-09-16: no such project exists on the team.
2. **Venmo handle** — flyer says `Dammyhenry`; confirm the URL `https://venmo.com/Dammyhenry` resolves before shipping the tribute button.
3. **Roster** — `walkers.js` starts empty; ids/crests/colors get assigned in payment order. First-come crests.
4. **Does Dammy walk?** Default no (he's the Judge, same as Big Steppas). If he competes, he still holds the pot — update Decree copy.
5. **The pot figure** — displayed as computed (`paid × $20`), never hard-coded; if it's awkward during muster, show `$20 × walkers sworn`.
6. **Birthday line** — only if a walker has an Oct 4–Nov 1 birthday *and offers it*; off by default.
7. **`?now=` QA param** — demo-only; consider gating behind `?demo=1` so production can't be time-traveled by a shared link. Default: gate it.
8. **Finds cadence** — build the view when the first photo arrives, not before.
