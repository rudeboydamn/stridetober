// Stridetober — boot, context, router, tick. Spec: docs/PLAN.md §2.2, §5.1, §7.7.
import { CHALLENGE } from "../data/challenge.js";
import { WALKERS } from "../data/walkers.js";
import { WEEKS, ANNOUNCEMENT } from "../data/weeks.js";
import { FALL_FINDS } from "../data/finds.js";
import * as COPY from "../data/copy.js";
import { parseLocal, phaseOf, currentWeek, phaseSignature, daypart, isEve, announcementLive, countdownParts } from "./lib/time.js";
import { standings, honours, paidWalkers } from "./lib/stats.js";
import { esc, rich } from "./lib/format.js";
import { leaves, gusts, rake, reduced, reveal, puff, burst, toast, wildlife } from "./lib/fx.js";
import { tree } from "./lib/tree.js";
import * as court from "./views/court.js";
import * as ledger from "./views/ledger.js";
import * as dossier from "./views/dossier.js";
import * as finds from "./views/finds.js";
import * as courtroom from "./views/courtroom.js";

const root = document.documentElement;
const view = document.getElementById("view");
const query = new URLSearchParams(location.search);

// ?demo=1 swaps in the fictional fixture; ?now= time-travel only works inside demo (PLAN §10.7).
const DEMO = query.get("demo") === "1";
let walkers = WALKERS, allWeeks = WEEKS;
const markDashed = list => list.forEach((w, i) => { w.dashed = i >= 8; });   // palette reuse (charts.js)
if (DEMO) {
  const demo = await import("../data/demo.js");
  walkers = demo.DEMO_WALKERS;
  allWeeks = demo.DEMO_WEEKS;
}
markDashed(walkers);
const offset = DEMO && query.get("now") ? parseLocal(query.get("now")) - Date.now() : 0;
const clock = () => new Date(Date.now() + offset);

// Demo weeks carry future "posted" stamps; only count what has been posted by the (demo) clock.
const weeksAt = now => (DEMO ? allWeeks.filter(w => !w.posted || parseLocal(w.posted) <= now) : allWeeks);

const crownedSeen = () => {
  try { return localStorage.getItem("stridetober:crowned-seen") === "1"; } catch { return false; }
};

function buildContext(now) {
  const weeks = weeksAt(now);
  return {
    now,
    phase: phaseOf(now, CHALLENGE, weeks),
    week: currentWeek(CHALLENGE, now),
    challenge: CHALLENGE,
    walkers,
    paid: paidWalkers(walkers),
    weeks,
    standings: standings(walkers, weeks),
    prevStandings: weeks.length > 1 ? standings(walkers, weeks.slice(0, -1)) : null,
    honours: honours(walkers, weeks),
    announcement: announcementLive(ANNOUNCEMENT, now) ? ANNOUNCEMENT : null,
    copy: COPY,
    finds: FALL_FINDS,
    demo: DEMO,
    crownedSeen: crownedSeen(),
  };
}

// crownedSeen comes from the last render, not a fresh localStorage read each second:
// the coronation sets the flag as it plays, and re-reading it here re-rendered the page mid-ceremony.
const signature = now =>
  phaseSignature({ now, challenge: CHALLENGE, weeks: weeksAt(now), crownedSeen: !!ctx?.crownedSeen, announcement: ANNOUNCEMENT });

// ── router ────────────────────────────────────────────────
const ROUTES = [
  // Four page tabs — Court · Ledger · Finds · Courtroom — and a fifth tab that switches the theme.
  // Sections live inside pages; their old URLs are aliases that scroll there (`focus`):
  // #/check-in → the Court, #/rules and #/invite → the Ledger (the Decree, the Summons).
  // The Courtroom has two dockets: #/excuses (pleas) and #/compare[/a[/b]] (disputes).
  { path: "/",          mod: court,     name: "court",     tab: 0, title: "" },
  { path: "/check-in",  mod: court,     name: "court",     tab: 0, title: "Check-in", focus: "checkin" },
  { path: "/ledger",    mod: ledger,    name: "ledger",    tab: 1, title: "The Ledger" },
  { path: "/rules",     mod: ledger,    name: "ledger",    tab: 1, title: "The Decree", focus: "decree" },
  { path: "/invite",    mod: ledger,    name: "ledger",    tab: 1, title: "The Summons", focus: "summons" },
  { path: "/finds",     mod: finds,     name: "finds",     tab: 2, title: "Fall Finds" },
  { path: "/excuses",   mod: courtroom, name: "courtroom", tab: 3, title: "The Courtroom" },
  { path: "/courtroom", mod: courtroom, name: "courtroom", tab: 3, title: "The Courtroom" },
  // parameterized (PLAN §5): params land in render(ctx, params)/mount(root, ctx, params)
  { match: /^\/walker\/([a-z0-9-]+)$/i, mod: dossier, name: "dossier", tab: -1,
    title: null, params: m => ({ id: m[1] }) },
  { match: /^\/compare(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/i, mod: courtroom, name: "courtroom", tab: 3,
    title: "Settle It", params: m => ({ docket: "disputes", a: m[1], b: m[2] }) },
];
const OFF_TRAIL = {
  name: "off-trail", tab: -1, title: "Off the trail", params: () => ({}),
  mod: {
    render: () => `<section class="wrap section"><div class="card off-trail" data-reveal>
      <h1 class="h2">Off the trail.</h1>
      <p class="sub">This path is not on the map. The Judge suggests turning back.</p>
      <a class="btn btn-primary" href="#/">Back to Court</a></div></section>`,
  },
};

const currentRoute = () => {
  const path = location.hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
  for (const r of ROUTES) {
    if (r.path === path) return { route: r, params: r.focus ? { focus: r.focus } : {} };
    if (r.match) {
      const m = r.match.exec(path);
      if (m) return { route: r, params: r.params(m) };
    }
  }
  return { route: OFF_TRAIL, params: {} };
};

let ctx = null, sig = "", route = null, params = {}, lastEve = null, grove = null;

// The header chip counts down to the gun while the Muster lasts.
const kickoffChip = now => {
  const p = countdownParts(now, parseLocal(CHALLENGE.kickoff));
  return +p.d ? `${+p.d}d to go` : +p.h ? `${+p.h}h to go` : `${+p.m}m to go`;
};

function applyChrome(now) {
  root.dataset.daypart = daypart(now);
  const eve = isEve(now);
  if (eve) root.dataset.eve = ""; else delete root.dataset.eve;
  if (eve !== lastEve) { lastEve = eve; leaves(document.querySelector(".leaves"), { eve }); }

  const chip = document.getElementById("phaseChip");
  chip.textContent = eve && ctx.phase === "walking" ? "Eve 🎃"
    : ctx.phase === "walking" ? `Week ${ctx.week.n}`
    : ctx.phase === "muster" ? kickoffChip(now)
    : ctx.phase === "counting" ? "Counting" : "Crowned";
  document.getElementById("demoFlag").hidden = !DEMO;

  const titleText = route.title === null
    ? (ctx.walkers.find(w => w.id === params.id)?.name || "Dossier")
    : route.title;
  document.title = titleText ? `${titleText} — Stridetober` : "Stridetober";
  const tabbar = document.getElementById("tabbar");
  tabbar.dataset.tab = route.tab;
  tabbar.style.setProperty("--tab", Math.max(0, route.tab));
  tabbar.querySelectorAll("a.tab").forEach(a => {
    if (+a.dataset.tab === route.tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.querySelectorAll(".head-link").forEach(a => {
    if (a.dataset.route === route.name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  renderAnnouncement();
}

function renderAnnouncement() {
  const slot = document.getElementById("annoSlot");
  const a = ctx.announcement;
  const key = a ? `stridetober:anno-dismissed:${a.until}|${a.title}` : "";
  let dismissed = false;
  try { dismissed = !!key && localStorage.getItem(key) === "1"; } catch { /* ignore */ }
  if (!a || a.mode !== "note" || dismissed) { slot.innerHTML = ""; return; }
  const who = a.who ? ctx.walkers.find(w => w.id === a.who) : null;
  const fresh = slot.dataset.shown !== key;
  slot.dataset.shown = key;
  slot.innerHTML = `<aside class="card anno${who ? " anno-who" : ""}" aria-label="Announcement"${who ? ` style="--c:var(--walker-${who.color})"` : ""}>
    ${who ? `<span class="crest crest-56 anno-crest" aria-hidden="true">${who.crest}</span>` : ""}
    <span class="kicker">${esc(a.kicker || "From the bench")}</span>
    <h2 class="h3">${rich(a.title || "")}</h2>
    ${a.lead ? `<p class="sub">${rich(a.lead)}</p>` : ""}
    ${who && a.cta ? `<a class="textlink" href="#/walker/${who.id}">${esc(a.cta)} →</a>` : ""}
    <button class="anno-close" type="button" aria-label="Dismiss announcement">✕</button></aside>`;
  slot.querySelector(".anno-close").addEventListener("click", () => {
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
    slot.innerHTML = "";
  });
  if (fresh && who) {           // once per page load: the leaves go up for the news
    const c = slot.querySelector(".anno-crest");
    setTimeout(() => {
      const b = c?.getBoundingClientRect();
      if (b) burst({ x: b.left + b.width / 2, y: b.top + b.height / 2, count: 26, power: .6, from: c });
    }, 900);
  }
}

function celebrate(from, to) {
  const key = from === "muster" && to === "walking" ? "kickoff" : from === "walking" && to === "counting" ? "bell" : null;
  if (!key) return;
  burst({});
  toast(esc(COPY.MILESTONE_TOASTS[key]));
}

function render({ transition = false, focus = false } = {}) {
  const now = clock();
  const before = ctx?.phase;
  ctx = buildContext(now);
  sig = signature(now);
  const found = currentRoute();
  route = found.route;
  params = found.params;
  const swap = () => {
    view.innerHTML = route.mod.render(ctx, params);
    applyChrome(now);
    if (route.mod.mount) route.mod.mount(view, ctx, params); else reveal(view);
  };
  if (transition) {
    try { scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { scrollTo(0, 0); }
  }
  if (transition && document.startViewTransition && !reduced()) {
    document.startViewTransition(swap);
  } else {
    swap();
    if (transition && !reduced()) {
      view.classList.remove("view-enter");
      void view.offsetWidth;
      view.classList.add("view-enter");
    }
  }
  if (focus) view.focus({ preventScroll: true });
  if (before) celebrate(before, ctx.phase);
  if (before === "muster" && ctx.phase !== "muster") grove?.begin();   // the gun: the tree starts to turn
}

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
addEventListener("hashchange", () => render({ transition: true, focus: true }));

function tick() {
  if (document.hidden) return;                          // a pocketed phone does no work
  const now = clock();
  if (signature(now) !== sig) { render(); return; }
  root.dataset.daypart = daypart(now);
  if (ctx.phase === "muster") document.getElementById("phaseChip").textContent = kickoffChip(now);
  route.mod.tick?.(view, { ...ctx, now });
}
setInterval(tick, 1000);
document.addEventListener("visibilitychange", tick);

// Theme: Auto → Dark → Light, remembered per device. The tab bar's fifth button (and the desktop
// header's) cycles it; its label always says what it is now.
const THEMES = ["auto", "dark", "light"];
const readTheme = () => root.dataset.theme || "auto";
const toggles = [...document.querySelectorAll(".theme-toggle")];
const showTheme = () => {
  const t = readTheme(), name = t[0].toUpperCase() + t.slice(1);
  toggles.forEach(b => {
    b.querySelector(".theme-val").textContent = name;
    b.setAttribute("aria-label", `Theme: ${name}. Tap to change.`);
  });
};
toggles.forEach(b => b.addEventListener("click", () => {
  const next = THEMES[(THEMES.indexOf(readTheme()) + 1) % THEMES.length];
  if (next === "auto") delete root.dataset.theme; else root.dataset.theme = next;
  try { next === "auto" ? localStorage.removeItem("stridetober:theme") : localStorage.setItem("stridetober:theme", next); } catch { /* ignore */ }
  showTheme();
}));
showTheme();

// ── iOS tab bar pin ───────────────────────────────────────
// iOS 26 WebKit mis-anchors position:fixed; bottom:0 once the toolbar collapses or the
// keyboard has been up: the bar floats up the page and leaves a gap. On iOS only, pin it
// from the top at the visual viewport's bottom edge instead, re-measured every frame it moves.
{
  const bar = document.getElementById("tabbar");
  const vv = window.visualViewport;
  const iOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (vv && iOS) {
    let queued = false;
    const pin = () => {
      queued = false;
      if (innerWidth >= 1024) { bar.style.top = bar.style.bottom = ""; return; }
      const top = vv.offsetTop + vv.height - bar.offsetHeight;
      bar.style.bottom = "auto";
      bar.style.top = `${Math.round(top)}px`;
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(pin); } };
    vv.addEventListener("resize", queue);
    vv.addEventListener("scroll", queue);
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    addEventListener("orientationchange", queue);
    addEventListener("pageshow", queue);
    document.addEventListener("visibilitychange", queue);
    document.addEventListener("focusout", () => setTimeout(queue, 300));   // keyboard closed
    pin();
  }
}

// ── header auto-hide (M16) ────────────────────────────────
{
  const head = document.getElementById("siteHead");
  let lastY = 0, ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.max(0, scrollY);
      if (y > 120 && y > lastY + 5) head.classList.add("is-hidden");
      else if (y < lastY - 5 || y < 120) head.classList.remove("is-hidden");
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
  head.addEventListener("focusin", () => head.classList.remove("is-hidden"));
}

// ── small cheek ───────────────────────────────────────────
{
  let saved = document.title;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { saved = document.title; document.title = "🍂 Come back and walk"; }
    else document.title = saved;
  });
  console.log("%c⚖️ The Fairly Impartial Judge sees you reading the source. Go walk.", "font: 600 14px Georgia, serif; color: #A6420E");
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-primary");
  if (btn) puff(btn);
});
document.addEventListener("pointerdown", e => {
  const c = e.target.closest(".crest");
  if (!c || reduced()) return;
  c.classList.remove("wiggle");
  void c.offsetWidth;
  c.classList.add("wiggle");
});

// ── stale page guard ──────────────────────────────────────
// A phone keeps this page for days, so a walker who paid — or a week that was
// posted — can sit behind a cached copy. Whenever the tab comes back, re-fetch
// the two data files past every cache; reload only if they really changed.
{
  const mine = JSON.stringify([WALKERS, WEEKS, ANNOUNCEMENT]);
  let checked = 0;
  const catchUp = async () => {
    if (DEMO || document.hidden || Date.now() - checked < 600_000) return;
    checked = Date.now();
    try {
      const [w, k] = await Promise.all([
        import(`../data/walkers.js?t=${checked}`),
        import(`../data/weeks.js?t=${checked}`),
      ]);
      if (JSON.stringify([w.WALKERS, k.WEEKS, k.ANNOUNCEMENT]) !== mine) location.reload();
    } catch { /* offline — try again next time */ }
  };
  document.addEventListener("visibilitychange", catchUp);
  setInterval(catchUp, 900_000);
}

rake(document.getElementById("leafPile"), document.getElementById("rakeLine"), COPY.RAKE_LINES, COPY.JUMP_LINES);
render();
// After the first render, so the pile (the tree's ground line) is where it will stay.
grove = tree(document.getElementById("tree"), document.getElementById("leafPile"), document.getElementById("siteHead"), COPY.CRITTER_LINES, { waiting: ctx.phase === "muster" });
gusts(document.querySelector(".leaves"), grove.gust);
wildlife(document.getElementById("wild"), COPY.CRITTER_LINES);
